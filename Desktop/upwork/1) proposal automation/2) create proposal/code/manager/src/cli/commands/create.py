"""
Command to create a new Claude instance.
"""
import os
from typing import Optional

from src.core.models.instance import RuntimeType
from src.utils.logging import get_task_manager_logger
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager
from src.core.task_manager import ClaudeTaskManager
from src.utils.config import get_config


def create_instance(project_dir: str, prompt_file: Optional[str] = None, 
                   prompt_text: Optional[str] = None, runtime: str = "tmux", 
                   open_terminal: bool = False) -> str:
    """
    Create a new Claude instance.
    
    Args:
        project_dir: Directory of the project
        prompt_file: Path to a prompt file (optional)
        prompt_text: Direct prompt text (optional)
        runtime: Type of runtime to use ("tmux" or "terminal")
        open_terminal: Whether to open a terminal window
        
    Returns:
        ID of the created instance
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
    
    # Validate project directory
    if not os.path.exists(project_dir):
        raise ValueError(f"Project directory does not exist: {project_dir}")
    
    # Validate prompt file if provided
    if prompt_file and not os.path.exists(prompt_file):
        raise ValueError(f"Prompt file does not exist: {prompt_file}")
    
    # Determine runtime type
    runtime_type = RuntimeType.TMUX if runtime.lower() == "tmux" else RuntimeType.TERMINAL
    
    # Create the instance
    instance_id = task_manager.start_instance(
        project_dir=project_dir,
        prompt_path=prompt_file,
        prompt_text=prompt_text,
        runtime_type=runtime_type,
        open_terminal=open_terminal
    )
    
    return instance_id
