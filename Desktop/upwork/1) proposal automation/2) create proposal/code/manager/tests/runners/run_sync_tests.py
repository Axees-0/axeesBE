#!/usr/bin/env python3
"""
Script to run the tmux-UI synchronization tests to verify perfect sync between
tmux sessions and the UI representation in the Claude Task Manager dashboard.
"""

import os
import sys
import unittest
import time
import logging
import subprocess
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
log = logging.getLogger("sync-test")

def is_tmux_available():
    """Check if tmux is available on the system."""
    try:
        result = subprocess.run(
            ["tmux", "--version"], 
            capture_output=True, 
            text=True, 
            check=False
        )
        log.info(f"Tmux version: {result.stdout.strip()}")
        return result.returncode == 0
    except Exception:
        log.warning("Tmux not found on system")
        return False

def kill_all_test_tmux_sessions():
    """Kill any tmux sessions that might have been left from previous test runs."""
    try:
        # Get all tmux sessions
        result = subprocess.run(["tmux", "ls"], capture_output=True, text=True, check=False)
        if result.returncode != 0:
            return  # No tmux sessions running
        
        # Parse the output to get session names
        for line in result.stdout.strip().split('\n'):
            if ':' in line:
                session_name = line.split(':')[0].strip()
                
                # Only kill test sessions to avoid interfering with user's tmux sessions
                if 'test_' in session_name or 'claude_test_' in session_name:
                    log.info(f"Killing test tmux session: {session_name}")
                    subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
    except Exception as e:
        log.error(f"Error cleaning up tmux sessions: {e}")

def run_tests():
    """Run the tmux-UI sync tests."""
    log.info("Starting tmux-UI sync tests")
    
    # Create the test runner
    test_loader = unittest.TestLoader()
    test_suite = test_loader.discover('tests', pattern='test_tmux_ui_sync.py')
    
    # Run the tests
    test_runner = unittest.TextTestRunner(verbosity=2)
    result = test_runner.run(test_suite)
    
    return result.wasSuccessful()

if __name__ == "__main__":
    # Make sure we're in the correct directory
    os.chdir(Path(__file__).parent)
    log.info(f"Working directory: {os.getcwd()}")
    
    # Check if tmux is available
    if not is_tmux_available():
        log.error("TMUX is not available. These tests require tmux to be installed.")
        sys.exit(1)
    
    # Clean up any leftover test sessions
    log.info("Cleaning up any leftover test tmux sessions...")
    kill_all_test_tmux_sessions()
    
    # Run the tests
    log.info("Running tmux-UI sync tests...")
    success = run_tests()
    
    # Clean up again after tests
    log.info("Cleaning up test tmux sessions...")
    kill_all_test_tmux_sessions()
    
    if success:
        log.info("All tests passed!")
        sys.exit(0)
    else:
        log.error("Some tests failed.")
        sys.exit(1)