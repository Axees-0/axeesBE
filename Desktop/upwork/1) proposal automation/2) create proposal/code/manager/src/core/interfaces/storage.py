"""
Storage interfaces for Claude Task Manager.
"""
from abc import ABC, abstractmethod
from typing import Dict, Optional, List

from src.core.models.instance import ClaudeInstance


class InstanceStorageInterface(ABC):
    """Interface for instance storage implementations."""
    
    @abstractmethod
    def load_instances(self) -> Dict[str, ClaudeInstance]:
        """Load all instances from storage."""
        pass
        
    @abstractmethod
    def save_instances(self, instances: Dict[str, ClaudeInstance]) -> bool:
        """Save instances to storage."""
        pass
        
    @abstractmethod
    def get_instance(self, instance_id: str) -> Optional[ClaudeInstance]:
        """Get a specific instance by ID."""
        pass
        
    @abstractmethod
    def update_instance(self, instance: ClaudeInstance) -> bool:
        """Update a specific instance."""
        pass
        
    @abstractmethod
    def delete_instance(self, instance_id: str) -> bool:
        """Delete a specific instance."""
        pass
