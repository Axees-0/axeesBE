#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Signal handler for Telegram Connector in SoloTrend X trading system.
This module handles trading signals and forwards them to the MT4 API.
"""

import os
import sys
import logging
import json
from pathlib import Path
import requests
from datetime import datetime
import time

class SignalHandler:
    """Handles trading signals and forwards them to the MT4 API"""
    
    def __init__(self, mt4_api_base_url=None, logger=None):
        """
        Initialize the signal handler
        
        Args:
            mt4_api_base_url (str): Base URL for the MT4 API. If None, will use environment variable
            logger (logging.Logger): Logger instance to use. If None, will create a new one
        """
        # Set up logger
        self.logger = logger or logging.getLogger(__name__)
        
        # Get MT4 API URL from environment variable or use provided value
        self.mt4_api_base_url = mt4_api_base_url or os.environ.get(
            'MT4_API_URL', 'http://localhost:5002/api/v1'
        )
        
        # Track connection status
        self.connected = False
        self.last_connection_attempt = 0
        self.connection_retry_interval = 60  # seconds
        
        # Verify connection on initialization
        self.verify_connection()
        
    def verify_connection(self):
        """Verify connection to MT4 API"""
        current_time = time.time()
        
        # Rate limit connection attempts
        if (current_time - self.last_connection_attempt) < self.connection_retry_interval:
            return self.connected
        
        self.last_connection_attempt = current_time
        
        try:
            # Try to connect to health endpoint
            health_url = f"{self.mt4_api_base_url}/health"
            response = requests.get(health_url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok":
                    self.connected = True
                    self.logger.info("MT4 API connection verified")
                    return True
            
            self.connected = False
            self.logger.warning(f"MT4 API connection failed: {response.status_code}")
            return False
            
        except Exception as e:
            self.connected = False
            self.logger.warning(f"Error connecting to MT4 API: {e}")
            return False
    
    def process_signal(self, signal_data):
        """
        Process a trading signal
        
        Args:
            signal_data (dict): The signal data to process
            
        Returns:
            dict: Processing result with success status and message
        """
        if not self.verify_connection():
            return {
                "success": False,
                "message": "MT4 API connection not available"
            }
        
        try:
            # Log the incoming signal
            self.logger.info(f"Processing signal: {signal_data}")
            
            # Extract signal information
            signal_type = signal_data.get("type", "unknown")
            symbol = signal_data.get("symbol")
            action = signal_data.get("action")
            
            if not symbol or not action:
                return {
                    "success": False,
                    "message": "Invalid signal data: Missing symbol or action"
                }
            
            # Format for MT4 API
            order_request = {
                "symbol": symbol,
                "action": action.upper(),
                "volume": float(signal_data.get("volume", 0.1)),
                "price": float(signal_data.get("price", 0)),
                "stop_loss": float(signal_data.get("stop_loss", 0)),
                "take_profit": float(signal_data.get("take_profit", 0)),
                "comment": f"TG:{signal_data.get('source', 'webhook')}"
            }
            
            # Send order to MT4 API
            order_url = f"{self.mt4_api_base_url}/orders"
            response = requests.post(
                order_url, 
                json=order_request,
                timeout=30
            )
            
            if response.status_code in (200, 201):
                result = response.json()
                self.logger.info(f"Signal processed successfully: {result}")
                return {
                    "success": True,
                    "message": f"Order placed: {result.get('message', 'Success')}",
                    "order_number": result.get("order_number", 0)
                }
            else:
                error_msg = f"MT4 API error: {response.status_code} - {response.text}"
                self.logger.error(error_msg)
                return {
                    "success": False,
                    "message": error_msg
                }
                
        except Exception as e:
            error_msg = f"Error processing signal: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "message": error_msg
            }
    
    def format_signal_message(self, signal_data, result=None):
        """
        Format a signal for display in Telegram
        
        Args:
            signal_data (dict): The signal data
            result (dict): The processing result
            
        Returns:
            str: Formatted message for Telegram
        """
        # Basic signal info
        symbol = signal_data.get("symbol", "Unknown")
        action = signal_data.get("action", "Unknown").upper()
        price = signal_data.get("price", "Market")
        
        # Format as a nice message
        message_lines = [
            f"🔔 *SIGNAL: {symbol} {action}*",
            f"💰 Price: {price}",
        ]
        
        # Add volume if present
        if "volume" in signal_data:
            message_lines.append(f"📊 Volume: {signal_data['volume']}")
        
        # Add stop loss and take profit if present
        if "stop_loss" in signal_data and signal_data["stop_loss"]:
            message_lines.append(f"🛑 Stop Loss: {signal_data['stop_loss']}")
            
        if "take_profit" in signal_data and signal_data["take_profit"]:
            message_lines.append(f"🎯 Take Profit: {signal_data['take_profit']}")
        
        # Add source if present
        if "source" in signal_data:
            message_lines.append(f"📡 Source: {signal_data['source']}")
        
        # Add timestamp
        timestamp = signal_data.get("timestamp", datetime.now().isoformat())
        message_lines.append(f"🕒 Time: {timestamp}")
        
        # Add result if provided
        if result:
            if result.get("success", False):
                message_lines.append(f"✅ *{result.get('message', 'Success')}*")
                if "order_number" in result:
                    message_lines.append(f"📝 Order #: {result['order_number']}")
            else:
                message_lines.append(f"❌ *{result.get('message', 'Failed')}*")
        
        # Join with newlines
        return "\n".join(message_lines)