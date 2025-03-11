#!/usr/bin/env python3
import os
import sys
import json
import tempfile
import shutil
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import the needed modules
from src.core.task_manager import ClaudeTaskManager
from src.utils.config import load_config
from src.utils.logging import get_task_manager_logger
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager

def main():
    """Run a test with the card layout test prompt."""
    print("Starting card layout test prompt...")
    
    # Create a temporary directory for the test
    test_dir = tempfile.mkdtemp(prefix="claude_card_layout_test_")
    print(f"Created test directory: {test_dir}")
    
    # Copy the test prompt to the temporary directory
    prompt_path = os.path.join(os.path.dirname(__file__), "test_prompt.txt")
    test_prompt_path = os.path.join(test_dir, "card_layout_prompt.txt")
    shutil.copyfile(prompt_path, test_prompt_path)
    print(f"Copied prompt to: {test_prompt_path}")
    
    # Load configuration
    config = load_config()
    
    # Set up logger
    logger = get_task_manager_logger()
    
    # Set up task manager components
    instances_json = os.path.join(test_dir, "test_instances.json")
    storage = JSONInstanceStorage(instances_json, logger)
    tmux_manager = TmuxProcessManager(logger)
    terminal_manager = TerminalProcessManager(logger)
    
    # Create a ClaudeTaskManager instance
    manager = ClaudeTaskManager(
        storage=storage,
        tmux_manager=tmux_manager,
        terminal_manager=terminal_manager,
        logger=logger
    )
    
    # Create a new Claude instance
    instance_id = manager.start_instance(
        project_dir=test_dir,
        prompt_path=test_prompt_path
    )
    
    print(f"Created instance {instance_id} with card layout test prompt")
    print(f"Access the dashboard to see the card layout")
    print("Dashboard URL: http://localhost:5001")
    
    print("\nPress Ctrl+C to stop the test when finished")
    
    try:
        # Keep the script running until the user presses Ctrl+C
        while True:
            input("Press Enter to check instance status, or Ctrl+C to exit...")
            instance = manager.get_instance(instance_id)
            print(f"Instance {instance_id} status: {instance.status}")
    except KeyboardInterrupt:
        print("\nStopping test...")
    finally:
        # Clean up the test directory
        manager.stop_instance(instance_id)
        print(f"Stopped instance {instance_id}")
        
        # Don't remove the directory so the user can see the results
        print(f"Test directory (not removed): {test_dir}")
        print("Test completed.")

if __name__ == "__main__":
    main()