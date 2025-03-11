#!/usr/bin/env python3
"""
Test script for the enhanced auto-response features.
This will create a new Claude instance with auto-response capabilities
and test its ability to handle trust prompts and permission requests.
"""
import os
import sys
import time

# Add the parent directory to the path so we can import the modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the modules we need
from src.claude_monitor_direct import run_claude_command, attach_to_session, cleanup_session

def main():
    """Run the test."""
    print("=== STARTING AUTO-RESPONSE TEST ===")
    print("This test will:")
    print("1. Create a new folder on the desktop")
    print("2. Start a new Claude instance with tmux")
    print("3. Send the prompt: 'please create a file called \"abc\"'")
    print("4. Monitor and automatically respond to prompts")
    print("5. Open the terminal window to show the result")
    
    prompt_text = 'please create a file called "abc"'
    
    print("\n=== CREATING CLAUDE INSTANCE ===")
    session_name, success = run_claude_command(
        prompt_text=prompt_text,
        monitoring_time=120  # Monitor for 2 minutes
    )
    
    print(f"\n=== TEST RESULT: {'SUCCESS' if success else 'FAILURE'} ===")
    
    if success:
        print(f"Claude instance created with session name: {session_name}")
        print("Opening terminal window to show the result...")
        attach_to_session(session_name)
        
        # Keep the script running so user can see the result
        print("\nTest complete. Terminal window should be open.")
        print("The auto-response system should have handled any prompts.")
        print("Press Ctrl+C to end the test and clean up.")
        
        try:
            # Keep script running for a while to allow inspection
            for i in range(120):
                time.sleep(1)
                if i % 10 == 0:
                    print(f"Test will auto-cleanup in {120-i} seconds...")
        except KeyboardInterrupt:
            print("\nTest interrupted by user.")
        finally:
            # Clean up the session
            print("\n=== CLEANING UP ===")
            cleanup_session(session_name)
    else:
        print("Failed to create Claude instance.")

if __name__ == "__main__":
    main()