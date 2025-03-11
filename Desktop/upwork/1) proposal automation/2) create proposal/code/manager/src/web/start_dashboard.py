#!/usr/bin/env python3
"""
Quick launcher for the Claude Task Manager web dashboard.
"""

import subprocess
import os
import sys
import time
import webbrowser
import socket
import signal

def show_running_claude_instances():
    """Display all currently running tmux sessions for Claude."""
    print("\n===== Checking for Running Claude Instances =====")
    
    # Check for running tmux sessions related to Claude
    try:
        result = subprocess.run(["tmux", "list-sessions"], 
                               capture_output=True, text=True, check=False)
        
        if result.returncode == 0:
            sessions = result.stdout.strip().split('\n')
            claude_sessions = [s for s in sessions if 'claude' in s.lower()]
            
            if claude_sessions:
                print(f"Found {len(claude_sessions)} running Claude tmux sessions:")
                for i, session in enumerate(claude_sessions, 1):
                    print(f"  {i}. {session}")
            else:
                print("No running Claude tmux sessions found.")
        else:
            print("No tmux sessions found running.")
    except Exception as e:
        print(f"Error checking tmux sessions: {e}")
    
    # Check for Claude processes
    try:
        result = subprocess.run(["pgrep", "-fl", "claude"], 
                               capture_output=True, text=True, check=False)
        
        if result.returncode == 0 and result.stdout.strip():
            processes = result.stdout.strip().split('\n')
            print(f"\nFound {len(processes)} Claude-related processes:")
            for i, proc in enumerate(processes, 1):
                print(f"  {i}. {proc}")
        else:
            print("\nNo Claude-related processes found.")
    except Exception as e:
        print(f"Error checking Claude processes: {e}")
    
    print("\nThe dashboard will display all tracked instances, including stopped ones.")
    print("=================================================\n")

def ensure_port_available(port=5000):
    """Make sure the port is available by killing any processes using it."""
    print(f"Ensuring port {port} is available...")
    
    # Check if port is in use
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    in_use = False
    
    try:
        sock.bind(('127.0.0.1', port))
    except socket.error:
        in_use = True
    finally:
        sock.close()
    
    if not in_use:
        print(f"Port {port} is available.")
        return
    
    # Try to find and kill processes using the port
    print(f"Port {port} is in use. Attempting to free it...")
    
    try:
        # Find process using port 5000
        lsof_cmd = f"lsof -t -i:{port}"
        result = subprocess.run(lsof_cmd, shell=True, capture_output=True, text=True)
        
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                if pid.strip():
                    print(f"Killing process {pid} using port {port}")
                    try:
                        os.kill(int(pid), signal.SIGKILL)
                    except Exception as e:
                        print(f"Error killing process {pid}: {e}")
            
            # Wait a bit for processes to actually die
            time.sleep(1)
        else:
            print(f"Could not identify processes using port {port}")
    except Exception as e:
        print(f"Error freeing port {port}: {e}")
    
    # Double-check if port is now available
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(('127.0.0.1', port))
        print(f"Port {port} is now available.")
    except socket.error:
        print(f"WARNING: Port {port} is still in use. The dashboard may not start correctly.")
    finally:
        sock.close()

def open_browser(port=5000):
    """Open a browser window to the dashboard after a short delay."""
    print("Opening dashboard in browser...")
    time.sleep(2)  # Wait for the server to start
    
    # Try localhost first
    url = f"http://localhost:{port}"
    
    try:
        # Use platform-specific method to open browser
        if sys.platform == 'darwin':  # macOS
            subprocess.run(['open', url], check=False)
        else:
            webbrowser.open(url)
        
        print(f"Opened dashboard at {url}")
    except Exception as e:
        print(f"Error opening browser: {e}")
        print(f"Please manually open {url} in your browser")

def main():
    # Import the module to check its existence
    try:
        import flask
    except ImportError:
        print("Flask is required to run the web dashboard.")
        print("Please install it with: pip install flask")
        return 1
    
    # Get the path to the dashboard script
    dashboard_path = os.path.join(os.path.dirname(__file__), "claude_dashboard_web.py")
    
    # Check if the file exists
    if not os.path.exists(dashboard_path):
        print(f"Error: Could not find {dashboard_path}")
        return 1
    
    # Show running Claude instances
    show_running_claude_instances()
    
    # Ensure port 5000 is available
    ensure_port_available(5000)
    
    # Start browser in a separate process
    import threading
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    # Execute the dashboard script
    print("Starting Claude Task Manager Web Dashboard...")
    
    # Use os.execv to replace the current process with the dashboard process
    # This avoids having an extra process running
    os.execv(sys.executable, [sys.executable, dashboard_path])

if __name__ == "__main__":
    sys.exit(main())