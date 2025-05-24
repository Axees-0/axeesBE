#!/usr/bin/env python3
"""
Example demonstrating path management and project ID lookup functionality.
"""

import os
import sys
import time

# Add the parent directory to the path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.utils.path_utils import (
    normalize_path,
    resolve_path,
    compare_paths,
    find_instances_by_project_dir,
    find_project_id_by_path
)
from src.core.task_manager import ClaudeTaskManager
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager
from src.core.models.instance import ClaudeInstance

def setup_task_manager():
    """Set up a task manager with some example instances."""
    # Set up logging
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger('path_operations_example')
    
    # Get the instance file path
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    instance_file = os.path.join(root_dir, "claude_instances.json")
    
    # Create components
    storage = JSONInstanceStorage(instance_file, logger)
    tmux_manager = TmuxProcessManager(logger)
    terminal_manager = TerminalProcessManager(logger)
    
    # Create task manager
    task_manager = ClaudeTaskManager(
        storage=storage,
        tmux_manager=tmux_manager,
        terminal_manager=terminal_manager,
        logger=logger
    )
    
    # Load existing instances
    task_manager.load_instances()
    
    return task_manager, instance_file

def show_path_normalization_examples():
    """Show examples of path normalization."""
    print("\n=== Path Normalization Examples ===")
    
    # Get current directory
    current_dir = os.getcwd()
    
    # Examples of different path formats
    paths = [
        current_dir,
        current_dir + "/",
        current_dir + "//",
        os.path.join(current_dir, "."),
        os.path.join(current_dir, ".", "."),
        os.path.join(current_dir, "..", os.path.basename(current_dir)),
        os.path.join(current_dir, "subdir", ".."),
        "./",
        "../" + os.path.basename(current_dir)
    ]
    
    # Show normalization results
    for path in paths:
        print(f"Original:  {path}")
        print(f"Normalized: {normalize_path(path)}")
        print(f"Real path:  {os.path.realpath(path)}")
        print(f"Resolve:    {resolve_path(path)}")
        print()
    
    # Compare paths
    print("Path comparison examples:")
    for i, path1 in enumerate(paths):
        for j, path2 in enumerate(paths[i+1:], i+1):
            result = compare_paths(path1, path2)
            print(f"Compare {i+1} and {j+1}: {result}")

def demonstrate_project_id_lookup(task_manager):
    """Demonstrate project ID lookup functionality."""
    print("\n=== Project ID Lookup Examples ===")
    
    # List all instances
    instances = task_manager.list_instances()
    
    # Show some sample paths
    print(f"Found {len(instances)} instances\n")
    
    if not instances:
        print("No instances found. Please create some instances first.")
        return
    
    # Show each instance's project directory
    print("Project directories:")
    for i, instance in enumerate(instances):
        print(f"{i+1}. {instance['id']}: {instance['project_dir']}")
    
    # Demonstrate looking up by project directory
    print("\nLooking up project IDs by directory:")
    for i, instance in enumerate(instances[:3]):  # Use first 3 instances for demo
        project_dir = instance["project_dir"]
        
        # Try different path variations
        variations = [
            project_dir,
            project_dir + "/",
            os.path.join(project_dir, "."),
            os.path.join(project_dir, "subdir", "..") if os.path.isdir(project_dir) else project_dir
        ]
        
        for j, variation in enumerate(variations):
            project_id = task_manager.find_project_id(variation)
            print(f"Lookup {i+1}.{j+1}: '{variation}' -> {project_id}")
    
    # Show example of finding all instances for a project directory
    print("\nFinding all instances for project directories:")
    for i, instance in enumerate(instances[:2]):  # Use first 2 instances for demo
        project_dir = instance["project_dir"]
        matching = task_manager.find_instances_by_project_dir(project_dir)
        print(f"Project '{project_dir}': {len(matching)} instances found")
        for j, match in enumerate(matching):
            print(f"  {j+1}. {match['id']} (started: {time.ctime(match['start_time'])})")

def main():
    """Main function to demonstrate path operations."""
    # Set up task manager
    task_manager, instance_file = setup_task_manager()
    
    # Show path normalization examples
    show_path_normalization_examples()
    
    # Demonstrate project ID lookup functionality
    demonstrate_project_id_lookup(task_manager)
    
    print(f"\nInspect the instance file at {instance_file} for more details.")

if __name__ == "__main__":
    main()