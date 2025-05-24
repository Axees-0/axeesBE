#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Webhook API server for SoloTrend X trading system.
This module runs the Flask application that receives webhook signals.
"""

import os
import sys
import logging
from logging.handlers import RotatingFileHandler
import json
from pathlib import Path

# Add parent directory to path to resolve imports
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
sys.path.append(str(parent_dir))

from webhook_api.app import create_app

def setup_logging():
    """Configure logging for the webhook API server"""
    # Get the project root directory (3 levels up from the current file)
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    log_dir = project_root / 'data' / 'logs'
    log_dir.mkdir(exist_ok=True, parents=True)
    
    log_file = log_dir / 'webhook_api.log'
    
    handler = RotatingFileHandler(
        log_file, maxBytes=10485760, backupCount=10
    )
    
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)
    
    # Also log to console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger

def main():
    """Run the webhook API server"""
    logger = setup_logging()
    
    try:
        logger.info("Starting Webhook API Server")
        
        # Create and configure the Flask app
        app = create_app()
        
        # Get port from environment or use default
        port = int(os.environ.get('WEBHOOK_API_PORT', 5003))
        
        # Use the Flask app's direct run method to avoid CLI issues
        import flask.cli
        flask.cli.show_server_banner = lambda *args: None
        app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
        
    except Exception as e:
        logger.error(f"Error starting Webhook API server: {e}")
        raise

if __name__ == '__main__':
    main()