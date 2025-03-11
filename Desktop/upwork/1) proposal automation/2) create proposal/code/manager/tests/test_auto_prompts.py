#!/usr/bin/env python3
"""
Test script for the enhanced auto-prompt response features.
Tests the ability of the system to detect and respond to various prompts.
"""
import os
import subprocess
import time
import uuid
import sys

# Add the parent directory to the path so we can import the modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the enhanced response monitoring function
from src.claude_monitor_direct import auto_respond_to_prompts

def create_test_environment():
    """Create a test directory and tmux session."""
    # Create a temporary directory
    folder_name = f"claude_test_{uuid.uuid4().hex[:6]}"
    desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
    folder_path = os.path.join(desktop_path, folder_name)
    
    print(f"Creating test folder: {folder_path}")
    os.makedirs(folder_path, exist_ok=True)
    
    # Create a unique tmux session
    session_name = f"test_prompt_{uuid.uuid4().hex[:6]}"
    print(f"Creating tmux session: {session_name}")
    
    # Create a new tmux session
    subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
    time.sleep(1)
    
    # Change to the test directory
    print(f"Changing to directory: {folder_path}")
    subprocess.run(["tmux", "send-keys", "-t", session_name, f"cd '{folder_path}'", "Enter"], check=True)
    time.sleep(1)
    
    return folder_path, session_name

def test_prompt_response(session_name):
    """Test the system's ability to respond to various prompts."""
    # Set up a sequence of simulated prompts to test
    test_prompts = [
        "Do you trust the files in this folder?",
        "Do you want to allow this action?",
        "Would you like to continue?",
        "Type 'yes' to continue: ",
        "Press Enter to proceed."
    ]
    
    # Create a script to mimic Claude's behavior in the tmux session
    for i, prompt in enumerate(test_prompts):
        # Send the prompt
        print(f"\nTesting prompt {i+1}/{len(test_prompts)}: '{prompt}'")
        
        # Simulate Claude showing the prompt
        subprocess.run(["tmux", "send-keys", "-t", session_name, f"PROMPT TEST: {prompt}", "Enter"], check=True)
        
        # Wait for the auto-response system to detect and respond
        time.sleep(3)
        
        # Display what happened for the user
        result = subprocess.run(
            ["tmux", "capture-pane", "-pt", session_name],
            capture_output=True, text=True, check=False
        )
        if result.returncode == 0:
            print("Current tmux content:")
            print(f"----\n{result.stdout}\n----")
        
        # Clear screen for next test
        subprocess.run(["tmux", "send-keys", "-t", session_name, "clear", "Enter"], check=True)
        time.sleep(1)

def main():
    """Run the test."""
    print("=== STARTING AUTO-PROMPT RESPONSE TEST ===")
    
    try:
        # Create the test environment
        folder_path, session_name = create_test_environment()
        
        # Open the terminal window to see the test in action
        print("Opening terminal window...")
        subprocess.run([
            "osascript", "-e", 
            f'tell application "Terminal" to do script "tmux attach -t {session_name}"'
        ], check=True)
        
        # Give user a chance to see the terminal
        time.sleep(3)
        
        # Run the prompt tests
        test_prompt_response(session_name)
        
        # Start monitoring for prompts in the background
        print("\n=== STARTING AUTO-PROMPT MONITORING ===")
        print("Now testing the auto_respond_to_prompts function...")
        print("The system will now monitor for various prompts and respond automatically.")
        print("Watch the terminal window to see the responses.")
        
        # This will start the actual auto-response monitoring to test our function
        # The session already has various prompts in its history that should be detected
        response_count = auto_respond_to_prompts(session_name, timeout=30, check_interval=1)
        
        # Report results
        print(f"\n=== TEST COMPLETE ===")
        print(f"Auto-prompt system responded to {response_count} prompts")
        
        # Clean up
        print("\nCleaning up...")
        subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
        print(f"Killed tmux session: {session_name}")
        
    except Exception as e:
        print(f"Error during test: {e}")
        # Try to clean up anyway
        try:
            subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
        except:
            pass

if __name__ == "__main__":
    main()