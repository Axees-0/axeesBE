#!/usr/bin/env python3
"""
Tool to detect all tmux sessions that appear to be Claude instances
and import them into the ClaudeTaskManager database so they show
up in the web interface.

This utility uses the improved code in ClaudeTaskManager to standardize
session naming and ensure complete synchronization between the task manager
and actual tmux sessions.
"""

import os
import sys
import subprocess
import logging
from claude_task_manager import ClaudeTaskManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('import_tmux')

def get_task_manager():
    """Get a ClaudeTaskManager instance with the standard file path."""
    # Use absolute path to ensure same file is used by web interface
    manager_dir = os.path.dirname(os.path.abspath(__file__))
    save_file = os.path.join(manager_dir, "claude_instances.json")
    
    logger.info(f"Using instance file: {save_file}")
    return ClaudeTaskManager(save_file=save_file)

def import_tmux_sessions():
    """Import all tmux sessions into the task manager using the improved methods."""
    # Get task manager
    manager = get_task_manager()
    
    # First show the current state
    print("\n=== Current state before import ===")
    print(f"Active instances: {len(manager.instances)}")
    for instance_id, instance in manager.instances.items():
        session_name = instance.tmux_session_name if hasattr(instance, 'tmux_session_name') else "N/A"
        print(f"- Instance {instance_id}: status={instance.status}, tmux={session_name}")
    
    # Get all active tmux sessions
    active_sessions = manager.get_active_tmux_sessions()
    
    if not active_sessions:
        print("\nNo active tmux sessions found.")
        return
    
    print(f"\n=== Found {len(active_sessions)} active tmux sessions ===")
    for session_name, info in active_sessions.items():
        if session_name.startswith('claude_'):  # Only show actual session names, not ID keys
            print(f"- {session_name}: {info}")
    
    # Verify loaded instances - will update status for existing instances
    print("\n=== Verifying loaded instances against tmux state ===")
    manager._verify_loaded_instances()
    
    # Import any unregistered tmux sessions
    print("\n=== Importing unregistered tmux sessions ===")
    imported_count = manager._import_unregistered_tmux_sessions(active_sessions)
    
    if imported_count > 0:
        print(f"Successfully imported {imported_count} new tmux sessions.")
    else:
        print("No new tmux sessions were imported.")
    
    # Now show the updated state
    print("\n=== Updated state after import ===")
    print(f"Active instances: {len(manager.instances)}")
    for instance_id, instance in manager.instances.items():
        session_name = instance.tmux_session_name if hasattr(instance, 'tmux_session_name') else "N/A"
        print(f"- Instance {instance_id}: status={instance.status}, tmux={session_name}")
    
    # Also check for any tmux sessions that have no corresponding instance
    unmatched_sessions = []
    for session_name in [name for name in active_sessions.keys() if name.startswith('claude_')]:
        instance_id = session_name[7:]  # Remove claude_ prefix
        if instance_id not in manager.instances:
            # Check if the session is attached to any instance via tmux_session_name
            found = False
            for inst_id, instance in manager.instances.items():
                if hasattr(instance, 'tmux_session_name') and instance.tmux_session_name == session_name:
                    found = True
                    break
            
            if not found:
                unmatched_sessions.append(session_name)
    
    if unmatched_sessions:
        print(f"\n=== WARNING: Found {len(unmatched_sessions)} unmatched tmux sessions ===")
        for session in unmatched_sessions:
            print(f"- {session} is not associated with any instance")
        print("These sessions should have been imported. If they weren't, there might be an issue with the import logic.")
    else:
        print("\n=== All tmux sessions are properly registered ===")

if __name__ == "__main__":
    import_tmux_sessions()