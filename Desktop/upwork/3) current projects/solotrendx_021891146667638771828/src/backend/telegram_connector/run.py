"""
Run script for Telegram Connector
"""
import os
import sys
import logging
from pathlib import Path

# Add project root to the system path to allow absolute imports
current_file = Path(__file__).resolve()
project_root = current_file.parents[3]  # Go up 3 levels to the project root
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Make sure data/logs directory exists
log_dir = project_root / 'data' / 'logs'
log_dir.mkdir(parents=True, exist_ok=True)

# Main logic
def main():
    """Run the Telegram connector server"""
    try:
        # Import app only after setting up PATH
        from src.backend.telegram_connector.app import create_app
        
        # Create the Flask app
        app = create_app()
        
        # Get port from config
        port = app.config.get('FLASK_PORT', 5001)
        debug = app.config.get('FLASK_DEBUG', False)
        
        # Print configuration for debugging
        logger.info(f"Starting Telegram Connector server on port {port} (debug={debug})")
        logger.info(f"Mock mode: {app.config.get('MOCK_MODE', True)}")
        logger.info(f"MT4 API URL: {app.config.get('MT4_API_URL')}")
        
        # Run the app
        app.run(host='0.0.0.0', port=port, debug=debug)
        
    except Exception as e:
        logger.error(f"Error starting Telegram Connector: {e}", exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    main()