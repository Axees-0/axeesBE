from flask import Blueprint, request, jsonify, current_app
import logging
import asyncio
from src.backend.telegram_connector.signal_handler import process_webhook_signal
from src.backend.telegram_connector.mt4_connector import MT4Connector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprints for API routes
api_bp = Blueprint('api', __name__, url_prefix='/api')
webhook_bp = Blueprint('webhook', __name__, url_prefix='/webhook')

# API routes
@api_bp.route('/status', methods=['GET'])
def status():
    """Get the current status of the Telegram Bot service"""
    return jsonify({
        'status': 'ok',
        'service': 'telegram_connector',
        'mode': 'mock' if current_app.config.get('MOCK_MODE') else 'live',
        'bot_running': current_app.bot_instance is not None
    })

@api_bp.route('/execute_trade', methods=['POST'])
def execute_trade():
    """Execute a trade directly via API"""
    if not request.is_json:
        logger.error("Invalid request: not JSON")
        return jsonify({
            'status': 'error',
            'message': 'Request must be JSON'
        }), 400
    
    trade_data = request.json
    logger.info(f"Executing trade via API: {trade_data}")
    
    # Validate required fields
    if not all(k in trade_data for k in ["symbol", "direction", "volume"]):
        return jsonify({
            'status': 'error',
            'message': 'Missing required fields (symbol, direction, volume)'
        }), 400
    
    # Get MT4 connector from app context or create it if it doesn't exist
    if not hasattr(current_app, 'mt4_connector'):
        # Create MT4 connector with app configuration
        mt4_api_url = current_app.config.get('MT4_API_URL')
        use_mock = current_app.config.get('MOCK_MODE', True)
        current_app.mt4_connector = MT4Connector(mt4_api_url, use_mock=use_mock)
        logger.info(f"Created MT4Connector with URL: {mt4_api_url}, mock mode: {use_mock}")
    
    # Execute the trade
    result = current_app.mt4_connector.execute_trade(trade_data)
    
    return jsonify(result)

# Webhook route to receive signals from the Webhook API
@webhook_bp.route('', methods=['POST'])
def webhook():
    """Handle signals from Webhook API"""
    if not request.is_json:
        logger.error("Invalid request: not JSON")
        return jsonify({
            'status': 'error',
            'message': 'Request must be JSON'
        }), 400
    
    signal_data = request.json
    logger.info(f"Received signal from Webhook API: {signal_data}")
    
    # Process the signal
    bot = current_app.bot_instance
    if bot:
        # Run the async signal processor in the event loop
        asyncio.run(process_webhook_signal(bot, signal_data))
        return jsonify({
            'status': 'success',
            'message': 'Signal received and processed'
        })
    else:
        logger.error("Bot not initialized")
        return jsonify({
            'status': 'error',
            'message': 'Telegram bot not initialized'
        }), 500

def register_routes(app):
    """Register all routes with the Flask app"""
    app.register_blueprint(api_bp)
    app.register_blueprint(webhook_bp)
    
    # Remove conflicting health check endpoint as it's now in app.py
    # Add debug endpoint
    @app.route('/debug', methods=['GET'])
    def debug_info():
        return jsonify({
            'status': 'ok',
            'service': 'telegram_connector',
            'routes': [rule.rule for rule in app.url_map.iter_rules()]
        })
    
    # Register error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'status': 'error', 'message': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Server error: {e}")
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500