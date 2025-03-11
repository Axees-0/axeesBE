#!/usr/bin/env python3
"""
Direct test script to verify the file creation dialog detection.
This directly creates a tmux session and runs Claude with a file creation task.
"""

import os
import sys
import time
import subprocess
import uuid

def main():
    # Create unique session ID
    session_id = uuid.uuid4().hex[:8]
    session_name = f"claude_{session_id}"
    
    # Create test directory if it doesn't exist
    test_dir = os.path.join(os.getcwd(), "test_dir")
    os.makedirs(test_dir, exist_ok=True)
    
    print(f"Creating tmux session: {session_name}")
    subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
    
    # Change to test directory
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        f"cd '{test_dir}'", "Enter"
    ], check=True)
    
    # Run Claude
    print("Starting Claude...")
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        "claude", "Enter"
    ], check=True)
    
    # Wait for Claude to start
    time.sleep(5)
    
    # Send trust prompt response (if needed)
    print("Sending Enter to handle trust prompt...")
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        "Enter"
    ], check=True)
    
    # Wait for Claude to finish initializing
    time.sleep(2)
    
    # Send the command to create a file
    print("Sending file creation request...")
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        "Please create a file named test_file.txt with the content 'Hello World'", "Enter"
    ], check=True)
    
    # Open terminal window so user can observe
    print("Opening terminal window...")
    subprocess.run([
        "osascript", "-e", 
        f'tell application "Terminal" to do script "tmux attach -t {session_name}"'
    ], check=True)
    
    print("\nTest running! Watch the terminal window to see if:")
    print("1. Claude asks permission to create the file")
    print("2. The Task Manager automatically responds to the dialog")
    print("\nPress Ctrl+C when done observing...")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    
    # Don't close the session so user can continue to observe if needed
    print("Test complete! The session will remain open for further observation.")
    print(f"Session name: {session_name}")
    print("You can close it manually when done.")

if __name__ == "__main__":
    main()