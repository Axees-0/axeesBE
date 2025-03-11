#!/usr/bin/env python3
"""
A simple script for creating a Claude instance from the command line.
This is a utility script for testing Claude instances and experiments.

Usage:
  python test_instance.py --prompt <path_to_prompt> --project_dir <directory_path> [--open_terminal]
"""

import os
import sys
import argparse
import logging
from pathlib import Path

# Import helpers
from tests.helpers import get_task_manager, get_test_logger

# Import core components
from src.core.models.instance import RuntimeType


def main():
    """Main function to create a Claude instance."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Create a Claude instance for testing.")
    parser.add_argument("--prompt", required=True, help="Path to the prompt file")
    parser.add_argument("--project_dir", required=True, help="Directory for the project")
    parser.add_argument("--save_file", help="Path to the instances JSON file", default="config/test_instances.json")
    parser.add_argument("--open_terminal", action="store_true", help="Open a terminal window for the instance")
    args = parser.parse_args()
    
    # Set up logging
    logger = get_test_logger('test_instance', 'test_instance.log')
    
    # Expand and make paths absolute
    prompt_path = os.path.abspath(args.prompt)
    project_dir = os.path.abspath(args.project_dir)
    save_file = os.path.abspath(args.save_file)
    
    # Ensure paths exist
    if not os.path.exists(prompt_path):
        logger.error(f"Prompt file not found: {prompt_path}")
        sys.exit(1)
    
    if not os.path.exists(project_dir):
        logger.error(f"Project directory not found: {project_dir}")
        sys.exit(1)
    
    # Create the task manager
    logger.info(f"Using instances file: {save_file}")
    logger.info(f"Using project directory: {project_dir}")
    logger.info(f"Using prompt file: {prompt_path}")
    
    manager = get_task_manager(save_file=save_file, logger=logger)
    
    # Create the instance
    logger.info("Creating Claude instance...")
    instance_id = manager.start_instance(
        project_dir=project_dir,
        prompt_path=prompt_path,
        runtime_type=RuntimeType.TMUX,
        open_terminal=args.open_terminal
    )
    
    # Log success
    logger.info(f"Created Claude instance with ID: {instance_id}")
    
    if args.open_terminal:
        logger.info("Terminal window should now be open with the instance")
    else:
        logger.info("No terminal window was opened - access the instance via the dashboard")


if __name__ == "__main__":
    main()