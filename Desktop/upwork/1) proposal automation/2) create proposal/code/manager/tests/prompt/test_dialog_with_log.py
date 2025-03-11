#!/usr/bin/env python3
"""
Test script with real-time log display to verify UI dialog detection.
"""

import os
import sys
import time
import subprocess
import uuid
import logging
import threading
import tempfile

# Configure logging - use a more distinctive format for better visibility
logging.basicConfig(
    level=logging.INFO,
    format='\033[1;36m%(asctime)s - %(name)s\033[0m - \033[1;33m%(levelname)s\033[0m - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('test_dialog_log')

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance

# Create a temporary log file for this test
temp_log_file = tempfile.NamedTemporaryFile(delete=False, suffix='.log', prefix='claude_test_')
temp_log_path = temp_log_file.name
temp_log_file.close()

# Add a file handler to monitor this specific log
file_handler = logging.FileHandler(temp_log_path)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

# Function to display log in real-time
def display_log():
    process = subprocess.Popen(['tail', '-f', temp_log_path], stdout=subprocess.PIPE)
    try:
        while True:
            # Each line will be printed as it comes in from the log
            line = process.stdout.readline().decode('utf-8')
            if not line:
                break
            # Only print lines containing key phrases we care about
            if any(phrase in line for phrase in [
                "❯ Yes", 
                "FILE CREATION", 
                "DO YOU WANT TO", 
                "RESPONDED", 
                "CONTEXT",
                "YES COUNT"
            ]):
                print(f"\033[1;32m{line.strip()}\033[0m")
            elif "ERROR" in line:
                print(f"\033[1;31m{line.strip()}\033[0m")
    except KeyboardInterrupt:
        process.terminate()

def main():
    # Create a unique tmux session
    session_id = uuid.uuid4().hex[:8]
    tmux_session_name = f"claude_{session_id}"
    
    logger.info(f"Creating tmux session: {tmux_session_name}")
    subprocess.run(["tmux", "new-session", "-d", "-s", tmux_session_name], check=True)
    
    # Register the session with the manager
    manager = ClaudeTaskManager()
    instance = ClaudeInstance(
        id=session_id,
        project_dir=os.getcwd(),
        prompt_path="Test dialog with detailed logging",
        start_time=time.time(),
        status="running",
        tmux_session_name=tmux_session_name,
        use_tmux=True
    )
    manager.instances[session_id] = instance
    manager.save_instances()
    logger.info(f"Registered instance with ID: {session_id}")
    
    # Start log display in a separate thread
    log_thread = threading.Thread(target=display_log, daemon=True)
    log_thread.start()
    
    # Start monitoring the instance
    logger.info("Starting monitor thread...")
    manager._start_monitor_thread(session_id)
    
    # Wait a moment for monitor to start
    time.sleep(2)
    
    # Create a test file creation dialog
    logger.info("Sending file creation dialog to tmux session...")
    file_dialog = """
╭──────────────────────────────────────────────────────────────────────────────╮
│ Create file                                                                  │
│ ╭──────────────────────────────────────────────────────────────────────────╮ │
│ │ test_log_file.txt                                                        │ │
│ │                                                                          │ │
│ │ (No content)                                                             │ │
│ ╰──────────────────────────────────────────────────────────────────────────╯ │
│ Do you want to create test_log_file.txt?                                     │
│ ❯ Yes                                                                        │
│   Yes, and don't ask again this session                                      │
│   No, and tell Claude what to do differently (esc)                           │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
"""
    # Send the dialog line by line
    for line in file_dialog.strip().split('\n'):
        subprocess.run([
            "tmux", "send-keys", "-t", tmux_session_name, 
            line, "Enter"
        ], check=True)
    
    logger.info("Dialog sent. Watching for detection and response...")
    print("\n\033[1;34m=== DETECTION LOG (FILTERED) ===\033[0m")
    print("\033[1;34mWatching for dialog detection events...\033[0m")
    
    # Wait for a bit to ensure detection happens
    time.sleep(10)
    
    # Also test a plain "Do you want to" prompt
    logger.info("Sending simple 'Do you want to' prompt...")
    subprocess.run([
        "tmux", "send-keys", "-t", tmux_session_name, 
        "Do you want to create a file now?", "Enter"
    ], check=True)
    
    # Wait another moment to ensure detection
    time.sleep(5)
    
    # Open a terminal window to observe
    logger.info("Opening terminal window...")
    subprocess.run([
        "osascript", "-e", 
        f'tell application "Terminal" to do script "tmux attach -t {tmux_session_name}"'
    ], check=True)
    
    print("\n\033[1;34mTerminal window opened. You can observe the session now.\033[0m")
    print("\033[1;34mLog entries showing detection and responses will appear above.\033[0m")
    print("\033[1;34mPress Ctrl+C to end the test when finished observing.\033[0m")
    
    try:
        # Keep the script running to continue logging
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Test interrupted by user")
    
    # Clean up
    logger.info("Cleaning up...")
    manager.stop_instance(session_id)
    os.unlink(temp_log_path)
    logger.info("Test complete!")

if __name__ == "__main__":
    main()