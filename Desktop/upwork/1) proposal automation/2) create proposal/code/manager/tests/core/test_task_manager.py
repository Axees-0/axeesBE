#!/usr/bin/env python3
"""
Test script for testing the task manager's find_project_dir_by_id function.
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.core.task_manager import ClaudeTaskManager
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager
import logging

# Set up logger
logger = logging.getLogger("test_task_manager")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

def test_find_project_dir_by_id():
    """Test finding a project directory by ID using the task manager."""
    # Set up task manager
    storage = JSONInstanceStorage("config/claude_instances.json", logger)
    tmux_manager = TmuxProcessManager(logger)
    terminal_manager = TerminalProcessManager(logger)
    
    task_manager = ClaudeTaskManager(
        storage=storage,
        tmux_manager=tmux_manager,
        terminal_manager=terminal_manager,
        logger=logger
    )
    
    # Test finding a project directory by ID
    project_id = "021897455790136661047"
    project_dir = task_manager.find_project_dir_by_id(project_id)
    
    print(f"ID: {project_id}")
    print(f"Directory: {project_dir}")

if __name__ == "__main__":
    test_find_project_dir_by_id()