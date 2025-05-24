#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Webhook API Application for SoloTrend X trading system.
This module defines the Flask application factory for the webhook API.
"""

import os
import logging
import json
import datetime
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, request, jsonify, g
import requests

# Load environment variables from .env file
load_dotenv()

# Configure logger
logger = logging.getLogger(__name__)

# Set up file handler for detailed logging
log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'logs'))
os.makedirs(log_dir, exist_ok=True)

# Set up standard log file
standard_file_handler = logging.FileHandler(os.path.join(log_dir, 'webhook_api.log'))
standard_file_handler.setLevel(logging.INFO)
standard_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
standard_file_handler.setFormatter(standard_formatter)

# Set up detailed debug log file
debug_file_handler = logging.FileHandler(os.path.join(log_dir, 'webhook_api_debug.log'))
debug_file_handler.setLevel(logging.DEBUG)
debug_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]')
debug_file_handler.setFormatter(debug_formatter)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(standard_file_handler)

# Configure module logger
logger.setLevel(logging.DEBUG)
logger.addHandler(debug_file_handler)
logger.addHandler(standard_file_handler)

def create_app(test_config=None):
    """
    Create and configure the Flask application
    
    Args:
        test_config (dict, optional): Test configuration to override default config
        
    Returns:
        app: Configured Flask application
    """
    # Create and configure the app
    app = Flask(__name__)
    
    # Set default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev_key'),
        TELEGRAM_WEBHOOK_URL=os.environ.get('TELEGRAM_WEBHOOK_URL', 'http://localhost:5001/webhook'),
        FLASK_PORT=int(os.environ.get('WEBHOOK_API_PORT', 5003)),
        FLASK_DEBUG=os.environ.get('FLASK_DEBUG', 'False') == 'True',
        MOCK_MODE=os.environ.get('MOCK_MODE', 'True') == 'True',
        DEBUG_REQUESTS=os.environ.get('DEBUG_REQUESTS', 'True') == 'True',
    )
    
    # Configure debug logger for requests if enabled
    if app.config.get('DEBUG_REQUESTS'):
        requests_log = logging.getLogger('urllib3')
        requests_log.setLevel(logging.DEBUG)
        requests_log.propagate = True
        
        # Also set up file handler for requests debugging
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data', 'logs')
        os.makedirs(log_dir, exist_ok=True)
        file_handler = logging.FileHandler(os.path.join(log_dir, 'webhook_api_debug.log'))
        file_handler.setLevel(logging.DEBUG)
        requests_log.addHandler(file_handler)
    
    # Override with test config if provided
    if test_config:
        app.config.update(test_config)
    
    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Register routes
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'ok',
            'service': 'webhook_api'
        })
    
    @app.route('/webhook/tradingview', methods=['POST'])
    def tradingview_webhook():
        """Handle TradingView webhook signals"""
        try:
            if not request.is_json:
                logger.error("Received non-JSON request")
                return jsonify({
                    'status': 'error',
                    'message': 'Request must be JSON'
                }), 400
            
            # Get the signal data
            data = request.json
            logger.info(f"Received TradingView signal: {data}")
            
            # Validate the signal
            if not validate_tradingview_signal(data):
                logger.error(f"Invalid TradingView signal: {data}")
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid signal format'
                }), 400
            
            # Forward to Telegram Connector
            try:
                telegram_url = app.config['TELEGRAM_WEBHOOK_URL']
                logger.info(f"Forwarding signal to Telegram: {telegram_url}")
                
                # Add source field if not present
                if 'source' not in data:
                    data['source'] = 'tradingview'
                
                # Add detailed logging
                logger.info(f"Request payload: {data}")
                
                response = requests.post(
                    telegram_url,
                    json=data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10  # Increased timeout
                )
                
                logger.info(f"Telegram response status: {response.status_code}")
                logger.info(f"Telegram response text: {response.text}")
                
                if response.status_code in (200, 201, 202):
                    logger.info("Signal forwarded successfully")
                    return jsonify({
                        'status': 'success',
                        'message': 'Signal received and forwarded to Telegram'
                    })
                else:
                    logger.error(f"Error forwarding to Telegram: {response.status_code} - {response.text}")
                    return jsonify({
                        'status': 'error',
                        'message': f'Error forwarding to Telegram: {response.status_code}'
                    }), 500
                    
            except requests.RequestException as e:
                logger.error(f"Request error forwarding to Telegram: {e}")
                return jsonify({
                    'status': 'error',
                    'message': f'Error communicating with Telegram service: {str(e)}'
                }), 500
                
        except Exception as e:
            logger.error(f"Error processing TradingView webhook: {e}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': f'Internal server error: {str(e)}'
            }), 500
    
    @app.route('/webhook/ea', methods=['POST'])
    def ea_webhook():
        """Handle MT4 Expert Advisor webhook signals"""
        try:
            if not request.is_json:
                logger.error("Received non-JSON request from EA")
                return jsonify({
                    'status': 'error',
                    'message': 'Request must be JSON'
                }), 400
            
            # Get the signal data
            data = request.json
            logger.info(f"Received EA signal: {data}")
            
            # Validate the signal (EA format may differ from TradingView)
            if not validate_ea_signal(data):
                logger.error(f"Invalid EA signal: {data}")
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid signal format'
                }), 400
            
            # Forward to Telegram Connector
            try:
                telegram_url = app.config['TELEGRAM_WEBHOOK_URL']
                logger.info(f"Forwarding EA signal to Telegram: {telegram_url}")
                
                response = requests.post(
                    telegram_url,
                    json=data,
                    headers={'Content-Type': 'application/json'},
                    timeout=5
                )
                
                if response.status_code == 200:
                    logger.info("EA signal forwarded successfully")
                    return jsonify({
                        'status': 'success',
                        'message': 'EA signal received and forwarded to Telegram'
                    })
                else:
                    logger.error(f"Error forwarding EA signal to Telegram: {response.status_code} - {response.text}")
                    return jsonify({
                        'status': 'error',
                        'message': f'Error forwarding to Telegram: {response.status_code}'
                    }), 500
                    
            except requests.RequestException as e:
                logger.error(f"Request error forwarding EA signal to Telegram: {e}")
                return jsonify({
                    'status': 'error',
                    'message': f'Error communicating with Telegram service: {str(e)}'
                }), 500
                
        except Exception as e:
            logger.error(f"Error processing EA webhook: {e}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': f'Internal server error: {str(e)}'
            }), 500
    
    @app.route('/webhook', methods=['POST', 'GET'])
    def generic_webhook():
        """Handle generic webhook signals with signal type detection"""
        # For GET requests, just return a status message (useful for testing)
        if request.method == 'GET':
            logger.info("GET request received at webhook endpoint")
            return jsonify({
                'status': 'ok',
                'message': 'Webhook endpoint is ready to receive signals',
                'service': 'webhook_api'
            })
            
        # For POST requests, process the signal
        try:
            if not request.is_json:
                logger.error("Received non-JSON request")
                return jsonify({
                    'status': 'error',
                    'message': 'Request must be JSON'
                }), 400
            
            # Get the signal data
            data = request.json
            logger.info(f"Received generic signal: {data}")
            
            # Detect signal type and validate accordingly
            signal_type = detect_signal_type(data)
            
            if signal_type == "tradingview":
                if not validate_tradingview_signal(data):
                    logger.error(f"Invalid TradingView signal: {data}")
                    return jsonify({
                        'status': 'error',
                        'message': 'Invalid TradingView signal format'
                    }), 400
            elif signal_type == "ea":
                if not validate_ea_signal(data):
                    logger.error(f"Invalid EA signal: {data}")
                    return jsonify({
                        'status': 'error',
                        'message': 'Invalid EA signal format'
                    }), 400
            else:
                logger.error(f"Unknown signal type: {data}")
                return jsonify({
                    'status': 'error',
                    'message': 'Unknown signal type'
                }), 400
            
            # Forward to Telegram Connector
            try:
                telegram_url = app.config['TELEGRAM_WEBHOOK_URL']
                logger.info(f"Forwarding {signal_type} signal to Telegram: {telegram_url}")
                
                # Debug request details - standard info in main log, detailed in debug log
                logger.info(f"Forwarding signal: {data.get('symbol')} {data.get('side', data.get('action', 'Unknown'))} to {telegram_url}")
                logger.debug(f"Request URL: {telegram_url}")
                logger.debug(f"Full request data: {json.dumps(data, indent=2)}")
                
                # Ensure timestamp is added to data if not present
                if 'timestamp' not in data:
                    data['timestamp'] = datetime.datetime.now().isoformat()
                
                # Add source if not already present
                if 'source' not in data:
                    data['source'] = 'webhook_api'
                
                # Try with increased timeout and verbose error handling
                try:
                    response = requests.post(
                        telegram_url,
                        json=data,
                        headers={'Content-Type': 'application/json'},
                        timeout=15  # Increased timeout
                    )
                    
                    logger.info(f"Response status code: {response.status_code}")
                    logger.info(f"Response content: {response.text}")
                    
                    if response.status_code in (200, 201, 202):
                        logger.info("Signal forwarded successfully")
                        return jsonify({
                            'status': 'success',
                            'message': 'Signal received and forwarded to Telegram'
                        })
                    else:
                        # If 404, try alternative direct endpoint
                        if response.status_code == 404:
                            logger.warning("Original endpoint not found, trying direct root endpoint")
                            # Try direct endpoint as fallback
                            alt_url = telegram_url.split('/webhook')[0] + '/webhook'
                            logger.info(f"Trying alternative URL: {alt_url}")
                            
                            alt_response = requests.post(
                                alt_url,
                                json=data,
                                headers={'Content-Type': 'application/json'},
                                timeout=15
                            )
                            
                            logger.info(f"Alternative response status: {alt_response.status_code}")
                            logger.info(f"Alternative response content: {alt_response.text}")
                            
                            if alt_response.status_code in (200, 201, 202):
                                logger.info("Signal forwarded successfully using alternative endpoint")
                                return jsonify({
                                    'status': 'success',
                                    'message': 'Signal received and forwarded to Telegram using alternative endpoint'
                                })
                        
                        # Still failing, return error
                        error_msg = f"Error forwarding to Telegram: {response.status_code} - {response.text}"
                        logger.error(error_msg)
                        return jsonify({
                            'status': 'error',
                            'message': error_msg
                        }), 500
                except Exception as inner_e:
                    logger.error(f"Inner request error: {str(inner_e)}")
                    raise inner_e
                    
            except requests.RequestException as e:
                logger.error(f"Request error forwarding to Telegram: {e}")
                return jsonify({
                    'status': 'error',
                    'message': f'Error communicating with Telegram service: {str(e)}'
                }), 500
                
        except Exception as e:
            logger.error(f"Error processing generic webhook: {e}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': f'Internal server error: {str(e)}'
            }), 500
    
    return app

def validate_tradingview_signal(data):
    """
    Validate a TradingView signal
    
    Args:
        data (dict): The signal data to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Check for required fields
    required_fields = ['symbol']
    
    # At least one of these is required
    action_fields = ['action', 'side', 'type']
    
    # Check required fields
    if not all(field in data for field in required_fields):
        return False
    
    # Check that at least one action field is present
    if not any(field in data for field in action_fields):
        return False
    
    return True

