#!/usr/bin/env python3
"""
Monitor an existing Claude CLI session that was started outside the task manager.
This script will find any active tmux sessions running Claude and monitor them.
"""

import os
import subprocess
import sys
import time
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

def find_claude_sessions():
    """Find all tmux sessions running Claude CLI."""
    try:
        result = subprocess.run(
            ["tmux", "ls"], 
            capture_output=True, 
            text=True,
            check=False
        )
        
        # If no tmux sessions exist, tmux ls returns an error
        if result.returncode != 0:
            print("No tmux sessions found.")
            return []
            
        sessions = []
        for line in result.stdout.strip().split('\n'):
            session_name = line.split(':')[0]
            
            # Check if this session is running Claude
            try:
                content_result = subprocess.run(
                    ["tmux", "capture-pane", "-pt", session_name],
                    capture_output=True,
                    text=True,
                    check=False
                )
                
                if content_result.returncode == 0:
                    content = content_result.stdout.lower()
                    # Look for Claude CLI signatures
                    if ("welcome to claude" in content or 
                        "claude code" in content or 
                        "/help for help" in content):
                        sessions.append(session_name)
                        print(f"Found Claude session: {session_name}")
            except Exception as e:
                print(f"Error checking session {session_name}: {e}")
                
        return sessions
    except Exception as e:
        print(f"Error finding tmux sessions: {e}")
        return []

def monitor_session(session_name):
    """Monitor a specific tmux session for Claude dialogs."""
    print(f"\nStarting to monitor session: {session_name}")
    print("This will automatically respond to 'Do you want to' dialogs")
    print("Monitoring will continue until the session is closed")
    print("Press Ctrl+C to stop monitoring\n")
    
    try:
        while True:
            # Use the auto_respond_to_prompts function from claude_monitor_direct
            prompts_count = auto_respond_to_prompts(
                session_name=session_name,
                timeout=60,  # Check every minute
                check_interval=1
            )
            
            if prompts_count > 0:
                print(f"Responded to {prompts_count} prompts in session {session_name}")
                
            # Check if the session still exists
            check_result = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True,
                check=False
            )
            
            if check_result.returncode != 0:
                print(f"Session {session_name} no longer exists. Stopping monitoring.")
                return
                
            # Sleep briefly before next check
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user")
    except Exception as e:
        print(f"Error monitoring session: {e}")

def main():
    parser = argparse.ArgumentParser(description="Monitor existing Claude sessions for UI dialogs.")
    parser.add_argument("--session", "-s", help="Specific tmux session name to monitor (optional)")
    args = parser.parse_args()
    
    if args.session:
        # Monitor the specified session
        session_name = args.session
        result = subprocess.run(
            ["tmux", "has-session", "-t", session_name],
            capture_output=True,
            check=False
        )
        
        if result.returncode != 0:
            print(f"Error: tmux session '{session_name}' not found")
            sys.exit(1)
            
        # Check if it's a Claude session
        content_result = subprocess.run(
            ["tmux", "capture-pane", "-pt", session_name],
            capture_output=True,
            text=True
        )
        
        content = content_result.stdout.lower()
        if not ("welcome to claude" in content or "claude code" in content or "/help for help" in content):
            print(f"Warning: Session {session_name} might not be running Claude")
            response = input("Continue anyway? (y/n): ")
            if response.lower() not in ('y', 'yes'):
                sys.exit(0)
                
        monitor_session(session_name)
    else:
        # Find and monitor all Claude sessions
        sessions = find_claude_sessions()
        if not sessions:
            print("No Claude sessions found. Start a Claude CLI session first.")
            print("You can use:")
            print("  tmux new-session -s claude_session")
            print("  # Then in the tmux session:")
            print("  claude")
            sys.exit(0)
            
        if len(sessions) == 1:
            # Only one session found, monitor it directly
            print(f"Found one Claude session: {sessions[0]}")
            monitor_session(sessions[0])
        else:
            # Multiple sessions found, let user choose
            print("\nFound multiple Claude sessions:")
            for i, session in enumerate(sessions):
                print(f"{i+1}. {session}")
                
            choice = input("\nEnter session number to monitor (or 'a' for all): ")
            if choice.lower() == 'a':
                # Monitor all sessions in parallel
                threads = []
                for session in sessions:
                    thread = threading.Thread(
                        target=monitor_session,
                        args=(session,),
                        daemon=True
                    )
                    thread.start()
                    threads.append(thread)
                    
                # Wait for all threads
                for thread in threads:
                    thread.join()
            else:
                try:
                    index = int(choice) - 1
                    if 0 <= index < len(sessions):
                        monitor_session(sessions[index])
                    else:
                        print("Invalid selection")
                except ValueError:
                    print("Invalid input")

if __name__ == "__main__":
    main()