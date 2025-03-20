import logging
import os
import sys
from flask import Flask
from dotenv import load_dotenv

# Get the project root directory (3 levels up from the current file)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

# Configure logging
log_dir = os.path.join(PROJECT_ROOT, 'data', 'logs')
os.makedirs(log_dir, exist_ok=True)  # Create logs directory if it doesn't exist

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(log_dir, 'telegram_connector.log'))
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def create_app(test_config=None):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev_key'),
        TELEGRAM_BOT_TOKEN=os.environ.get('TELEGRAM_BOT_TOKEN', ''),
        TELEGRAM_WEBHOOK_URL=os.environ.get('TELEGRAM_WEBHOOK_URL', 'http://localhost:5001/webhook'),
        MT4_API_URL=os.environ.get('MT4_API_URL', 'http://localhost:5002/api/trade'),
        FLASK_DEBUG=os.environ.get('FLASK_DEBUG', 'True') == 'True',
        FLASK_PORT=int(os.environ.get('FLASK_PORT', 5001)),
        MOCK_MODE=os.environ.get('MOCK_MODE', 'True') == 'True',
        ADMIN_USER_IDS=os.environ.get('ADMIN_USER_IDS', '').split(','),
        ALLOWED_USER_IDS=os.environ.get('ALLOWED_USER_IDS', '').split(','),
    )
    
    # Override configuration with test config if provided
    if test_config:
        app.config.update(test_config)
    
    # Ensure data directories exist at project root
    os.makedirs(os.path.join(PROJECT_ROOT, 'data', 'logs'), exist_ok=True)
    
    # Register routes
    import src.backend.telegram_connector.routes as routes
    routes.register_routes(app)
    
    # Add a simple health check endpoint directly
    @app.route('/health', methods=['GET'])
    def health():
        from flask import jsonify
        logger.info("Health check endpoint called")
        return jsonify({
            'status': 'ok',
            'service': 'telegram_connector'
        })
    
    # Initialize MT4 connector
    from src.backend.telegram_connector.mt4_connector import MT4Connector
    mt4_api_url = app.config.get('MT4_API_URL')
    use_mock = app.config.get('MOCK_MODE', True)
    app.mt4_connector = MT4Connector(mt4_api_url, use_mock=use_mock)
    logger.info(f"MT4Connector initialized with URL: {mt4_api_url}, mock mode: {use_mock}")
    
    # Initialize Telegram bot (asynchronously)
    import src.backend.telegram_connector.bot as bot
    app.bot_instance = bot.setup_bot(app)
    
    logger.info(f"Telegram bot application created with mode: {'mock' if app.config.get('MOCK_MODE') else 'live'}")
    return app

# This is used when running the file directly with 'python app.py'
if __name__ == '__main__':
    # Create the Flask app
    app = create_app()
    
    # Get port from environment or config
    port = app.config.get('FLASK_PORT', 5001)
    debug = app.config.get('FLASK_DEBUG', False)
    
    logger.info(f"Starting Telegram Connector server on port {port} (debug={debug})")
    app.run(host='0.0.0.0', port=port, debug=debug)