#!/usr/bin/env python3
"""
Test importing tmux sessions.
This script creates tmux sessions manually and tests whether the Claude Task Manager
correctly detects and imports them.

Usage:
    python test_tmux_import.py
"""

import os
import sys
import time
import subprocess
import uuid
import argparse
import tempfile
import logging

# Add parent directory to sys.path to import modules
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)
sys.path.insert(0, os.path.join(parent_dir, 'src'))

# Import the required modules
from src.claude_task_manager import ClaudeTaskManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_tmux_import')

def create_tmux_sessions(num_sessions=3):
    """Create a number of test tmux sessions with the claude_ prefix."""
    sessions = []
    for i in range(num_sessions):
        session_id = uuid.uuid4().hex[:8]
        session_name = f"claude_{session_id}"
        
        try:
            # Create a detached tmux session
            subprocess.run([
                "tmux", "new-session", "-d", "-s", session_name
            ], check=True)
            
            # Run a command to simulate Claude activity
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                f"echo 'This is a simulated Claude session {i+1}'", "Enter"
            ], check=True)
            
            # Add the session to our list
            sessions.append(session_name)
            logger.info(f"Created test tmux session: {session_name}")
            
            # Sleep briefly to ensure different creation times
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Error creating test session {session_name}: {e}")
    
    return sessions

def cleanup_tmux_sessions(sessions):
    """Clean up the test tmux sessions."""
    for session_name in sessions:
        try:
            subprocess.run([
                "tmux", "kill-session", "-t", session_name
            ], check=False)
            logger.info(f"Cleaned up test tmux session: {session_name}")
        except Exception as e:
            logger.error(f"Error cleaning up test session {session_name}: {e}")

def list_tmux_sessions():
    """List all current tmux sessions."""
    try:
        result = subprocess.run(
            ["tmux", "ls"], 
            capture_output=True, 
            text=True, 
            check=False
        )
        
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            return "No tmux sessions found"
    except Exception as e:
        logger.error(f"Error listing tmux sessions: {e}")
        return f"Error: {e}"

def run_import_test(instance_file):
    """Test importing existing tmux sessions into the task manager."""
    logger.info("Starting tmux session import test")
    
    # Create test tmux sessions
    logger.info("Creating test tmux sessions...")
    test_sessions = create_tmux_sessions(3)
    
    try:
        # Display current tmux sessions for verification
        logger.info("Current tmux sessions:")
        logger.info(list_tmux_sessions())
        
        # Initialize the task manager that should detect the sessions
        logger.info(f"Initializing ClaudeTaskManager with instance file: {instance_file}")
        manager = ClaudeTaskManager(save_file=instance_file)
        
        # Get the list of instances, which should trigger import
        logger.info("Calling list_instances to trigger automatic import...")
        instances = manager.list_instances()
        
        # Verify the sessions were imported
        logger.info(f"Found {len(instances)} instances after import")
        
        # Count imported sessions
        imported_count = 0
        for instance in instances:
            session_name = instance['tmux_session']
            if session_name in test_sessions:
                imported_count += 1
                logger.info(f"Found imported session: {instance['id']} (session: {session_name})")
        
        # Calculate success rate
        success_rate = imported_count / len(test_sessions) if test_sessions else 0
        logger.info(f"Imported {imported_count} out of {len(test_sessions)} test sessions (success rate: {success_rate:.0%})")
        
        # Get detailed instance data
        logger.info("Detailed instance information:")
        for instance in instances:
            logger.info(f"ID: {instance['id']}")
            logger.info(f"  Status: {instance['status']}")
            logger.info(f"  Session: {instance['tmux_session']}")
            logger.info(f"  Project Dir: {instance['project_dir']}")
            logger.info(f"  Prompt: {instance['prompt_path']}")
            logger.info(f"  Uptime: {instance['uptime']}")
            logger.info("---")
        
        # Test explicit import function
        logger.info("Testing explicit import of tmux sessions...")
        try:
            # Import using the exposed method in test_instance.py
            from test_instance import import_tmux_sessions
            imported = import_tmux_sessions()
            logger.info(f"Explicitly imported {imported} sessions")
        except ImportError:
            logger.error("Could not import the import_tmux_sessions function from test_instance.py")
        
        return success_rate >= 0.75  # 75% or better is a pass
    
    finally:
        # Clean up the test sessions
        logger.info("Cleaning up test tmux sessions...")
        cleanup_tmux_sessions(test_sessions)
        
        # Verify cleanup
        logger.info("Tmux sessions after cleanup:")
        logger.info(list_tmux_sessions())

def main():
    """Main function to run the test."""
    # Create a unique instances file for this test
    temp_dir = tempfile.mkdtemp(prefix="claude_import_test_")
    instance_file = os.path.join(temp_dir, "test_import_instances.json")
    
    logger.info(f"Starting tmux import test with instance file: {instance_file}")
    
    # Run the test
    success = run_import_test(instance_file)
    
    # Clean up the temporary directory
    try:
        import shutil
        shutil.rmtree(temp_dir)
        logger.info(f"Removed temporary directory: {temp_dir}")
    except Exception as e:
        logger.error(f"Error removing temporary directory: {e}")
    
    # Report result
    if success:
        logger.info("TEST PASSED: Successfully imported tmux sessions")
        return 0
    else:
        logger.error("TEST FAILED: Did not import enough tmux sessions")
        return 1

if __name__ == "__main__":
    sys.exit(main())