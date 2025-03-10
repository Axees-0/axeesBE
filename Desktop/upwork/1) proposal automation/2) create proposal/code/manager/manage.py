#\!/usr/bin/env python3
"""
Main entry point for the Claude Task Manager application.
"""
import os
import sys

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def launch_dashboard():
    """Launch the web dashboard interface."""
    from src.start_dashboard import main
    main()

def launch_monitor():
    """Launch the Claude monitor."""
    from src.claude_monitor import main
    main()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Claude Task Manager Control Script")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Dashboard command
    dashboard_parser = subparsers.add_parser("dashboard", help="Launch the web dashboard")
    
    # Monitor command
    monitor_parser = subparsers.add_parser("monitor", help="Launch the Claude monitor")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Execute the appropriate command
    if args.command == "dashboard":
        launch_dashboard()
    elif args.command == "monitor":
        launch_monitor()
    else:
        # Default to dashboard if no command is specified
        launch_dashboard()
