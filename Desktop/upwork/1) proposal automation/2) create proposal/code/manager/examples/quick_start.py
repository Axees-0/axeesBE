#!/usr/bin/env python3
"""
Quick start script to run both the dashboard and create a test job.
"""

import os
import sys
import subprocess
import time
import threading
import webbrowser

# Paths
MANAGER_DIR = os.path.dirname(os.path.abspath(__file__))
DASHBOARD_SCRIPT = os.path.join(MANAGER_DIR, "start_dashboard.py")
TEST_SCRIPT = os.path.join(MANAGER_DIR, "create_claude_task.py")

def start_dashboard():
    """Start the Claude Task Manager dashboard."""
    print("Starting Claude Dashboard...")
    try:
        subprocess.Popen([sys.executable, DASHBOARD_SCRIPT],
                      stdout=subprocess.PIPE,
                      stderr=subprocess.PIPE)
        print("Dashboard started. It should open in your browser shortly.")
    except Exception as e:
        print(f"Error starting dashboard: {e}")

def print_menu():
    """Print the menu options."""
    print("\n===== Claude Task Manager =====")
    print("1. Start a new Claude instance")
    print("2. Run integration fixer")
    print("3. Open dashboard in browser")
    print("4. Create a test job")
    print("5. Exit")

def open_dashboard():
    """Open the dashboard in a web browser."""
    try:
        webbrowser.open("http://localhost:5000")
    except Exception as e:
        print(f"Error opening browser: {e}")

def create_test_job():
    """Create a test job by running the create_claude_task.py script."""
    import tempfile
    import json
    
    # Create a temp directory for the test job
    test_dir = tempfile.mkdtemp(prefix="claude_test_")
    print(f"Created test directory: {test_dir}")
    
    # Create a test prompt file
    prompt_path = os.path.join(test_dir, "prompt.txt")
    with open(prompt_path, "w") as f:
        f.write("This is a test prompt. Please write a simple hello world program.")
    
    print(f"Created test prompt file: {prompt_path}")
    
    # Run the create_claude_task.py script
    cmd = [
        sys.executable, 
        TEST_SCRIPT, 
        "--project-dir", test_dir,
        "--prompt-path", prompt_path
    ]
    
    try:
        subprocess.run(cmd)
    except Exception as e:
        print(f"Error creating test job: {e}")

def run_integration_fixer():
    """Run the integration fixer script."""
    fixer_script = os.path.join(MANAGER_DIR, "fix_filter_integration.py")
    
    try:
        subprocess.run([sys.executable, fixer_script])
    except Exception as e:
        print(f"Error running integration fixer: {e}")

def main():
    """Main function to run the quick start menu."""
    # Start the dashboard
    start_dashboard()
    
    # Wait a bit for the dashboard to start
    time.sleep(2)
    
    while True:
        print_menu()
        choice = input("\nEnter your choice (1-5): ")
        
        if choice == "1":
            # Get user input for the project directory and prompt path
            project_dir = input("Enter project directory path (or job ID): ")
            prompt_path = input("Enter prompt file path (or direct prompt text): ")
            
            # Create a command to run the create_claude_task.py script
            cmd = [
                sys.executable, 
                TEST_SCRIPT, 
                "--project-dir", project_dir,
                "--prompt-path", prompt_path
            ]
            
            # Run the command
            try:
                subprocess.run(cmd)
            except Exception as e:
                print(f"Error creating Claude instance: {e}")
        
        elif choice == "2":
            run_integration_fixer()
        
        elif choice == "3":
            open_dashboard()
        
        elif choice == "4":
            create_test_job()
        
        elif choice == "5":
            print("Exiting...")
            break
        
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()