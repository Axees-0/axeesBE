#!/usr/bin/env python3
"""
Direct runner for MT4 REST API without Flask CLI interference
"""
import os
import sys
from pathlib import Path

# Get the current directory and add to path
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

# Import the implementation module
from mt4_rest_api_implementation import app

if __name__ == "__main__":
    # Get port from environment variable
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting MT4 REST API on port {port}")
    
    # Run the app directly
    app.run(host='0.0.0.0', port=port, debug=False)