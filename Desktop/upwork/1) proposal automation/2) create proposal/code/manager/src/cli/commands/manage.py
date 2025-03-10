"""
Commands to manage Claude instances.
"""
import os
from typing import Optional

from src.utils.logging import get_task_manager_logger
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager
from src.core.task_manager import ClaudeTaskManager
from src.utils.config import get_config


def _get_task_manager():
    """Get a task manager instance."""
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
    
    return ClaudeTaskManager(
        storage=storage,
        tmux_manager=tmux_manager,
        terminal_manager=terminal_manager,
        logger=logger
    )


def stop_instance(instance_id: str) -> bool:
    """
    Stop a Claude instance.
    
    Args:
        instance_id: ID of the instance to stop
        
    Returns:
        Success flag
    """
    task_manager = _get_task_manager()
    return task_manager.stop_instance(instance_id)


def delete_instance(instance_id: str) -> bool:
    """
    Delete a Claude instance.
    
    Args:
        instance_id: ID of the instance to delete
        
    Returns:
        Success flag
    """
    task_manager = _get_task_manager()
    return task_manager.delete_instance(instance_id)


def view_instance(instance_id: str) -> bool:
    """
    Open a terminal window to view a Claude instance.
    
    Args:
        instance_id: ID of the instance to view
        
    Returns:
        Success flag
    """
    task_manager = _get_task_manager()
    return task_manager.view_terminal(instance_id)


def send_prompt(instance_id: str, prompt_file: Optional[str] = None, 
               prompt_text: Optional[str] = None, submit: bool = True) -> bool:
    """
    Send a prompt to a Claude instance.
    
    Args:
        instance_id: ID of the instance to send to
        prompt_file: Path to a prompt file (optional)
        prompt_text: Direct prompt text (optional)
        submit: Whether to submit the prompt
        
    Returns:
        Success flag
    """
    task_manager = _get_task_manager()
    
    # Get prompt content
    if prompt_file and os.path.exists(prompt_file):
        with open(prompt_file, 'r') as f:
            prompt_content = f.read()
    elif prompt_text:
        prompt_content = prompt_text
    else:
        raise ValueError("Either prompt_file or prompt_text must be provided")
    
    # Send the prompt
    return task_manager.send_prompt_to_instance(
        instance_id=instance_id,
        prompt_text=prompt_content,
        submit=submit
    )
