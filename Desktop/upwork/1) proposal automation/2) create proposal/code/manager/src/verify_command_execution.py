#!/usr/bin/env python3
"""
This script verifies that Claude can execute shell commands through the task manager.
It creates a Claude instance and asks it to create a file in the current directory.
"""

import os
import time
import logging
from pathlib import Path
import argparse
from test_instance import create_claude_instance

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('command_verify')

# Test file that will be created
TEST_FILE = "command_executed.txt"

def setup():
    """Remove test file if it exists."""
    try:
        if os.path.exists(TEST_FILE):
            os.remove(TEST_FILE)
            logger.info(f"Removed existing file: {TEST_FILE}")
    except Exception as e:
        logger.error(f"Error removing file: {e}")

def create_prompt():
    """Create a prompt that instructs Claude to create a file."""
    return f"""Hello Claude!

This is a test to verify that you can execute shell commands correctly.

Please create a file named '{TEST_FILE}' in the current directory by running:

```bash
touch {TEST_FILE}
```

When prompted to execute this command, please select "Yes" by pressing Enter.

This will verify that the command execution functionality is working correctly.
"""

def wait_for_file(timeout=120):
    """Wait for the test file to be created."""
    logger.info(f"Waiting for file '{TEST_FILE}' to be created (timeout: {timeout} seconds)...")
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        if os.path.exists(TEST_FILE):
            elapsed = time.time() - start_time
            logger.info(f"✅ SUCCESS! File '{TEST_FILE}' was created after {elapsed:.1f} seconds")
            return True
        
        # Log progress every 10 seconds
        if int(time.time() - start_time) % 10 == 0:
            logger.info(f"Still waiting... {int(time.time() - start_time)} seconds elapsed")
        
        time.sleep(1)
    
    logger.error(f"❌ TIMEOUT: File '{TEST_FILE}' was not created within {timeout} seconds")
    return False

def main():
    """Main function to verify command execution."""
    parser = argparse.ArgumentParser(description="Verify Claude can execute shell commands")
    parser.add_argument("--timeout", type=int, default=120, help="Timeout in seconds to wait for file creation")
    parser.add_argument("--open-terminal", action="store_true", help="Open a terminal window to view the session")
    args = parser.parse_args()
    
    logger.info("=== Command Execution Verification Test ===")
    
    # Setup
    setup()
    
    # Create a prompt
    prompt = create_prompt()
    logger.info("Created prompt to instruct Claude to create a file")
    
    # Get the current directory for the Claude instance
    current_dir = os.getcwd()
    logger.info(f"Using current directory: {current_dir}")
    
    # Create a Claude instance with our test prompt
    logger.info("Creating Claude instance...")
    instance_id = create_claude_instance(
        prompt=prompt,
        project_dir=current_dir,
        use_tmux=True,
        save_prompt=False,
        open_terminal=args.open_terminal
    )
    
    logger.info(f"Created Claude instance with ID: {instance_id}")
    
    # Wait for the file to be created
    success = wait_for_file(timeout=args.timeout)
    
    if success:
        logger.info("=== TEST PASSED: Command execution is working correctly ===")
        return 0
    else:
        logger.error("=== TEST FAILED: Command execution is not working correctly ===")
        return 1

if __name__ == "__main__":
    exit(main())