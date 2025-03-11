#!/usr/bin/env python3
"""
Main test script for prompt handling features.
This runs all the individual tests for prompt handling:
1. Basic prompt delivery
2. Yes/no prompt auto-response
3. Shell command auto-approval
"""

import os
import sys
import subprocess
import logging
from datetime import datetime

# Configure logging
LOG_FILE = "prompt_features_test.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('test_prompt_features')

def run_test(test_script, test_name):
    """Run a test script and return the result."""
    logger.info(f"Running {test_name}...")
    
    try:
        result = subprocess.run(
            [sys.executable, test_script],
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode == 0:
            logger.info(f"✅ PASS: {test_name}")
            return True
        else:
            logger.error(f"❌ FAIL: {test_name}")
            logger.error(f"Output: {result.stdout}")
            logger.error(f"Error: {result.stderr}")
            return False
    except Exception as e:
        logger.error(f"Error running {test_name}: {e}")
        return False

def main():
    """Run all prompt handling tests."""
    logger.info("Starting prompt features tests")
    
    # Define the test scripts to run
    test_scripts = [
        ("tests/test_basic_prompt.py", "Basic Prompt Delivery"),
        ("tests/test_yes_prompt.py", "Yes/No Prompt Auto-Response"),
        ("tests/test_command_approval.py", "Shell Command Auto-Approval")
    ]
    
    # Run each test and collect results
    results = []
    for script, name in test_scripts:
        success = run_test(script, name)
        results.append((name, success))
    
    # Print the summary
    logger.info("\nTest Results:")
    passed = 0
    for name, success in results:
        status = "PASS" if success else "FAIL"
        logger.info(f"{status}: {name}")
        if success:
            passed += 1
    
    # Return exit code based on all tests passing
    if passed == len(results):
        logger.info(f"\n🎉 All {passed}/{len(results)} prompt feature tests passed!")
        return 0
    else:
        logger.error(f"\n❌ {len(results) - passed}/{len(results)} tests failed. See log for details.")
        return 1

if __name__ == "__main__":
    logger.info(f"Starting prompt features tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Using log file: {os.path.abspath(LOG_FILE)}")
    
    exit_code = main()
    sys.exit(exit_code)