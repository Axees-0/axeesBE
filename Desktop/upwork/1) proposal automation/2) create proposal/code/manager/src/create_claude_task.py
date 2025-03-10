#!/usr/bin/env python3
"""
Simple command-line script to create a Claude task using the task manager.
Useful for testing and debugging the integration with the filter_listings app.
"""

import os
import sys
import time
import argparse
from src.claude_task_manager import ClaudeTaskManager

def main():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Create a Claude task for proposal generation')
    parser.add_argument('--project-dir', type=str, required=True, 
                        help='Path to the project directory')
    parser.add_argument('--prompt-path', type=str, required=False,
                        help='Path to the prompt file')
    parser.add_argument('--prompt-text', type=str, required=False,
                        help='Direct prompt text to send (alternative to prompt-path)')
    parser.add_argument('--use-tmux', action='store_true', default=True,
                        help='Use tmux-based approach (default: True)')
    parser.add_argument('--open-terminal', action='store_true', default=False,
                        help='Open terminal window to view session (default: False)')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Validate paths
    if not os.path.exists(args.project_dir):
        print(f"Error: Project directory not found: {args.project_dir}")
        return 1
        
    # Ensure at least one prompt source is provided
    if not args.prompt_path and not args.prompt_text:
        print("Error: Either --prompt-path or --prompt-text must be provided")
        return 1
        
    # If prompt path is provided, ensure it exists
    if args.prompt_path and not os.path.exists(args.prompt_path):
        print(f"Error: Prompt file not found: {args.prompt_path}")
        return 1
    
    # Initialize task manager
    print(f"Initializing Claude Task Manager...")
    manager = ClaudeTaskManager()
    
    # Determine prompt source to display in log
    prompt_source = args.prompt_path if args.prompt_path else f"Direct text ({len(args.prompt_text)} chars)"
    
    # Start a new Claude instance
    print(f"Starting Claude instance:")
    print(f"  Project directory: {args.project_dir}")
    print(f"  Prompt source: {prompt_source}")
    print(f"  Use tmux: {args.use_tmux}")
    print(f"  Open terminal: {args.open_terminal}")
    
    try:
        # Start the instance (this will automatically check for and reuse existing instances)
        # The start_instance method already checks for existing instances in the same directory
        instance_id = manager.start_instance(
            project_dir=args.project_dir,
            prompt_path=args.prompt_path,
            prompt_text=args.prompt_text,
            use_tmux=args.use_tmux,
            open_terminal=args.open_terminal
        )
        
        # Check if this was a new instance or a reused one
        # We can determine this by looking at the instance creation time
        now = time.time()
        instance = manager.instances.get(instance_id)
        
        if instance and now - instance.start_time > 5:  # If instance is older than 5 seconds, it was reused
            print(f"✅ Reusing existing Claude instance with ID: {instance_id}")
            print(f"   Sent new prompt to the existing instance")
        else:
            print(f"✅ Successfully created new Claude instance with ID: {instance_id}")
        
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