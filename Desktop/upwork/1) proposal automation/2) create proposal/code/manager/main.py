#\!/usr/bin/env python3
"""
Main entry point for the Claude Task Manager application.
Simple wrapper that calls manage.py.
"""
import os
import sys
import subprocess

if __name__ == "__main__":
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Create the command to run manage.py with the same arguments
    cmd = [os.path.join(script_dir, "manage.py")] + sys.argv[1:]
    
    # Execute the command
    subprocess.run(cmd)
