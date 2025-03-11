#\!/usr/bin/env python3
"""
Simple script to launch the dashboard directly.
"""
import os
import sys

# Add the current directory to the path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the dashboard app and run it
try:
    from src.web.app import run_dashboard
    
    print("Starting Claude Task Manager Dashboard...")
    print("The dashboard will open in your browser automatically.")
    
    # Run the dashboard
    run_dashboard(host="0.0.0.0", port=5001)
except Exception as e:
    print(f"Error starting dashboard: {e}")
    import traceback
    traceback.print_exc()
