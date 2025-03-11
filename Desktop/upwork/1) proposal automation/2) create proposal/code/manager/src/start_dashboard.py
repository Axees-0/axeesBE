#!/usr/bin/env python3
"""
Script to start the Claude Task Manager web dashboard.
"""
import os
import sys
import argparse

# Add the parent directory to the path for proper imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

def main():
    """Main function to start the dashboard."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Start the Claude Task Manager dashboard.')
    parser.add_argument('--port', type=int, default=7865, help='Port to run the dashboard on (default: 7865)')
    parser.add_argument('--debug', action='store_true', help='Run in debug mode')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to bind to')
    args = parser.parse_args()
    
    # Import the dashboard module
    from src.claude_dashboard_web import app
    
    # Run the dashboard
    print(f"Starting dashboard on port {args.port}...")
    app.run(debug=args.debug, host=args.host, port=args.port)

if __name__ == "__main__":
    main()