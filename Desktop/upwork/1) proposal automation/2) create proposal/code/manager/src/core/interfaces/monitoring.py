"""
Monitoring interfaces for Claude Task Manager.
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

from src.core.models.instance import ClaudeInstance


class ContentMonitorInterface(ABC):
    """Interface for monitoring content in Claude instances."""
    
    @abstractmethod
    def get_content(self, instance: ClaudeInstance) -> Optional[str]:
        """Get the current content from the instance's process."""
        pass
        
    @abstractmethod
    def detect_prompts(self, content: str) -> List[Dict[str, Any]]:
        """
        Detect prompts that need responses in the content.
        
        Returns:
            List of dictionaries with prompt information.
        """
        pass
        
    @abstractmethod
    def respond_to_prompt(self, instance: ClaudeInstance, prompt_type: str) -> bool:
        """Respond to a detected prompt."""
        pass
        
    @abstractmethod
    def detect_generation_status(self, content: str) -> Dict[str, Any]:
        """
        Detect if Claude is actively generating content.
        
        Returns:
            Dictionary with generation status information.
        """
        pass
        
    @abstractmethod
    def start_monitoring(self, instance: ClaudeInstance) -> bool:
        """Start monitoring this instance."""
        pass
        
    @abstractmethod
    def stop_monitoring(self, instance: ClaudeInstance) -> bool:
        """Stop monitoring this instance."""
        pass
