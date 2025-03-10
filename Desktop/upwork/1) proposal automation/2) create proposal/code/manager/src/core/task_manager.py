"""
Task manager implementation for Claude Task Manager.
"""
import os
import logging
import time
import threading
from typing import Dict, List, Optional, Any, Callable, Type

from src.core.models.instance import ClaudeInstance, RuntimeType, InstanceStatus, DetailedStatus
from src.core.interfaces.storage import InstanceStorageInterface
from src.core.interfaces.process import ProcessManagerInterface
from src.core.interfaces.task_manager import TaskManagerInterface
from src.core.events import EventType, publish


class ClaudeTaskManager(TaskManagerInterface):
    """
    Main task manager for Claude instances.
    """
    
    def __init__(self, 
                 storage: InstanceStorageInterface,
                 tmux_manager: ProcessManagerInterface,
                 terminal_manager: ProcessManagerInterface,
                 logger=None):
        """
        Initialize the task manager.
        
        Args:
            storage: Storage implementation for instance data
            tmux_manager: Process manager for tmux sessions
            terminal_manager: Process manager for terminal sessions
            logger: Optional logger instance
        """
        self.storage = storage
        self.process_managers = {
            RuntimeType.TMUX: tmux_manager,
            RuntimeType.TERMINAL: terminal_manager
        }
        self.logger = logger or logging.getLogger(__name__)
        self.instances = {}
        self.monitor_threads = {}
        self.lock = threading.RLock()
        
        # Load instances from storage
        self.load_instances()
        
    def _get_process_manager(self, runtime_type: RuntimeType) -> ProcessManagerInterface:
        """Get the appropriate process manager for the runtime type."""
        return self.process_managers.get(runtime_type)
        
    def start_instance(self, project_dir: str, prompt_path: Optional[str] = None, 
                       prompt_text: Optional[str] = None, 
                       runtime_type: RuntimeType = RuntimeType.TMUX,
                       open_terminal: bool = False) -> str:
        """Start a new Claude instance."""
        # Normalize project directory
        project_dir = os.path.normpath(project_dir)
        
        # Create a new instance
        instance = ClaudeInstance.create(
            project_dir=project_dir,
            prompt_path=prompt_path or prompt_text or "Direct prompt",
            runtime_type=runtime_type
        )
        
        # Get the appropriate process manager
        process_manager = self._get_process_manager(runtime_type)
        if not process_manager:
            raise ValueError(f"No process manager available for runtime type: {runtime_type}")
        
        # Launch the process
        success = process_manager.launch_process(
            instance=instance,
            prompt_path=prompt_path,
            prompt_text=prompt_text
        )
        
        if not success:
            raise RuntimeError(f"Failed to launch process for instance {instance.id}")
        
        # If requested, open a terminal window
        if open_terminal:
            process_manager.open_terminal(instance)
        
        # Store the instance
        with self.lock:
            self.instances[instance.id] = instance
            self.save_instances()
        
        # Publish event
        publish(EventType.INSTANCE_CREATED, {"instance_id": instance.id})
        
        return instance.id
        
    def stop_instance(self, instance_id: str) -> bool:
        """Stop a running Claude instance."""
        with self.lock:
            instance = self.instances.get(instance_id)
            if not instance:
                self.logger.error(f"Instance {instance_id} not found")
                return False
            
            # Get the appropriate process manager
            runtime_type = RuntimeType.TMUX if instance.use_tmux else RuntimeType.TERMINAL
            process_manager = self._get_process_manager(runtime_type)
            if not process_manager:
                self.logger.error(f"No process manager available for runtime type: {runtime_type}")
                return False
            
            # Stop the process
            success = process_manager.stop_process(instance)
            
            # Update instance status
            if success:
                instance.status = InstanceStatus.STOPPED
                self.save_instances()
                publish(EventType.INSTANCE_STOPPED, {"instance_id": instance_id})
            
            return success
            
    def delete_instance(self, instance_id: str) -> bool:
        """Delete an instance from the manager."""
        with self.lock:
            instance = self.instances.get(instance_id)
            if not instance:
                self.logger.error(f"Instance {instance_id} not found")
                return False
            
            # If instance is running, stop it first
            if instance.status == InstanceStatus.RUNNING:
                self.stop_instance(instance_id)
            
            # Remove the instance
            del self.instances[instance_id]
            self.save_instances()
            
            # Publish event
            publish(EventType.INSTANCE_DELETED, {"instance_id": instance_id})
            
            return True
            
    def get_instance(self, instance_id: str) -> Optional[ClaudeInstance]:
        """Get a specific instance by ID."""
        return self.instances.get(instance_id)
        
    def list_instances(self) -> List[Dict[str, Any]]:
        """List all instances and their status."""
        result = []
        for instance_id, instance in self.instances.items():
            # Convert instance to dictionary
            instance_dict = instance.to_dict()
            
            # Add additional UI-friendly fields
            runtime_type = "tmux" if instance.use_tmux else "terminal"
            instance_dict["runtime_type_display"] = runtime_type
            
            result.append(instance_dict)
            
        return result
        
    def send_prompt_to_instance(self, instance_id: str, prompt_text: str, 
                              submit: bool = True) -> bool:
        """Send a prompt to an existing instance."""
        with self.lock:
            instance = self.instances.get(instance_id)
            if not instance:
                self.logger.error(f"Instance {instance_id} not found")
                return False
                
            # Get the appropriate process manager
            runtime_type = RuntimeType.TMUX if instance.use_tmux else RuntimeType.TERMINAL
            process_manager = self._get_process_manager(runtime_type)
            if not process_manager:
                self.logger.error(f"No process manager available for runtime type: {runtime_type}")
                return False
                
            # Send the prompt
            success = process_manager.send_prompt(instance, prompt_text, submit)
            
            # Publish event
            if success:
                publish(EventType.PROMPT_SENT, {
                    "instance_id": instance_id,
                    "prompt_length": len(prompt_text),
                    "submit": submit
                })
                
            return success
            
    def interrupt_instance(self, instance_id: str) -> bool:
        """Interrupt an instance (send ESC key)."""
        with self.lock:
            instance = self.instances.get(instance_id)
            if not instance:
                self.logger.error(f"Instance {instance_id} not found")
                return False
                
            # Get the appropriate process manager
            runtime_type = RuntimeType.TMUX if instance.use_tmux else RuntimeType.TERMINAL
            process_manager = self._get_process_manager(runtime_type)
            if not process_manager:
                self.logger.error(f"No process manager available for runtime type: {runtime_type}")
                return False
                
            # Send the ESC key
            return process_manager.send_keystroke(instance, "Escape")
            
    def view_terminal(self, instance_id: str) -> bool:
        """Open a terminal window to view the instance."""
        with self.lock:
            instance = self.instances.get(instance_id)
            if not instance:
                self.logger.error(f"Instance {instance_id} not found")
                return False
                
            # Get the appropriate process manager
            runtime_type = RuntimeType.TMUX if instance.use_tmux else RuntimeType.TERMINAL
            process_manager = self._get_process_manager(runtime_type)
            if not process_manager:
                self.logger.error(f"No process manager available for runtime type: {runtime_type}")
                return False
                
            # Open the terminal
            return process_manager.open_terminal(instance)
            
    def get_instance_content(self, instance_id: str) -> Optional[str]:
        """Get the current content from an instance."""
        instance = self.instances.get(instance_id)
        if not instance:
            self.logger.error(f"Instance {instance_id} not found")
            return None
            
        # Get the appropriate process manager
        runtime_type = RuntimeType.TMUX if instance.use_tmux else RuntimeType.TERMINAL
        process_manager = self._get_process_manager(runtime_type)
        if not process_manager:
            self.logger.error(f"No process manager available for runtime type: {runtime_type}")
            return None
            
        # Get the content
        return process_manager.get_process_content(instance)
        
    def sync_with_system(self) -> int:
        """
        Synchronize instances with system processes.
        
        Returns:
            Number of instances updated.
        """
        updated_count = 0
        
        # Check each instance to see if it's still running
        for instance_id, instance in list(self.instances.items()):
            if instance.status == InstanceStatus.RUNNING:
                # Get the appropriate process manager
                runtime_type = RuntimeType.TMUX if instance.use_tmux else RuntimeType.TERMINAL
                process_manager = self._get_process_manager(runtime_type)
                if not process_manager:
                    continue
                    
                # Check if the process is still active
                if not process_manager.is_process_active(instance):
                    instance.status = InstanceStatus.STOPPED
                    updated_count += 1
                    continue
                    
                # Get the current status
                status_info = process_manager.get_process_status(instance)
                
                # Update instance status
                if status_info["detailed_status"] \!= instance.detailed_status:
                    instance.detailed_status = status_info["detailed_status"]
                    updated_count += 1
                    
                # Update generation time if available
                if status_info["generation_time"]:
                    instance.generation_time = status_info["generation_time"]
                    updated_count += 1
                    
                # Update instance content if needed
                content = process_manager.get_process_content(instance)
                if content and (not hasattr(instance, 'tmux_content') or 
                              getattr(instance, 'tmux_content', '') \!= content):
                    instance.tmux_content = content
                    updated_count += 1
                    
                    # Publish content update event
                    publish(EventType.CONTENT_UPDATED, {
                        "instance_id": instance_id,
                        "content_length": len(content)
                    })
                    
                # Update active/ready times as needed
                current_time = time.time()
                if status_info["detailed_status"] == DetailedStatus.RUNNING:
                    if not instance.active_since:
                        instance.active_since = current_time
                        updated_count += 1
                elif status_info["detailed_status"] == DetailedStatus.READY:
                    if not instance.ready_since:
                        instance.ready_since = current_time
                        updated_count += 1
        
        # Save instances if any were updated
        if updated_count > 0:
            self.save_instances()
            
        return updated_count
        
    def load_instances(self) -> None:
        """Load instances from storage."""
        with self.lock:
            self.instances = self.storage.load_instances()
            
    def save_instances(self) -> bool:
        """Save instances to storage."""
        with self.lock:
            return self.storage.save_instances(self.instances)
