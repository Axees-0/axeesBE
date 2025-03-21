#!/usr/bin/env python3
"""
Direct runner for Webhook API without Flask CLI interference
"""
import os
import sys
import logging
from pathlib import Path

# Get the current directory and add to path
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
sys.path.append(str(parent_dir))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from webhook_api.app import create_app

if __name__ == "__main__":
    # Create the app
    app = create_app()
    
    # Get port from environment variable
    port = int(os.environ.get('WEBHOOK_API_PORT', 5003))
    logger.info(f"Starting Webhook API on port {port}")
    
    # Run the app directly
    app.run(host='0.0.0.0', port=port, debug=False)