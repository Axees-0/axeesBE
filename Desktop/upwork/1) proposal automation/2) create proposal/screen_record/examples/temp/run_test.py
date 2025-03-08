#!/usr/bin/env python3
"""
Testing script that simulates a demo completing and creating the signal file.
"""

import os
import sys
import time
import threading
from datetime import datetime

# Get the project root directory
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(os.path.dirname(script_dir))
signal_file = os.path.join(project_dir, ".demo_complete")

print(f"Project directory: {project_dir}")
print(f"Signal file path: {signal_file}")

# Remove existing signal file if it exists
if os.path.exists(signal_file):
    os.remove(signal_file)
    print(f"Removed existing signal file")

print("\n=== TEST DEMO STARTED ===")
print("This demo will run for 10 seconds and then create a completion signal")

# Countdown
for i in range(10, 0, -1):
    print(f"Demo completing in {i} seconds...")
    time.sleep(1)

# Create the signal file
timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
with open(signal_file, "w") as f:
    f.write(f"Demo completed at {timestamp}")

print(f"\nCreated signal file: {signal_file}")
print(f"Content: Demo completed at {timestamp}")
print("\n=== TEST DEMO COMPLETED ===")

# Keep running for a few seconds after creating the signal file
print("Waiting 3 more seconds to verify signal file detection...")
time.sleep(3)

print("Test finished!")