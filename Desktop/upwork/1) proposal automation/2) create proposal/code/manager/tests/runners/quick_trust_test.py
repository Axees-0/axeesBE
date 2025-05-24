#!/usr/bin/env python3
"""
Quick test for trust prompt handling.
"""
import os
import subprocess
import time
import uuid

def main():
    """Run a quick test of the trust prompt handling."""
    # Create a temporary directory
    folder_name = f"claude_test_{uuid.uuid4().hex[:6]}"
    desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
    folder_path = os.path.join(desktop_path, folder_name)
    
    print(f"Creating test folder: {folder_path}")
    os.makedirs(folder_path, exist_ok=True)
    
    # Create a unique tmux session
    session_name = f"trust_test_{uuid.uuid4().hex[:6]}"
    print(f"Creating tmux session: {session_name}")
    
    try:
        # Create a new tmux session
        subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
        time.sleep(1)
        
        # Change to the test directory
        print(f"Changing to directory: {folder_path}")
        subprocess.run(["tmux", "send-keys", "-t", session_name, f"cd '{folder_path}'", "Enter"], check=True)
        time.sleep(1)
        
        # Start Claude
        print("Starting Claude...")
        subprocess.run(["tmux", "send-keys", "-t", session_name, "claude", "Enter"], check=True)
        time.sleep(3)
        
        # Monitor for trust prompt
        print("Monitoring for trust prompt...")
        found_trust = False
        start_time = time.time()
        
        while time.time() - start_time < 30:  # Try for 30 seconds
            # Get tmux content
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", session_name],
                capture_output=True, text=True, check=False
            )
            
            if result.returncode == 0:
                content = result.stdout
                if "Do you trust the files in this folder?" in content or "Trust this folder?" in content:
                    print("Found trust prompt! Sending Enter key...")
                    subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"], check=True)
                    found_trust = True
                    time.sleep(1)
                    break
            
            time.sleep(0.5)
        
        if found_trust:
            print("Successfully detected and responded to trust prompt!")
            
            # Send a simple prompt
            print("Sending test prompt...")
            subprocess.run(["tmux", "send-keys", "-t", session_name, "Write: Hello, world!", "Enter"], check=True)
            time.sleep(1)
        else:
            print("Did not detect trust prompt within timeout.")
        
        # Open the terminal window to see the result
        print("Opening terminal window...")
        subprocess.run([
            "osascript", "-e", 
            f'tell application "Terminal" to do script "tmux attach -t {session_name}"'
        ], check=True)
        
        # Wait for user to inspect
        print("\nTest running. Terminal window should be open.")
        print("Press Ctrl+C to end test and clean up.")
        
        # Keep the script running for manual inspection
        try:
            for i in range(60):
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nTest interrupted.")
    
    except Exception as e:
        print(f"Error during test: {e}")
    
    finally:
        # Clean up
        print("\nCleaning up...")
        try:
            subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            print(f"Killed tmux session: {session_name}")
        except:
            pass

if __name__ == "__main__":
    main()