"""
Command to list Claude instances.
"""
import os
from typing import List, Dict, Any

from src.utils.logging import get_task_manager_logger
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager
from src.core.task_manager import ClaudeTaskManager
from src.utils.config import get_config


def list_instances(status_filter: str = "all") -> List[Dict[str, Any]]:
    """
    List Claude instances.
    
    Args:
        status_filter: Filter instances by status ("all", "running", "stopped")
        
    Returns:
        List of instances
    """
    # Set up the task manager
    config = get_config()
    logger = get_task_manager_logger()
    
    # Get instance file path
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    instance_file = config.get("storage.instances_file", "config/claude_instances.json")
    if not os.path.isabs(instance_file):
        instance_file = os.path.join(root_dir, instance_file)
    
    # Create necessary components
    storage = JSONInstanceStorage(instance_file, logger)
    tmux_manager = TmuxProcessManager(logger)
    terminal_manager = TerminalProcessManager(logger)
    
    task_manager = ClaudeTaskManager(
        storage=storage,
        tmux_manager=tmux_manager,
        terminal_manager=terminal_manager,
        logger=logger
    )
    
    # Force synchronization with system processes
    task_manager.sync_with_system()
    
    # Get instances
    instances = task_manager.list_instances()
    
    # Filter instances if needed
    if status_filter.lower() \!= "all":
        instances = [
            instance for instance in instances 
            if instance["status"].lower() == status_filter.lower()
        ]
    
    return instances
