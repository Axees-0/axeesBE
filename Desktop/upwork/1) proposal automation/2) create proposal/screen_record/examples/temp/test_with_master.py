#!/usr/bin/env python3
"""
Test the master_proposal_demo.py with our test demo.
"""

import os
import sys
import subprocess
import time

# Path setup
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
MASTER_SCRIPT = os.path.join(PROJECT_DIR, "master_proposal_demo.py")
SIGNAL_FILE = os.path.join(PROJECT_DIR, ".demo_complete")

# Ensure the signal file doesn't exist
if os.path.exists(SIGNAL_FILE):
    os.remove(SIGNAL_FILE)
    print(f"Removed existing signal file: {SIGNAL_FILE}")

# Create a simple function to run the test demo after a short delay
def run_test_demo():
    # Wait a moment to ensure master script is running
    time.sleep(5)
    
    # Run the test demo
    test_demo = os.path.join(SCRIPT_DIR, "run_test.py")
    print(f"Starting test demo: {test_demo}")
    subprocess.run([sys.executable, test_demo])

# Start the test demo in a separate process
import threading
demo_thread = threading.Thread(target=run_test_demo)
demo_thread.daemon = True
demo_thread.start()

# Run the master script with the test ID
print(f"Running master script: {MASTER_SCRIPT}")
cmd = [
    sys.executable, 
    MASTER_SCRIPT, 
    "--id", "test-demo",
    "--example",  # Use example mode
    "--max_record_duration", "60",  # Max 60 seconds
    "--preview"  # Show preview window
]

try:
    process = subprocess.Popen(cmd)
    
    # Wait for the process to finish
    process.wait()
    
    print(f"Master script completed with exit code: {process.returncode}")
except Exception as e:
    print(f"Error running master script: {e}")
finally:
    # Clean up
    if os.path.exists(SIGNAL_FILE):
        os.remove(SIGNAL_FILE)
        print(f"Removed signal file after test")
    
    print("Test completed.")