#!/usr/bin/env python3
"""
Test script to simulate the full master_proposal_demo flow with a simplified demo.
"""

import os
import sys
import time
import threading
import subprocess
from datetime import datetime

# Path setup
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
SIGNAL_FILE = os.path.join(PROJECT_DIR, ".demo_complete")

print(f"Script directory: {SCRIPT_DIR}")
print(f"Project directory: {PROJECT_DIR}")
print(f"Signal file path: {SIGNAL_FILE}")

# Remove existing signal file if it exists
if os.path.exists(SIGNAL_FILE):
    os.remove(SIGNAL_FILE)
    print(f"Removed existing signal file")

# Simulated screen recording function
def simulated_recording(stop_event):
    print("\nStarted simulated screen recording...")
    recording_start_time = time.time()
    
    while not stop_event.is_set():
        elapsed = time.time() - recording_start_time
        print(f"Recording... (elapsed: {elapsed:.1f}s)", end="\r")
        time.sleep(0.5)
    
    elapsed = time.time() - recording_start_time
    print(f"\nRecording stopped after {elapsed:.1f} seconds")

# Monitor for completion signal
def monitor_for_completion(stop_event):
    print("Monitoring for completion signal file...")
    
    while not stop_event.is_set():
        if os.path.exists(SIGNAL_FILE):
            print(f"\nCompletion signal file detected: {SIGNAL_FILE}")
            with open(SIGNAL_FILE, 'r') as f:
                print(f"Signal content: {f.read()}")
            stop_event.set()
            return
        time.sleep(0.5)

# Main flow
def main():
    print("=== Testing Master Proposal Demo Flow ===")
    
    # Create a stop event for the recording
    stop_event = threading.Event()
    
    # Start recording in a separate thread
    recording_thread = threading.Thread(
        target=simulated_recording,
        args=(stop_event,)
    )
    recording_thread.daemon = True
    recording_thread.start()
    
    # Start monitoring for completion in a separate thread
    monitor_thread = threading.Thread(
        target=monitor_for_completion,
        args=(stop_event,)
    )
    monitor_thread.daemon = True
    monitor_thread.start()
    
    # Run the test demo script
    print("\nStarting demo script...")
    demo_script = os.path.join(SCRIPT_DIR, "run_test.py")
    
    try:
        subprocess.Popen([sys.executable, demo_script])
    except Exception as e:
        print(f"Error starting demo script: {e}")
        stop_event.set()
        return
    
    # Wait for recording to finish
    try:
        while not stop_event.is_set():
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nTest interrupted by user.")
        stop_event.set()
    
    recording_thread.join()
    monitor_thread.join()
    
    print("\n=== Test completed! ===")

if __name__ == "__main__":
    main()