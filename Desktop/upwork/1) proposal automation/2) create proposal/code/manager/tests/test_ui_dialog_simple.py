#!/usr/bin/env python3
"""
Simplified test script to verify the UI dialog detection and response.
This script tests a very simple Claude session with UI dialog.
"""

import os
import sys
import time
import subprocess
import uuid
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_ui_dialog_simple')

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance

# Simple ANSI escape codes for highlighting text
BOLD = "\033[1m"
CYAN = "\033[36m"
RESET = "\033[0m"

def main():
    # Create a unique tmux session
    session_id = uuid.uuid4().hex[:8]
    tmux_session_name = f"claude_{session_id}"
    
    # Create the tmux session
    logger.info(f"{BOLD}{CYAN}Creating tmux session: {tmux_session_name}{RESET}")
    subprocess.run(["tmux", "new-session", "-d", "-s", tmux_session_name], check=True)
    
    # Register the session with the manager
    manager = ClaudeTaskManager()
    instance = ClaudeInstance(
        id=session_id,
        project_dir=os.getcwd(),
        prompt_path="Simplified test of UI dialog detection",
        start_time=time.time(),
        status="running",
        tmux_session_name=tmux_session_name,
        use_tmux=True
    )
    manager.instances[session_id] = instance
    manager.save_instances()
    logger.info(f"{BOLD}{CYAN}Registered instance with ID: {session_id}{RESET}")
    
    # Start monitoring the instance
    logger.info(f"{BOLD}{CYAN}Starting monitor thread...{RESET}")
    manager._start_monitor_thread(session_id)
    
    # Wait a moment for monitor to start
    time.sleep(2)
    
    # UI dialog with the highlighted '❯ Yes' option (simple version)
    logger.info(f"{BOLD}{CYAN}Sending UI dialog with '❯ Yes' option to tmux session...{RESET}")
    ui_dialog = """Do you want to create test_file.txt?
❯ Yes
  Yes, and don't ask again this session
  No, and tell Claude what to do differently (esc)"""
    
    # Send the dialog text to the tmux session
    subprocess.run([
        "tmux", "send-keys", "-t", tmux_session_name, 
        ui_dialog
    ], check=True)
    
    # Wait a moment to make sure monitor detects the dialog
    logger.info(f"{BOLD}{CYAN}Waiting for monitor to detect dialog...{RESET}")
    time.sleep(5)
    
    # Check if the instance responded
    content = manager.get_instance_content(session_id)
    logger.info(f"Current content: {content}")
    
    # Now simulate a plain "Do you want to" prompt
    logger.info(f"{BOLD}{CYAN}Sending 'Do you want to' plain prompt...{RESET}")
    subprocess.run([
        "tmux", "send-keys", "-t", tmux_session_name, 
        "Do you want to create a file?"
    ], check=True)
    
    # Wait another moment for detection
    time.sleep(5)
    
    # Check the yes_count to see if it was incremented
    logger.info(f"{BOLD}{CYAN}Yes count: {instance.yes_count}{RESET}")
    
    # Open a terminal window for user to see the session directly
    logger.info(f"{BOLD}{CYAN}Opening terminal to show the session...{RESET}")
    subprocess.run([
        "osascript", "-e", 
        f'tell application "Terminal" to do script "tmux attach -t {tmux_session_name}"'
    ], check=True)
    
    # Keep the test script running for a while so user can observe
    logger.info(f"{BOLD}{CYAN}Keeping session open for observation. Press Ctrl+C to end test.{RESET}")
    try:
        # Keep process running for manual observation
        for i in range(60):
            time.sleep(1)
            sys.stdout.write(".")
            sys.stdout.flush()
            if i % 10 == 9:
                sys.stdout.write("\n")
    except KeyboardInterrupt:
        logger.info(f"{BOLD}{CYAN}Test interrupted by user{RESET}")
    
    # Clean up
    logger.info(f"{BOLD}{CYAN}Cleaning up...{RESET}")
    manager.stop_instance(session_id)
    logger.info(f"{BOLD}{CYAN}Test complete!{RESET}")

if __name__ == "__main__":
    main()