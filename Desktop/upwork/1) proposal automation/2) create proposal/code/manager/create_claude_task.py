#!/usr/bin/env python3
"""
Simple command-line script to create a Claude task using the task manager.
Useful for testing and debugging the integration with the filter_listings app.
"""

import os
import sys
import argparse
from claude_task_manager import ClaudeTaskManager

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Create a Claude task for proposal generation')
    parser.add_argument('--project-dir', type=str, required=True, 
                        help='Path to the project directory')
    parser.add_argument('--prompt-path', type=str, required=True,
                        help='Path to the prompt file')
    parser.add_argument('--use-tmux', action='store_true', default=True,
                        help='Use tmux-based approach (default: True)')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Validate paths
    if not os.path.exists(args.project_dir):
        print(f"Error: Project directory not found: {args.project_dir}")
        return 1
        
    if not os.path.exists(args.prompt_path):
        print(f"Error: Prompt file not found: {args.prompt_path}")
        return 1
    
    # Initialize task manager
    print(f"Initializing Claude Task Manager...")
    manager = ClaudeTaskManager()
    
    # Start a new Claude instance
    print(f"Starting Claude instance:")
    print(f"  Project directory: {args.project_dir}")
    print(f"  Prompt path: {args.prompt_path}")
    print(f"  Use tmux: {args.use_tmux}")
    
    try:
        instance_id = manager.start_instance(
            project_dir=args.project_dir,
            prompt_path=args.prompt_path,
            use_tmux=args.use_tmux
        )
        
        print(f"✅ Successfully created Claude instance with ID: {instance_id}")
        
        # Print current instances
        instances = manager.list_instances()
        print("\nCurrent Claude Instances:")
        print("-" * 80)
        for instance in instances:
            print(f"ID: {instance['id']} | Status: {instance['status']} | Yes Count: {instance['yes_count']} | Last Yes: {instance['last_yes']}")
            print(f"  Directory: {instance['project_dir']}")
            print(f"  Prompt: {instance['prompt_path']}")
            print(f"  Uptime: {instance['uptime']}")
            print("-" * 80)
            
        return 0
    
    except Exception as e:
        print(f"❌ Error creating Claude instance: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())