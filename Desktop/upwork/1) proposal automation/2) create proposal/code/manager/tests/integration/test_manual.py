#!/usr/bin/env python3
"""
Manual test script to verify the file creation dialog detection.
This creates a real Claude instance that will try to create a file.
"""

import os
import sys
import time

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.claude_task_manager import ClaudeTaskManager

def main():
    # Path to project directory and prompt
    project_dir = os.path.join(os.getcwd(), "test_dir")
    prompt_path = os.path.join(project_dir, "file_creation_prompt.txt")
    
    print(f"Starting test with:")
    print(f"  Project directory: {project_dir}")
    print(f"  Prompt file: {prompt_path}")
    
    # Create task manager
    manager = ClaudeTaskManager()
    
    # Start a Claude instance with our prompt
    instance_id = manager.start_instance(
        project_dir=project_dir,
        prompt_path=prompt_path,
        use_tmux=True,
        open_terminal=True  # This opens a terminal window so you can see what's happening
    )
    
    print(f"Started Claude instance with ID: {instance_id}")
    print("A terminal window should open showing the Claude session.")
    print("Watch to see if the UI dialog with '❯ Yes' is detected and responded to.")
    print("\nThe log will show details about the detection and response.")
    print("You can check claude_manager.log for the full log after the test.")
    
    # Keep running for a while so user can observe
    try:
        print("\nPress Ctrl+C when finished observing...")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    
    print("Test complete!")

if __name__ == "__main__":
    main()