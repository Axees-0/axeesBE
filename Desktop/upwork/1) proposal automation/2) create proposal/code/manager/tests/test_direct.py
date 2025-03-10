#!/usr/bin/env python3
"""
Direct test using the approach from claude_monitor_direct.py
"""
import os
import subprocess
import time
import uuid

def wait_for_keyword(session_name, keyword, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        result = subprocess.run(
            ["tmux", "capture-pane", "-pt", session_name],
            capture_output=True, text=True
        )
        if keyword in result.stdout:
            return True
        time.sleep(0.5)
    return False

# Remove existing file if it exists
try:
    os.remove("abc")
    print("Removed existing abc file")
except:
    pass

# Create a unique session name
rand_id = uuid.uuid4().hex[:6]
session_name = f"claude_test_{rand_id}"
print(f"Creating session: {session_name}")

# Create a new tmux session
subprocess.run(["tmux", "new-session", "-d", "-s", session_name])
time.sleep(0.5)

# Run claude in the session
subprocess.run(["tmux", "send-keys", "-t", session_name, "claude", "Enter"])
print("Started Claude")
time.sleep(5)  # Wait for Claude to initialize

# Handle trust prompt
subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"])
print("Sent Enter for trust prompt")
time.sleep(2)

# Send prompt to create file
prompt = """Hello Claude! Please create a file in the current directory by running this command:

```bash
touch abc
```

When prompted, please execute this command."""

print("Sending prompt...")
subprocess.run(["tmux", "send-keys", "-l", "-t", session_name, prompt])
time.sleep(0.5)
subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"])
time.sleep(0.5)
subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"])
print("Sent prompt")

# Wait for the keyword "Do you want to" to appear
print("Waiting for command prompt...")
if wait_for_keyword(session_name, "Do you want to "):
    print("Detected 'Do you want to' prompt")
    
    # Check if arrow menu is present
    result = subprocess.run(
        ["tmux", "capture-pane", "-pt", session_name],
        capture_output=True, text=True
    )
    
    if "❯ Yes" in result.stdout:
        print("Detected arrow menu, starting advanced selection process")
        
        # Attempt 1: Normal Enter key
        print("Attempt 1: Sending normal Enter key")
        subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"])
        time.sleep(0.5)
        
        # Check if menu is still there
        result = subprocess.run(
            ["tmux", "capture-pane", "-pt", session_name],
            capture_output=True, text=True
        )
        
        if "❯ Yes" in result.stdout:
            print("Menu still detected, attempt 2: Sending C-m")
            # Attempt 2: Ctrl+M (alternate Enter)
            subprocess.run(["tmux", "send-keys", "-t", session_name, "C-m"])
            time.sleep(0.5)
            
            # Check if menu is still there
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", session_name],
                capture_output=True, text=True
            )
            
            if "❯ Yes" in result.stdout:
                print("Menu still detected, attempt 3: Sending Space")
                # Attempt 3: Space key
                subprocess.run(["tmux", "send-keys", "-t", session_name, "Space"])
                time.sleep(0.5)
    else:
        print("No arrow menu detected, sending Enter anyway")
        subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"])
    
    # Wait for file to be created
    start = time.time()
    while time.time() - start < 10:  # 10 second timeout
        if os.path.exists("abc"):
            print(f"Success! File 'abc' created after {time.time() - start:.1f} seconds")
            break
        time.sleep(0.5)
    else:
        print("Failed: File 'abc' not created within timeout")

    # Open terminal window to see what's happening
    print("Opening terminal window to inspect...")
    subprocess.run(["osascript", "-e", f'tell application "Terminal" to do script "tmux attach -t {session_name}"'])
    
    # Keep script running for a moment so you can see what's going on
    time.sleep(10)
    
    # Clean up
    #subprocess.run(["tmux", "kill-session", "-t", session_name])
    
else:
    print("Failed to detect 'Do you want to' prompt within timeout")
    subprocess.run(["tmux", "kill-session", "-t", session_name])