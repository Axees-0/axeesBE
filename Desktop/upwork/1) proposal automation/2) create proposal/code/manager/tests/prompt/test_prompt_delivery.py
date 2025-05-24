#!/usr/bin/env python3
"""
Test script to verify that prompts are being correctly delivered to Claude in tmux sessions.
This script will:
1. Run test_instance.py to create a Claude instance with a prompt that asks Claude to create a file named "abc"
2. Wait for the file to be created (checking every 5 seconds)
3. Report success or failure
"""

import os
import sys
import time
import subprocess
import logging
import argparse
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('prompt_delivery_test')

# Current directory - where we'll check for the test file
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TEST_FILE = os.path.join(CURRENT_DIR, "abc")
TEST_PROMPT = os.path.join(CURRENT_DIR, "test_prompt.txt")

def cleanup():
    """Remove the test file if it exists."""
    if os.path.exists(TEST_FILE):
        try:
            os.remove(TEST_FILE)
            logger.info(f"Removed existing test file: {TEST_FILE}")
        except Exception as e:
            logger.error(f"Error removing existing test file: {e}")

def run_test(timeout=600, open_terminal=True):
    """
    Run the test to verify prompt delivery.
    
    Args:
        timeout (int): Maximum time to wait for file creation in seconds
        open_terminal (bool): Whether to open a terminal window
    
    Returns:
        bool: True if test passed, False otherwise
    """
    # Clean up from any previous tests
    cleanup()
    
    # Verify test prompt exists
    if not os.path.exists(TEST_PROMPT):
        logger.error(f"Test prompt file not found: {TEST_PROMPT}")
        return False
    
    # Launch test_instance.py with our test prompt
    logger.info(f"Starting test_instance.py with prompt: {TEST_PROMPT}")
    
    open_flag = "--open_terminal" if open_terminal else ""
    cmd = [sys.executable, "test_instance.py", "--prompt", TEST_PROMPT, "--project_dir", CURRENT_DIR, open_flag]
    
    try:
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Read output in a non-blocking way
        for line in iter(process.stdout.readline, ''):
            if line:
                logger.info(f"test_instance.py: {line.strip()}")
            else:
                break
        
        # Wait longer for the Claude instance to start and process the prompt
        logger.info("Waiting 30 seconds for Claude to initialize and process the prompt...")
        time.sleep(30)
        
        # Start checking for the test file
        start_time = time.time()
        file_created = False
        
        logger.info(f"Starting to check for test file every 5 seconds (timeout: {timeout}s)")
        
        while time.time() - start_time < timeout:
            if os.path.exists(TEST_FILE):
                file_created = True
                elapsed = time.time() - start_time
                logger.info(f"✅ SUCCESS! Test file was created after {elapsed:.1f} seconds")
                break
            
            # Log progress
            elapsed = time.time() - start_time
            logger.info(f"Waiting... {elapsed:.1f}s elapsed (timeout: {timeout}s)")
            
            # Wait before checking again
            time.sleep(5)
        
        if not file_created:
            logger.error(f"❌ FAILURE: Test file was not created within {timeout} seconds")
            return False
        
        return True
    
    except Exception as e:
        logger.error(f"Error running test: {e}")
        return False

def main():
    """Main function to run the test."""
    parser = argparse.ArgumentParser(description="Test prompt delivery to Claude in tmux sessions")
    parser.add_argument("--timeout", type=int, default=300, help="Maximum time to wait for file creation in seconds")
    parser.add_argument("--no-terminal", action="store_true", help="Don't open a terminal window")
    args = parser.parse_args()
    
    logger.info("=== Starting Prompt Delivery Test ===")
    
    success = run_test(
        timeout=args.timeout,
        open_terminal=not args.no_terminal
    )
    
    if success:
        logger.info("=== Test PASSED: Prompt was delivered and processed successfully ===")
        sys.exit(0)
    else:
        logger.error("=== Test FAILED: Prompt was not delivered or processed ===")
        sys.exit(1)

if __name__ == "__main__":
    main()