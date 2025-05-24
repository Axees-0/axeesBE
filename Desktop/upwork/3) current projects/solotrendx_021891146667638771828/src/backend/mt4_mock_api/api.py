"""
MT4 Mock API - Simulates the MT4 Manager API for development and testing.

This module provides a mock implementation of the MT4 Manager API which can be
used for development and testing without requiring a real MT4 terminal.
"""
import logging
import time
import random
import json
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MT4MockAPI:
    """
    Mock implementation of the MT4 Manager API.
    
    This class simulates the behavior of the MT4 Manager API without
    requiring a real MT4 terminal. It's intended for development and testing.
    """
    
    def __init__(self, port: int = 5003):
        """
        Initialize the MT4 Mock API.
        
        Args:
            port: The port to run the API server on
        """
        self.mode = "mock"
        self.port = port
        self.orders: List[Dict[str, Any]] = []
        self.next_ticket = 10000
        logger.info(f"MT4MockAPI initialized in {self.mode} mode on port {self.port}")
    
    def server_status(self) -> Dict[str, str]:
        """
        Get the server status.
        
        Returns:
            Dict with status information
        """
        return {
            "status": "ok",
            "mode": self.mode,
            "server_time": datetime.now().isoformat()
        }
    
    def execute_trade(self, trade_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a trade in the mock system.
        
        Args:
            trade_data: Dictionary containing trade parameters
                - symbol: The currency pair (e.g., "EURUSD")
                - type: "BUY" or "SELL"
                - volume: Trade volume (lot size)
                - price: Entry price
                - sl: Stop loss price (optional)
                - tp: Take profit price (optional)
        
        Returns:
            Dict with trade execution result
        """
        logger.info(f"Processing trade: {trade_data}")
        
        # Validate required fields
        required_fields = ["symbol", "type", "volume"]
        for field in required_fields:
            if field not in trade_data:
                logger.error(f"Missing required field: {field}")
                return {
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }
        
        # Simulate processing time
        time.sleep(0.1)
        
        # Generate ticket number
        ticket = self.next_ticket
        self.next_ticket += 1
        
        # Create order record
        order = {
            "ticket": ticket,
            "symbol": trade_data.get("symbol"),
            "type": trade_data.get("type"),
            "volume": float(trade_data.get("volume", 0.1)),
            "open_price": float(trade_data.get("price", 0)),
            "open_time": datetime.now().isoformat(),
            "sl": float(trade_data.get("sl", 0)),
            "tp": float(trade_data.get("tp", 0)),
            "status": "open"
        }
        
        # Add to orders list
        self.orders.append(order)
        logger.info(f"Trade executed: Ticket #{ticket}")
        
        return {
            "status": "success",
            "message": "Trade executed successfully",
            "data": order
        }
    
    def get_order(self, ticket: int) -> Optional[Dict[str, Any]]:
        """
        Get order details by ticket number.
        
        Args:
            ticket: The order ticket number
            
        Returns:
            Dict with order details or None if not found
        """
        for order in self.orders:
            if order["ticket"] == ticket:
                return order
        return None
    
    def get_open_orders(self) -> List[Dict[str, Any]]:
        """
        Get all open orders.
        
        Returns:
            List of open orders
        """
        return [order for order in self.orders if order["status"] == "open"]
    
    def close_order(self, ticket: int) -> Dict[str, Any]:
        """
        Close an order by ticket number.
        
        Args:
            ticket: The order ticket number
            
        Returns:
            Dict with close operation result
        """
        order = self.get_order(ticket)
        if not order:
            return {
                "status": "error",
                "message": f"Order #{ticket} not found"
            }
        
        if order["status"] != "open":
            return {
                "status": "error",
                "message": f"Order #{ticket} is not open"
            }
        
        # Update order status
        order["status"] = "closed"
        order["close_time"] = datetime.now().isoformat()
        
        # Calculate random profit/loss
        profit_factor = random.uniform(-1.0, 2.0)
        order["profit"] = round(order["volume"] * 10 * profit_factor, 2)
        
        logger.info(f"Order #{ticket} closed with profit: {order['profit']}")
        
        return {
            "status": "success",
            "message": f"Order #{ticket} closed",
            "data": order
        }
    
    def modify_order(self, ticket: int, sl: Optional[float] = None, 
                    tp: Optional[float] = None) -> Dict[str, Any]:
        """
        Modify an order's stop loss and take profit.
        
        Args:
            ticket: The order ticket number
            sl: New stop loss price (optional)
            tp: New take profit price (optional)
            
        Returns:
            Dict with modification result
        """
        order = self.get_order(ticket)
        if not order:
            return {
                "status": "error",
                "message": f"Order #{ticket} not found"
            }
        
        if order["status"] != "open":
            return {
                "status": "error",
                "message": f"Order #{ticket} is not open"
            }
        
        # Update SL/TP if provided
        if sl is not None:
            order["sl"] = float(sl)
        
        if tp is not None:
            order["tp"] = float(tp)
        
        logger.info(f"Order #{ticket} modified: SL={order['sl']}, TP={order['tp']}")
        
        return {
            "status": "success",
            "message": f"Order #{ticket} modified",
            "data": order
        }


# Create a Flask app for the API
def create_app():
    """
    Create a Flask app for the MT4 Mock API.
    
    Returns:
        Flask app instance
    """
    from flask import Flask, request, jsonify
    
    app = Flask(__name__)
    api = MT4MockAPI()
    
    @app.route('/api/trade', methods=['POST'])
    def execute_trade():
        """Execute a trade."""
        data = request.json
        result = api.execute_trade(data)
        return jsonify(result)
    
    @app.route('/api/status', methods=['GET'])
    def server_status():
        """Get server status."""
        return jsonify(api.server_status())
    
    @app.route('/api/orders', methods=['GET'])
    def get_orders():
        """Get all open orders."""
        return jsonify({
            "status": "success", 
            "data": api.get_open_orders()
        })
    
    @app.route('/api/orders/<int:ticket>', methods=['GET'])
    def get_order(ticket):
        """Get order details."""
        order = api.get_order(ticket)
        if order:
            return jsonify({
                "status": "success", 
                "data": order
            })
        return jsonify({
            "status": "error", 
            "message": f"Order #{ticket} not found"
        }), 404
    
    @app.route('/api/orders/<int:ticket>/close', methods=['POST'])
    def close_order(ticket):
        """Close an order."""
        result = api.close_order(ticket)
        return jsonify(result)
    
    @app.route('/api/orders/<int:ticket>/modify', methods=['POST'])
    def modify_order(ticket):
        """Modify an order."""
        data = request.json
        result = api.modify_order(
            ticket, 
            sl=data.get('sl'), 
            tp=data.get('tp')
        )
        return jsonify(result)
    
    # Add health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'ok',
            'service': 'mt4_mock_api'
        })
    
    return app


# Standalone execution
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5003, debug=True)