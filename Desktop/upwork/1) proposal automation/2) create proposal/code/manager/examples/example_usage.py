#!/usr/bin/env python3
"""
Example script demonstrating how to use the test_instance module
to programmatically create and manage Claude instances.
"""

import os
import sys
import time
from test_instance import create_claude_instance, list_instances, stop_instance

def main():
    # Print current directory for reference
    print(f"Current directory: {os.getcwd()}")
    
    # Create a new Claude instance with direct text prompt
    print("\n1. Creating a new Claude instance with direct text prompt...")
    instance_id = create_claude_instance(
        prompt="Hello Claude! Please analyze the files in this directory and provide a summary.",
        project_dir=os.getcwd(),
        use_tmux=True,
        save_prompt=True
    )
    
    print(f"Instance created with ID: {instance_id}")
    
    # Wait a moment
    time.sleep(2)
    
    # List all instances
    print("\n2. Listing all current Claude instances:")
    instances = list_instances()
    for instance in instances:
        print(f"Instance ID: {instance['id']}")
        print(f"  Status: {instance['status']}")
        print(f"  Project: {instance['project_dir']}")
        print(f"  Uptime: {instance['uptime']}")
        print("")
    
    # Ask if user wants to stop the instance
    print(f"\n3. Do you want to stop the instance {instance_id}? (y/n)")
    choice = input("> ")
    
    if choice.lower() in ('y', 'yes'):
        print(f"Stopping instance {instance_id}...")
        success = stop_instance(instance_id)
        if success:
            print("Instance stopped successfully.")
        else:
            print("Failed to stop instance.")
    else:
        print("Instance will continue running in the background.")
        print("You can view it in the web interface or stop it later with:")
        print(f"python3 test_instance.py --stop {instance_id}")

if __name__ == "__main__":
    main()