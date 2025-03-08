#!/usr/bin/env python3
"""
Test script to verify that Claude can execute commands when prompted.
This script will:
1. Create a tmux session
2. Send a prompt to Claude asking it to create a file
3. Wait for the 'Do you want to' prompt and respond with Enter
4. Verify the file was created
"""

import os
import sys
import time
import subprocess
import uuid
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('command_execution_test')

# Test file to create and check
TEST_FILE = "abc"

def cleanup():
    """Remove the test file if it exists."""
    if os.path.exists(TEST_FILE):
        try:
            os.remove(TEST_FILE)
            logger.info(f"Removed existing test file: {TEST_FILE}")
        except Exception as e:
            logger.error(f"Error removing existing test file: {e}")

def wait_for_keyword(session_name, keywords, timeout=60):
    """Wait for any of the specified keywords to appear in the tmux session."""
    if isinstance(keywords, str):
        keywords = [keywords]
    
    start = time.time()
    logger.info(f"Waiting for keywords {keywords} in session {session_name} (timeout: {timeout}s)")
    
    # For debugging, periodically show the content
    last_debug = time.time()
    debug_interval = 5  # Show debug info every 5 seconds
    
    while time.time() - start < timeout:
        result = subprocess.run(
            ["tmux", "capture-pane", "-pt", session_name],
            capture_output=True, text=True
        )
        
        # Debug logging
        now = time.time()
        if now - last_debug > debug_interval:
            logger.info(f"Current tmux content (elapsed: {now - start:.1f}s):\n{'-'*40}\n{result.stdout[-500:]}\n{'-'*40}")
            last_debug = now
            
        # Check for each keyword
        for keyword in keywords:
            if keyword in result.stdout:
                logger.info(f"Found keyword '{keyword}' in session {session_name} after {time.time() - start:.1f}s")
                return True
        
        time.sleep(0.5)
    
    # On timeout, show the content to help debug
    logger.warning(f"Timed out waiting for keywords {keywords} in session {session_name}")
    result = subprocess.run(
        ["tmux", "capture-pane", "-pt", session_name],
        capture_output=True, text=True
    )
    logger.warning(f"Final content:\n{'-'*40}\n{result.stdout[-1000:]}\n{'-'*40}")
    
    return False

def run_test():
    """Run the command execution test."""
    # Clean up from previous tests
    cleanup()
    
    # Generate unique session name
    session_id = uuid.uuid4().hex[:8]
    session_name = f"claude_test_{session_id}"
    
    logger.info(f"Starting test with session name: {session_name}")
    
    try:
        # Create new tmux session
        subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
        logger.info(f"Created tmux session: {session_name}")
        
        # Start Claude
        subprocess.run([
            "tmux", "send-keys", "-t", session_name, 
            "claude", "Enter"
        ], check=True)
        
        # Wait for Claude to initialize
        logger.info("Waiting for Claude to initialize (5s)...")
        time.sleep(5)
        
        # Handle trust prompt
        subprocess.run([
            "tmux", "send-keys", "-t", session_name, 
            "Enter"
        ], check=True)
        logger.info("Sent Enter to handle trust prompt")
        time.sleep(2)
        
        # Send the prompt
        logger.info("Sending prompt to create test file...")
        prompt = f"""Hello Claude! This is a test.
I need you to create a file named '{TEST_FILE}' by running this shell command.

Please execute this command:

```bash
touch {TEST_FILE}
```

When you see any prompt asking about executing commands, please respond with "yes".

This is a very important test. We need to verify that command execution works properly."""
        
        subprocess.run([
            "tmux", "send-keys", "-l", "-t", session_name, 
            prompt
        ], check=True)
        
        # Send Enter to submit the prompt
        time.sleep(1)
        subprocess.run([
            "tmux", "send-keys", "-t", session_name, 
            "Enter"
        ], check=True)
        time.sleep(1)
        subprocess.run([
            "tmux", "send-keys", "-t", session_name, 
            "Enter"
        ], check=True)
        logger.info("Sent prompt and Enter keys to submit it")
        
        # Wait for any command execution prompt
        logger.info("Waiting for command execution prompt...")
        execution_keywords = [
            "Do you want to ",
            "execute this",
            "run this command",
            "shell command",
            "touch abc",
            "permission",
            "execute the command",
            "would you like me to run",
            "this will create",
            "this command will"
        ]
        
        if wait_for_keyword(session_name, execution_keywords):
            # First checking if the arrow menu selection prompt is shown
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", session_name],
                capture_output=True, text=True
            )
            
            if "❯ Yes" in result.stdout:
                # This is the arrow key selection menu
                logger.info("Detected arrow key selection menu, sending Enter for '❯ Yes' option")
                subprocess.run([
                    "tmux", "send-keys", "-t", session_name, 
                    "Enter"
                ], check=True)
            else:
                # Regular prompt, respond with Enter
                logger.info("Responding to prompt with Enter key")
                subprocess.run([
                    "tmux", "send-keys", "-t", session_name, 
                    "Enter"
                ], check=True)
            
            # Sometimes a second prompt may appear
            time.sleep(2)
            logger.info("Checking for additional prompts...")
            if wait_for_keyword(session_name, execution_keywords):
                # Check again for menu selection
                result = subprocess.run(
                    ["tmux", "capture-pane", "-pt", session_name],
                    capture_output=True, text=True
                )
                
                if "❯ Yes" in result.stdout:
                    logger.info("Detected second arrow key selection menu, sending Enter for '❯ Yes' option")
                    subprocess.run([
                        "tmux", "send-keys", "-t", session_name, 
                        "Enter"
                    ], check=True)
                else:
                    logger.info("Responding to additional prompt with Enter key")
                    subprocess.run([
                        "tmux", "send-keys", "-t", session_name, 
                        "Enter"
                    ], check=True)
            
            # Wait for file to be created with timeout
            file_check_timeout = 60  # 60 seconds max wait time
            file_check_start = time.time()
            file_created = False
            
            logger.info(f"Waiting for file '{TEST_FILE}' to be created (timeout: {file_check_timeout}s)...")
            
            # Check every second for the file to be created
            while time.time() - file_check_start < file_check_timeout:
                if os.path.exists(TEST_FILE):
                    elapsed = time.time() - file_check_start
                    logger.info(f"✅ SUCCESS: File '{TEST_FILE}' was created after {elapsed:.1f}s")
                    file_created = True
                    break
                time.sleep(1)
            
            if not file_created:
                logger.error(f"❌ FAILURE: File '{TEST_FILE}' was not created after {file_check_timeout}s")
                # Show tmux content for debugging
                result = subprocess.run(
                    ["tmux", "capture-pane", "-pt", session_name],
                    capture_output=True, text=True
                )
                logger.error(f"Final tmux content:\n{'-'*40}\n{result.stdout[-1000:]}\n{'-'*40}")
                result = False
            else:
                result = True
        else:
            logger.error("❌ FAILURE: Command execution prompt not detected")
            result = False
        
        # Clean up
        logger.info(f"Killing tmux session: {session_name}")
        subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
        
        return result
    
    except Exception as e:
        logger.error(f"Error during test: {e}")
        # Try to clean up
        try:
            subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
        except:
            pass
        return False

def main():
    """Run the main test."""
    logger.info("=== Starting Command Execution Test ===")
    
    success = run_test()
    
    if success:
        logger.info("=== Test PASSED: Command was executed successfully ===")
        sys.exit(0)
    else:
        logger.error("=== Test FAILED: Command was not executed ===")
        sys.exit(1)

if __name__ == "__main__":
    main()