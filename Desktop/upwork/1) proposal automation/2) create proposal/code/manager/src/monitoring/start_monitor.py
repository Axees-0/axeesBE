#!/usr/bin/env python3
"""
Simple script to start the Claude monitor service directly.
This avoids issues with paths containing spaces or special characters.

Usage:
  python start_monitor.py start    # Start the service
  python start_monitor.py stop     # Stop the service
  python start_monitor.py status   # Check service status
"""

import os
import sys
import subprocess
import signal
import json
import time
from datetime import datetime

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
service_script = os.path.join(script_dir, "auto_monitor_service.py")

# Set up proper directories for logs, etc.
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
run_dir = os.path.join(project_root, "run")
logs_dir = os.path.join(project_root, "logs")
data_dir = os.path.join(project_root, "data")

# Ensure directories exist
os.makedirs(run_dir, exist_ok=True)
os.makedirs(logs_dir, exist_ok=True) 
os.makedirs(data_dir, exist_ok=True)

# Use appropriate paths for files
pid_file = os.path.join(run_dir, "monitor_service.pid")
log_file = os.path.join(logs_dir, "monitor_service.log") 
monitored_file = os.path.join(data_dir, "monitored_sessions.json")

def is_running():
    """Check if the service is running"""
    if os.path.exists(pid_file):
        try:
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())
            
            # Try to send signal 0 to process - this doesn't kill it but checks if it exists
            try:
                os.kill(pid, 0)
                return True
            except OSError:
                # Process doesn't exist, remove stale PID file
                os.remove(pid_file)
                return False
        except:
            return False
    else:
        return False

def start_service():
    """Start the monitor service"""
    if is_running():
        print("Claude monitor service is already running.")
        return
    
    print("Starting Claude monitor service...")
    
    # Start the service
    process = subprocess.Popen(
        ["python3", service_script],
        stdout=open(log_file, 'w'),
        stderr=subprocess.STDOUT,
        start_new_session=True  # Equivalent to nohup
    )
    
    # Save the PID
    with open(pid_file, 'w') as f:
        f.write(str(process.pid))
    
    print(f"Service started with PID: {process.pid}")
    print(f"Log file: {log_file}")

def stop_service():
    """Stop the monitor service"""
    if not is_running():
        print("Claude monitor service is not running.")
        return
    
    # Get the PID
    with open(pid_file, 'r') as f:
        pid = int(f.read().strip())
    
    print(f"Stopping Claude monitor service (PID: {pid})...")
    
    # Try graceful shutdown first
    try:
        os.kill(pid, signal.SIGTERM)
        
        # Wait and check if it's still running
        time.sleep(2)
        try:
            os.kill(pid, 0)
            print("Forcing termination...")
            os.kill(pid, signal.SIGKILL)
        except OSError:
            # Process already terminated
            pass
    except OSError:
        print("Process already terminated.")
    
    # Remove PID file
    if os.path.exists(pid_file):
        os.remove(pid_file)
    
    print("Service stopped.")

def status_service():
    """Check the status of the service"""
    if is_running():
        with open(pid_file, 'r') as f:
            pid = f.read().strip()
        
        print(f"Claude monitor service is running (PID: {pid})")
        print(f"Log file: {log_file}")
        
        # Show monitored sessions if available
        if os.path.exists(monitored_file):
            try:
                with open(monitored_file, 'r') as f:
                    data = json.load(f)
                
                print("\nMonitored sessions:")
                for session, info in data.get("sessions", {}).items():
                    status = info.get("status", "unknown")
                    started = info.get("started_monitoring", "unknown")
                    responses = info.get("prompts_responded", 0)
                    
                    print(f"  Session: {session}")
                    print(f"    Status: {status}")
                    print(f"    Started: {started}")
                    print(f"    Responses: {responses}")
            except Exception as e:
                print(f"Error reading monitored sessions: {e}")
    else:
        print("Claude monitor service is not running.")

def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} [start|stop|status]")
        return
    
    command = sys.argv[1].lower()
    
    if command == "start":
        start_service()
    elif command == "stop":
        stop_service()
    elif command == "status":
        status_service()
    else:
        print(f"Unknown command: {command}")
        print(f"Usage: {sys.argv[0]} [start|stop|status]")

if __name__ == "__main__":
    main()