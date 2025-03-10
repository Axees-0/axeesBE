#!/usr/bin/env python3
"""
Utility to debug the content of a tmux session with Claude
"""

import subprocess
import sys
import time

def capture_pane_content(session_name):
    """Capture and print the content of a tmux pane"""
    result = subprocess.run(
        ["tmux", "capture-pane", "-pt", session_name],
        capture_output=True, 
        text=True
    )
    return result.stdout

def check_tmux_sessions():
    """List all tmux sessions"""
    result = subprocess.run(
        ["tmux", "ls"], 
        capture_output=True, 
        text=True, 
        check=False
    )
    if result.returncode != 0:
        print("No tmux sessions running")
        return []
    
    sessions = []
    for line in result.stdout.strip().split('\n'):
        if line.startswith('claude_'):
            session_name = line.split(':')[0]
            sessions.append(session_name)
    
    return sessions

def send_text_to_session(session_name, text):
    """Send text to a tmux session"""
    print(f"Sending text to session {session_name}: {text[:50]}...")
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        "-l", text
    ], check=True)
    
    # Send Enter to submit
    time.sleep(1)
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        "Enter"
    ], check=True)
    print("Text sent with Enter key")

def main():
    # Check available sessions
    sessions = check_tmux_sessions()
    if not sessions:
        print("No Claude tmux sessions found")
        return
    
    print("Available sessions:")
    for i, session in enumerate(sessions):
        print(f"{i+1}. {session}")
    
    # Select a session
    session_idx = int(input("Enter session number to inspect: ")) - 1
    if session_idx < 0 or session_idx >= len(sessions):
        print("Invalid session number")
        return
    
    session_name = sessions[session_idx]
    print(f"Selected session: {session_name}")
    
    # Capture and print content
    content = capture_pane_content(session_name)
    print("\n=== PANE CONTENT ===")
    print(content)
    print("=== END CONTENT ===\n")
    
    # Ask what to do
    action = input("What would you like to do? [send/view/quit]: ").lower()
    
    while action != 'quit':
        if action == 'send':
            text = input("Enter text to send: ")
            send_text_to_session(session_name, text)
            time.sleep(2)  # Wait for response
            
        if action in ['send', 'view']:
            # Get updated content
            content = capture_pane_content(session_name)
            print("\n=== UPDATED PANE CONTENT ===")
            print(content)
            print("=== END CONTENT ===\n")
        
        action = input("What would you like to do? [send/view/quit]: ").lower()
    
    print("Exiting")

if __name__ == "__main__":
    main()