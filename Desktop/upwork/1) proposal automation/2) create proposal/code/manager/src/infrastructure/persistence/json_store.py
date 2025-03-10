"""
JSON file-based storage for Claude instances.
"""
import os
import json
import logging
import threading
from typing import Dict, Optional, List, Any

from src.core.interfaces.storage import InstanceStorageInterface
from src.core.models.instance import ClaudeInstance


class JSONInstanceStorage(InstanceStorageInterface):
    """Store instances in a JSON file."""
    
    def __init__(self, file_path: str, logger=None):
        self.file_path = file_path
        self.logger = logger or logging.getLogger(__name__)
        self._lock = threading.RLock()
        
    def load_instances(self) -> Dict[str, ClaudeInstance]:
        """Load instances from the JSON file."""
        with self._lock:
            if not os.path.exists(self.file_path):
                return {}
            
            try:
                with open(self.file_path, 'r') as f:
                    data = json.load(f)
                    
                instances = {}
                for instance_data in data:
                    try:
                        instance_id = instance_data.get('id')
                        if not instance_id:
                            continue
                            
                        instance = ClaudeInstance.from_dict(instance_data)
                        instances[instance_id] = instance
                    except Exception as e:
                        self.logger.error(f"Error parsing instance data: {e}")
                        continue
                        
                return instances
            except Exception as e:
                self.logger.error(f"Error loading instances from {self.file_path}: {e}")
                return {}
                
    def save_instances(self, instances: Dict[str, ClaudeInstance]) -> bool:
        """Save instances to the JSON file."""
        with self._lock:
            try:
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
                
                # Convert instances to list of dictionaries
                instance_list = [instance.to_dict() for instance in instances.values()]
                
                with open(self.file_path, 'w') as f:
                    json.dump(instance_list, f, indent=4)
                    
                return True
            except Exception as e:
                self.logger.error(f"Error saving instances to {self.file_path}: {e}")
                return False
                
    def get_instance(self, instance_id: str) -> Optional[ClaudeInstance]:
        """Get a specific instance by ID."""
        instances = self.load_instances()
        return instances.get(instance_id)
        
    def update_instance(self, instance: ClaudeInstance) -> bool:
        """Update a specific instance."""
        with self._lock:
            instances = self.load_instances()
            instances[instance.id] = instance
            return self.save_instances(instances)
            
    def delete_instance(self, instance_id: str) -> bool:
        """Delete a specific instance."""
        with self._lock:
            instances = self.load_instances()
            if instance_id in instances:
                del instances[instance_id]
                return self.save_instances(instances)
            return False
