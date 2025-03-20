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

# Load environment variables from multiple possible locations
load_dotenv(os.path.join(PROJECT_ROOT, '.env'))
load_dotenv(os.path.join(PROJECT_ROOT, '.env.telegram'))
load_dotenv(os.path.join(PROJECT_ROOT, '.env.local'))

# Ensure critical environment variables are printed for debugging
logger.info(f"Loading from PROJECT_ROOT: {PROJECT_ROOT}")

# Check if we have telegram token set
if 'TELEGRAM_BOT_TOKEN' in os.environ:
    token = os.environ['TELEGRAM_BOT_TOKEN']
    token_parts = token.split(':')
    if len(token_parts) == 2:
        logger.info(f"Found TELEGRAM_BOT_TOKEN in environment with ID: {token_parts[0]}")
    else:
        logger.warning(f"TELEGRAM_BOT_TOKEN found but has invalid format (should be NUMBER:STRING)")
else:
    logger.warning("TELEGRAM_BOT_TOKEN not found in environment variables")

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
    try:
        import src.backend.telegram_connector.bot as bot
        
        # Check token format before even attempting to set up bot
        token = app.config.get('TELEGRAM_BOT_TOKEN')
        if not token:
            logger.error("TELEGRAM_BOT_TOKEN environment variable is missing or empty")
            logger.warning("Telegram bot will not be available - please set TELEGRAM_BOT_TOKEN in .env")
            app.bot_instance = None
        elif ':' not in token:
            logger.error(f"Invalid Telegram bot token format. Expected format: '123456789:ABCDefGhiJklmNoPQRstUvwxyz'")
            logger.warning("Telegram bot will not be available - please check token format")
            app.bot_instance = None
        else:
            # Token has basic format, attempt to set up the bot
            token_parts = token.split(':')
            token_id_part = token_parts[0]
            
            # Log attempt with token ID for debugging
            logger.info(f"Setting up Telegram bot with token ID: {token_id_part}")
            
            # Set up the bot through bot.py
            app.bot_instance = bot.setup_bot(app)
            
            if app.bot_instance:
                logger.info(f"Telegram bot successfully initialized with mode: {'mock' if app.config.get('MOCK_MODE') else 'live'}")
                # Store the token info in app config for easy access
                app.config['TELEGRAM_BOT_CONNECTED'] = True
            else:
                logger.error("Failed to initialize Telegram bot - check logs for details")
                # Mark as not connected in config
                app.config['TELEGRAM_BOT_CONNECTED'] = False
    except Exception as e:
        logger.error(f"Error during Telegram bot initialization: {str(e)}", exc_info=True)
        app.bot_instance = None
        logger.warning("Telegram bot will not be available due to initialization error")
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