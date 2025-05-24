#\!/usr/bin/env python3
"""
Quick start script that initializes the environment and launches the dashboard.
"""
import os
import sys
import subprocess

def main():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Check if virtual environment exists
    venv_dir = os.path.join(script_dir, ".venv")
    
    if not os.path.exists(venv_dir):
        print("Setting up virtual environment...")
        # Create virtual environment
        subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True)
        
        # Determine the pip path
        if sys.platform == "win32":
            pip_path = os.path.join(venv_dir, "Scripts", "pip")
        else:
            pip_path = os.path.join(venv_dir, "bin", "pip")
            
        # Install dependencies
        print("Installing dependencies...")
        subprocess.run([pip_path, "install", "flask"], check=True)
    
    # Determine the python path in the virtual environment
    if sys.platform == "win32":
        python_path = os.path.join(venv_dir, "Scripts", "python")
    else:
        python_path = os.path.join(venv_dir, "bin", "python")
    
    # Run the application
    print("Starting Claude Task Manager Dashboard...")
    subprocess.run([python_path, "launcher.py"])

if __name__ == "__main__":
    main()
