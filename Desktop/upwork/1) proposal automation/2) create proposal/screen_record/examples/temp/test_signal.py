#!/usr/bin/env python3
"""
Simple test script to create a demo completion signal file.
"""

import os
import time
from datetime import datetime

# Get the project root directory
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(os.path.dirname(script_dir))
signal_file = os.path.join(project_dir, ".demo_complete")

print(f"Script directory: {script_dir}")
print(f"Project directory: {project_dir}")
print(f"Signal file path: {signal_file}")

# Remove existing signal file if it exists
if os.path.exists(signal_file):
    os.remove(signal_file)
    print(f"Removed existing signal file: {signal_file}")

# Wait a moment to simulate the demo running
print("Simulating demo running for 3 seconds...")
time.sleep(3)

# Create the signal file
timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
with open(signal_file, "w") as f:
    f.write(f"Demo completed at {timestamp}")

print(f"Created signal file: {signal_file}")
print(f"Content: Demo completed at {timestamp}")

# Wait a moment to see if it gets detected
print("Waiting 2 seconds to ensure file is written...")
time.sleep(2)

# Verify the file exists
if os.path.exists(signal_file):
    print(f"Signal file exists with content: {open(signal_file).read()}")
else:
    print("ERROR: Signal file was not created or was deleted unexpectedly!")

print("Test complete!")