"""
Configuration utilities for Claude Task Manager.
"""
import os
import json
from typing import Dict, Any, Optional


class ConfigManager:
    """Manages application configuration."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the configuration manager.
        
        Args:
            config_path: Path to configuration file (optional)
        """
        if not config_path:
            # Use default config file in the config directory
            root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            config_path = os.path.join(root_dir, 'config', 'config.json')
            
        self.config_path = config_path
        self.config = self._load_config()
        
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file."""
        if not os.path.exists(self.config_path):
            return self._get_default_config()
            
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except Exception:
            return self._get_default_config()
            
    def _save_config(self) -> bool:
        """Save configuration to file."""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            
            with open(self.config_path, 'w') as f:
                json.dump(self.config, f, indent=4)
                
            return True
        except Exception:
            return False
            
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration."""
        return {
            "dashboard": {
                "port": 5000,
                "host": "0.0.0.0",
                "refresh_interval": 3,
                "max_active_time": 0,
                "timeout_action": "interrupt"
            },
            "storage": {
                "instances_file": "config/claude_instances.json"
            },
            "logging": {
                "level": "INFO",
                "console_level": "INFO",
                "log_file": "logs/claude_manager.log"
            },
            "monitoring": {
                "check_interval": 5,
                "auto_respond_to_prompts": True
            }
        }
        
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value by key.
        
        Args:
            key: Configuration key (can use dot notation for nested values)
            default: Default value if key is not found
            
        Returns:
            Configuration value or default
        """
        # Handle dot notation for nested values
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
                
        return value
        
    def set(self, key: str, value: Any) -> bool:
        """
        Set a configuration value.
        
        Args:
            key: Configuration key (can use dot notation for nested values)
            value: Value to set
            
        Returns:
            Success flag
        """
        # Handle dot notation for nested values
        keys = key.split('.')
        config = self.config
        
        # Navigate to the correct location in the config
        for i, k in enumerate(keys[:-1]):
            if k not in config:
                config[k] = {}
            config = config[k]
            
        # Set the value
        config[keys[-1]] = value
        
        # Save the updated config
        return self._save_config()
        
    def get_all(self) -> Dict[str, Any]:
        """Get the entire configuration."""
        return self.config.copy()
        
    def reset(self) -> bool:
        """Reset configuration to defaults."""
        self.config = self._get_default_config()
        return self._save_config()


# Global configuration instance
config_manager = ConfigManager()


def get_config() -> ConfigManager:
    """Get the global configuration manager."""
    return config_manager