def validate_ea_signal(data):
    """
    Validate an Expert Advisor signal
    
    Args:
        data (dict): The signal data to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Check for required fields
    required_fields = ['symbol']
    
    # At least one of these is required
    action_fields = ['action', 'side', 'type', 'cmd']
    
    # Check required fields
    if not all(field in data for field in required_fields):
        return False
    
    # Check that at least one action field is present
    if not any(field in data for field in action_fields):
        return False
    
    return True

def detect_signal_type(data):
    """
    Detect the type of signal from its content
    
    Args:
        data (dict): The signal data
        
    Returns:
        str: The detected signal type ("tradingview", "ea", or "unknown")
    """
    # EA signals typically have these fields
    ea_indicators = ['magic', 'ticket', 'cmd', 'mt4_account']
    
    # TradingView signals typically have these fields
    tv_indicators = ['strategy', 'interval', 'exchange', 'chart', 'position_size']
    
    # Count indicators for each type
    ea_count = sum(1 for indicator in ea_indicators if indicator in data)
    tv_count = sum(1 for indicator in tv_indicators if indicator in data)
    
    # Determine type based on indicators
    if ea_count > tv_count:
        return "ea"
    elif tv_count > ea_count:
        return "tradingview"
    elif "source" in data and data["source"].lower() == "tradingview":
        return "tradingview"
    elif "source" in data and data["source"].lower() in ["ea", "expert_advisor", "mt4"]:
        return "ea"
    else:
        # Default to TradingView if can't determine
        return "tradingview"