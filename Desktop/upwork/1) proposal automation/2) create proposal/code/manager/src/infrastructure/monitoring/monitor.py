"""
Monitoring system for Claude instances.
"""
import logging
import threading
import time
import os
import re
from typing import Dict, List, Optional, Set

from src.utils.logging import get_task_manager_logger
from src.utils.config import get_config
from src.core.models.instance import ClaudeInstance, DetailedStatus
from src.core.events import EventType, subscribe, publish
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager
from src.core.task_manager import ClaudeTaskManager


class InstanceMonitor:
    """Monitor for Claude instances."""
    
    def __init__(self, task_manager: ClaudeTaskManager, logger=None):
        """
        Initialize the monitor.
        
        Args:
            task_manager: Task manager instance
            logger: Optional logger instance
        """
        self.task_manager = task_manager
        self.logger = logger or logging.getLogger(__name__)
        self.running = False
        self.thread = None
        self.config = get_config()
        self.auto_respond = self.config.get("monitoring.auto_respond_to_prompts", True)
        self.check_interval = self.config.get("monitoring.check_interval", 5)
        self.max_active_time = self.config.get("dashboard.max_active_time", 0)
        self.timeout_action = self.config.get("dashboard.timeout_action", "interrupt")
        
    def start(self):
        """Start the monitor."""
        if self.running:
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        
    def stop(self):
        """Stop the monitor."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
            
    def _monitor_loop(self):
        """Main monitoring loop."""
        while self.running:
            try:
                # Synchronize instances with system processes
                self.task_manager.sync_with_system()
                
                # Check each running instance
                for instance_id, instance in self.task_manager.instances.items():
                    if instance.status == "running":
                        self._check_instance(instance)
                        
            except Exception as e:
                self.logger.error(f"Error in monitor loop: {e}")
                
            # Sleep for the check interval
            time.sleep(self.check_interval)
            
    def _check_instance(self, instance: ClaudeInstance):
        """Check a specific instance."""
        try:
            # Get the current content
            content = self.task_manager.get_instance_content(instance.id)
            if not content:
                return
                
            # Check for prompts that need responses
            if self.auto_respond:
                self._handle_auto_responses(instance, content)
                
            # Check for long-running generations
            if self.max_active_time > 0 and instance.detailed_status == DetailedStatus.RUNNING:
                self._check_long_running(instance)
                
        except Exception as e:
            self.logger.error(f"Error checking instance {instance.id}: {e}")
            
    def _handle_auto_responses(self, instance: ClaudeInstance, content: str):
        """Handle automatic responses to prompts."""
        # Check for common prompts
        auto_respond_phrases = {
            "Do you want to": "y",
            "Would you like to": "y",
            "Shall I proceed": "y",
            "Continue?": "y",
            "Proceed?": "y",
            "Press Enter to continue": "Enter",
            "Press any key to continue": "Enter"
        }
        
        # Check each phrase
        for phrase, response in auto_respond_phrases.items():
            if phrase in content:
                self.logger.info(f"Auto-responding to '{phrase}' in instance {instance.id}")
                
                # Determine which key to send
                if response == "y":
                    self.task_manager.send_prompt_to_instance(instance.id, "y")
                elif response == "Enter":
                    # Use the appropriate process manager
                    runtime_type = "tmux" if instance.use_tmux else "terminal"
                    process_manager = self.task_manager._get_process_manager(runtime_type)
                    if process_manager:
                        process_manager.send_keystroke(instance, "Enter")
                        
                # Update yes count for tracking
                instance.yes_count += 1
                instance.last_yes_time = time.time()
                
                # Save instances
                self.task_manager.save_instances()
                
                # Publish event
                publish(EventType.PROMPT_DETECTED, {
                    "instance_id": instance.id,
                    "prompt": phrase,
                    "response": response
                })
                
    def _check_long_running(self, instance: ClaudeInstance):
        """Check for long-running generations and take action if needed."""
        # Skip if active_since is not set
        if not instance.active_since:
            return
            
        # Calculate active time in minutes
        active_minutes = (time.time() - instance.active_since) / 60
        
        # Check if it exceeds the maximum
        if active_minutes >= self.max_active_time:
            self.logger.info(f"Instance {instance.id} has been generating for {active_minutes:.1f} minutes, "
                           f"taking action: {self.timeout_action}")
            
            # Take the configured action
            if self.timeout_action == "interrupt":
                self.task_manager.interrupt_instance(instance.id)
            elif self.timeout_action == "stop":
                self.task_manager.stop_instance(instance.id)
            elif self.timeout_action == "delete":
                self.task_manager.delete_instance(instance.id)
                
            # Publish event
            publish(EventType.ERROR_OCCURRED, {
                "instance_id": instance.id,
                "error": f"Generation timeout after {active_minutes:.1f} minutes",
                "action_taken": self.timeout_action
            })


def run_monitor():
    """Run the instance monitor as a standalone process."""
    # Set up logger
    logger = get_task_manager_logger()
    
    # Get configuration
    config = get_config()
    
    # Get instance file path
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    instance_file = config.get("storage.instances_file", "config/claude_instances.json")
    if not os.path.isabs(instance_file):
        instance_file = os.path.join(root_dir, instance_file)
    
    # Set up task manager
    storage = JSONInstanceStorage(instance_file, logger)
    tmux_manager = TmuxProcessManager(logger)
    terminal_manager = TerminalProcessManager(logger)
    
    task_manager = ClaudeTaskManager(
        storage=storage,
        tmux_manager=tmux_manager,
        terminal_manager=terminal_manager,
        logger=logger
    )
    
    # Create and start the monitor
    monitor = InstanceMonitor(task_manager, logger)
    
    try:
        logger.info("Starting Claude instance monitor")
        monitor.start()
        
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Stopping Claude instance monitor")
        monitor.stop()
