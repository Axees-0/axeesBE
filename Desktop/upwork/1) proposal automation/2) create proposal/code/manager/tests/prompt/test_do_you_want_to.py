#!/usr/bin/env python3
"""
Test script to verify the 'Do you want to' detection and response.
This creates a Claude instance that will request to execute a command.
"""

import os
import sys

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance

def main():
    # Create a prompt that will trigger Claude to ask for permission
    prompt = """Hello Claude! I'd like you to help me create a simple text file.

1. Please create a file called test_creation.txt in the current directory
2. Add the text "This file was successfully created to test the 'Do you want to' prompt detection"
3. Let me know when it's done

Thanks!
"""

    # Set up the manager
    manager = ClaudeTaskManager()
    
    # Get the current directory
    project_dir = os.getcwd()
    
    # Create a temporary prompt file
    prompt_file = os.path.join(project_dir, "test_prompt.txt")
    with open(prompt_file, 'w') as f:
        f.write(prompt)
    
    print(f"Created test prompt file: {prompt_file}")
    print(f"Prompt will trigger a 'Do you want to' confirmation dialog.")
    print(f"Starting Claude instance to test 'Do you want to' detection...")
    
    # Start the instance
    instance_id = manager.start_instance(
        project_dir=project_dir,
        prompt_path=prompt_file,
        use_tmux=True,
        open_terminal=True
    )
    
    print(f"Started Claude instance with ID: {instance_id}")
    print(f"The instance will be visible in the dashboard.")
    print(f"Check the logs for 'Do you want to' detection messages.")
    print(f"If successful, the instance should automatically respond to the prompt.")
    print(f"The file 'test_creation.txt' should be created in the current directory.")

if __name__ == "__main__":
    main()