#!/usr/bin/env python3
"""
Direct test script to create a Claude instance with Prompt 2 for card layout testing.
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
    
    # Send Prompt 2 for card layout testing
    print("Sending Prompt 2 for card layout testing...")
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        "Test prompt 2 for card layout testing", "Enter"
    ], check=True)
    
    # Open terminal window so user can observe
    print("Opening terminal window...")
    subprocess.run([
        "osascript", "-e", 
        f'tell application "Terminal" to do script "tmux attach -t {session_name}"'
    ], check=True)
    
    print("\nTest running! Claude instance created with Prompt 2 for card layout testing.")
    print(f"Session name: {session_name}")
    print("Please run the card layout test now in a separate terminal.")
    
    # Keep the script running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    
    print("Test complete! The session will remain open for further testing.")

if __name__ == "__main__":
    main()