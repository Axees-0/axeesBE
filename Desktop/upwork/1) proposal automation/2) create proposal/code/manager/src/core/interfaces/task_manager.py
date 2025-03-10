"""
Task manager interface for Claude Task Manager.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any

from src.core.models.instance import ClaudeInstance, RuntimeType


class TaskManagerInterface(ABC):
    """Interface for the main task manager."""
    
    @abstractmethod
    def start_instance(self, project_dir: str, prompt_path: Optional[str] = None, 
                       prompt_text: Optional[str] = None, 
                       runtime_type: RuntimeType = RuntimeType.TMUX,
                       open_terminal: bool = False) -> str:
        """
        Start a new Claude instance.
        
        Args:
            project_dir: Directory of the project
            prompt_path: Path to a prompt file (optional)
            prompt_text: Direct prompt text (optional)
            runtime_type: Type of runtime to use (tmux or terminal)
            open_terminal: Whether to open a terminal window
            
        Returns:
            ID of the created instance
        """
        pass
        
    @abstractmethod
    def stop_instance(self, instance_id: str) -> bool:
        """Stop a running Claude instance."""
        pass
        
    @abstractmethod
    def delete_instance(self, instance_id: str) -> bool:
        """Delete an instance from the manager."""
        pass
        
    @abstractmethod
    def get_instance(self, instance_id: str) -> Optional[ClaudeInstance]:
        """Get a specific instance by ID."""
        pass
        
    @abstractmethod
    def list_instances(self) -> List[Dict[str, Any]]:
        """List all instances and their status."""
        pass
        
    @abstractmethod
    def send_prompt_to_instance(self, instance_id: str, prompt_text: str, 
                              submit: bool = True) -> bool:
        """Send a prompt to an existing instance."""
        pass
        
    @abstractmethod
    def interrupt_instance(self, instance_id: str) -> bool:
        """Interrupt an instance (send ESC key)."""
        pass
        
    @abstractmethod
    def view_terminal(self, instance_id: str) -> bool:
        """Open a terminal window to view the instance."""
        pass
        
    @abstractmethod
    def get_instance_content(self, instance_id: str) -> Optional[str]:
        """Get the current content from an instance."""
        pass
        
    @abstractmethod
    def sync_with_system(self) -> int:
        """
        Synchronize instances with system processes.
        
        Returns:
            Number of instances updated.
        """
        pass
        
    @abstractmethod
    def load_instances(self) -> None:
        """Load instances from storage."""
        pass
        
    @abstractmethod
    def save_instances(self) -> bool:
        """Save instances to storage."""
        pass
