#!/usr/bin/env python3
"""
Start a new Claude CLI session with automatic response monitoring.
This script will:
1. Create a tmux session
2. Start Claude in that session
3. Start monitoring for UI dialogs
4. Attach to the session so you can interact with Claude
"""

import os
import subprocess
import sys
import time
import uuid
import threading
import argparse

# Set up path to the src directory
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

# Import the monitoring function
try:
    from src.claude_monitor_direct import auto_respond_to_prompts
except ImportError:
    print("Failed to import claude_monitor_direct. Make sure you're running this from the manager directory.")
    sys.exit(1)

def monitor_session(session_name):
    """Monitor a tmux session for Claude dialogs in a background thread."""
    print(f"Starting to monitor session: {session_name}")
    
    while True:
        try:
            # Check if session still exists
            result = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True,
                check=False
            )
            
            if result.returncode != 0:
                print(f"Session {session_name} no longer exists. Stopping monitoring.")
                break
                
            # Monitor for prompts
            prompts_count = auto_respond_to_prompts(
                session_name=session_name,
                timeout=60,  # Check every minute
                check_interval=1
            )
            
            if prompts_count > 0:
                print(f"Responded to {prompts_count} prompts in session {session_name}")
                
        except Exception as e:
            print(f"Error monitoring session: {e}")
            time.sleep(5)  # Wait a bit before retrying

def main():
    parser = argparse.ArgumentParser(description="Start Claude CLI with automatic monitoring.")
    parser.add_argument("--dir", "-d", help="Directory to run Claude in (default: current directory)")
    parser.add_argument("--name", "-n", help="Name for the tmux session (default: auto-generated)")
    args = parser.parse_args()
    
    # Determine the directory to use
    working_dir = args.dir if args.dir else os.getcwd()
    
    # Create a session name if not provided
    session_name = args.name if args.name else f"claude_{uuid.uuid4().hex[:8]}"
    
    print(f"Starting Claude in directory: {working_dir}")
    print(f"tmux session name: {session_name}")
    
    # Create a new tmux session
    try:
        subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
        print(f"Created tmux session: {session_name}")
        
        # Change to the specified directory
        subprocess.run([
            "tmux", "send-keys", "-t", session_name, 
            f"cd '{working_dir}'", "Enter"
        ], check=True)
        
        # Start Claude
        subprocess.run([
            "tmux", "send-keys", "-t", session_name, 
            "claude", "Enter"
        ], check=True)
        
        print("Started Claude CLI")
        
        # Wait for Claude to start up
        time.sleep(3)
        
        # Handle the possible trust prompt
        subprocess.run([
            "tmux", "send-keys", "-t", session_name, 
            "Enter"
        ], check=True)
        
        # Start monitoring thread
        monitor_thread = threading.Thread(
            target=monitor_session,
            args=(session_name,),
            daemon=True
        )
        monitor_thread.start()
        print("Started monitoring thread for UI dialogs")
        
        # Attach to the session
        print("Attaching to tmux session. The monitoring will run in the background.")
        print("When you want to exit, just detach from tmux with Ctrl+B then D")
        subprocess.run(["tmux", "attach", "-t", session_name])
        
        # After detaching, check if user wants to kill the session
        response = input("Session detached. Kill the session? (y/n): ")
        if response.lower() in ('y', 'yes'):
            subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            print(f"Killed session: {session_name}")
        else:
            print(f"Session {session_name} is still running")
            print(f"You can reattach with: tmux attach -t {session_name}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()