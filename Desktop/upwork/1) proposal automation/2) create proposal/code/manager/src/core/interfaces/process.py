"""
Process management interfaces for Claude Task Manager.
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

from src.core.models.instance import ClaudeInstance


class ProcessManagerInterface(ABC):
    """Interface for process management implementations."""
    
    @abstractmethod
    def launch_process(self, instance: ClaudeInstance, prompt_path: Optional[str] = None, 
                       prompt_text: Optional[str] = None) -> bool:
        """Launch a new process for the given instance."""
        pass
        
    @abstractmethod
    def send_prompt(self, instance: ClaudeInstance, prompt_content: str, 
                    submit: bool = True) -> bool:
        """Send a prompt to an existing process."""
        pass
        
    @abstractmethod
    def stop_process(self, instance: ClaudeInstance) -> bool:
        """Stop the process associated with the instance."""
        pass
        
    @abstractmethod
    def is_process_active(self, instance: ClaudeInstance) -> bool:
        """Check if the process is still active."""
        pass
        
    @abstractmethod
    def get_process_content(self, instance: ClaudeInstance) -> Optional[str]:
        """Get the current content from the instance's process."""
        pass
        
    @abstractmethod
    def get_process_status(self, instance: ClaudeInstance) -> Dict[str, Any]:
        """Get detailed status information about the process."""
        pass
        
    @abstractmethod
    def send_keystroke(self, instance: ClaudeInstance, key: str) -> bool:
        """Send a keystroke to the process (e.g., Escape)."""
        pass
        
    @abstractmethod
    def open_terminal(self, instance: ClaudeInstance) -> bool:
        """Open a terminal window for the instance."""
        pass
