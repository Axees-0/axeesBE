#!/usr/bin/env python3
"""
Test script that launches both the dashboard and creates a test instance
"""

import os
import sys
import time
import subprocess
import threading

def start_dashboard():
    """Start the web dashboard in a separate process"""
    print("Starting dashboard...")
    dashboard_process = subprocess.Popen(["python3", "start_dashboard.py"])
    return dashboard_process

def create_test_instance():
    """Create a test instance after a short delay"""
    # Wait for dashboard to start
    print("Waiting for dashboard to initialize...")
    time.sleep(5)
    
    # Create a test instance
    print("Creating test instance...")
    subprocess.run(["python3", "test_instance.py"], check=True)
    
    print("\nTest instance created and should now be visible in the dashboard!")
    print("The dashboard should be open in your web browser.")
    print("Press Ctrl+C to exit when done.")

def main():
    # Start the dashboard
    dashboard_process = start_dashboard()
    
    try:
        # Create the test instance
        create_test_instance()
        
        # Keep the script running until user interrupts
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        # Clean up
        dashboard_process.terminate()
        dashboard_process.wait()
        print("Dashboard stopped. Exiting.")

if __name__ == "__main__":
    main()