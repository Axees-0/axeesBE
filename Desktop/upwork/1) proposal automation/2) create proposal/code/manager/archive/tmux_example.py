#!/usr/bin/env python3
"""
Example of using the Claude Task Manager with tmux sessions.
"""

import os
import time
from claude_task_manager import ClaudeTaskManager

def main():
    # Initialize the task manager
    manager = ClaudeTaskManager()
    
    # List all current instances
    print("\nCurrent Claude Instances:")
    instances = manager.list_instances()
    if not instances:
        print("No instances found.")
    else:
        for instance in instances:
            # Get additional info about tmux or terminal
            session_info = ""
            instance_obj = manager.instances.get(instance['id'])
            if instance_obj and hasattr(instance_obj, 'use_tmux') and instance_obj.use_tmux:
                session_info = f" | tmux: {instance_obj.tmux_session_name}"
            elif instance_obj and hasattr(instance_obj, 'terminal_id'):
                session_info = f" | terminal: {instance_obj.terminal_id if instance_obj else 'N/A'}"
                
            print(f"ID: {instance['id']} | Status: {instance['status']} | Yes Count: {instance['yes_count']} | Last Yes: {instance['last_yes']}{session_info}")
    
    print("\nStarting a new Claude instance with tmux...")
    
    # Example paths - modify these for your environment
    project_dir = os.path.expanduser("~/Desktop/test_claude_project")
    prompt_path = os.path.expanduser("~/Desktop/test_claude_prompt.txt")
    
    # Create the test directory if it doesn't exist
    os.makedirs(project_dir, exist_ok=True)
    
    # Create a simple test prompt if it doesn't exist
    if not os.path.exists(prompt_path):
        with open(prompt_path, 'w') as f:
            f.write("Write a simple 'Hello, World!' program in Python")
    
    # Start a new Claude instance with tmux (set use_tmux=False to use Terminal.app instead)
    instance_id = manager.start_instance(project_dir, prompt_path, use_tmux=True)
    print(f"Started new instance with ID: {instance_id}")
    
    print("\nLetting the instance run for 30 seconds...")
    time.sleep(30)
    
    print("\nNow stopping the instance...")
    manager.stop_instance(instance_id)
    print(f"Instance {instance_id} stopped.")
    
    print("\nFinal instance list:")
    instances = manager.list_instances()
    for instance in instances:
        print(f"ID: {instance['id']} | Status: {instance['status']} | Yes Count: {instance['yes_count']} | Last Yes: {instance['last_yes']}")

if __name__ == "__main__":
    main()