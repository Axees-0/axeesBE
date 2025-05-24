"""
Unit tests for the MT4 Mock API.
"""
import pytest
import json
from unittest.mock import patch
from flask import Flask

# Import the module to test
from src.backend.mt4_mock_api.api import MT4MockAPI, create_app


class TestMT4MockAPI:
    
    def test_init(self):
        """Test that the API initializes correctly."""
        api = MT4MockAPI()
        assert api.mode == "mock"
        assert api.port == 5003
    
    def test_server_status(self):
        """Test the server status endpoint."""
        api = MT4MockAPI()
        status = api.server_status()
        assert status["status"] == "ok"
        assert status["mode"] == "mock"
        assert "server_time" in status
    
    def test_execute_trade_buy(self):
        """Test executing a buy trade."""
        trade_data = {
            "symbol": "EURUSD",
            "type": "BUY",
            "volume": 0.1,
            "price": 1.2345,
            "sl": 1.2300,
            "tp": 1.2400
        }
        
        api = MT4MockAPI()
        result = api.execute_trade(trade_data)
        
        assert result["status"] == "success"
        assert "ticket" in result["data"]
        assert result["data"]["symbol"] == "EURUSD"
        assert result["data"]["type"] == "BUY"
        assert result["data"]["volume"] == 0.1
        assert result["data"]["sl"] == 1.23
        assert result["data"]["tp"] == 1.24
    
    def test_execute_trade_sell(self):
        """Test executing a sell trade."""
        trade_data = {
            "symbol": "GBPUSD",
            "type": "SELL",
            "volume": 0.2,
            "price": 1.3500,
            "sl": 1.3550,
            "tp": 1.3450
        }
        
        api = MT4MockAPI()
        result = api.execute_trade(trade_data)
        
        assert result["status"] == "success"
        assert "ticket" in result["data"]
        assert result["data"]["symbol"] == "GBPUSD"
        assert result["data"]["type"] == "SELL"
    
    def test_execute_trade_validation(self):
        """Test trade validation."""
        # Missing required fields
        trade_data = {
            "symbol": "EURUSD",
            # Missing type field
            "volume": 0.1
        }
        
        api = MT4MockAPI()
        result = api.execute_trade(trade_data)
        
        assert result["status"] == "error"
        assert "message" in result
        assert "type" in result["message"]
    
    def test_get_order(self):
        """Test getting an order by ticket."""
        api = MT4MockAPI()
        
        # Execute a trade first
        trade_data = {"symbol": "EURUSD", "type": "BUY", "volume": 0.1}
        result = api.execute_trade(trade_data)
        ticket = result["data"]["ticket"]
        
        # Get the order
        order = api.get_order(ticket)
        assert order is not None
        assert order["ticket"] == ticket
        assert order["symbol"] == "EURUSD"
        
        # Try getting a non-existent order
        non_existent = api.get_order(99999)
        assert non_existent is None
    
    def test_close_order(self):
        """Test closing an order."""
        api = MT4MockAPI()
        
        # Execute a trade first
        trade_data = {"symbol": "EURUSD", "type": "BUY", "volume": 0.1}
        result = api.execute_trade(trade_data)
        ticket = result["data"]["ticket"]
        
        # Close the order
        close_result = api.close_order(ticket)
        assert close_result["status"] == "success"
        assert close_result["data"]["status"] == "closed"
        assert "profit" in close_result["data"]
        assert "close_time" in close_result["data"]
        
        # Try closing an already closed order
        close_again = api.close_order(ticket)
        assert close_again["status"] == "error"
    
    def test_modify_order(self):
        """Test modifying an order."""
        api = MT4MockAPI()
        
        # Execute a trade first
        trade_data = {"symbol": "EURUSD", "type": "BUY", "volume": 0.1}
        result = api.execute_trade(trade_data)
        ticket = result["data"]["ticket"]
        
        # Modify the order
        modify_result = api.modify_order(ticket, sl=1.2000, tp=1.2500)
        assert modify_result["status"] == "success"
        assert modify_result["data"]["sl"] == 1.2000
        assert modify_result["data"]["tp"] == 1.2500
    
    def test_flask_app(self):
        """Test the Flask app creation."""
        app = create_app()
        assert isinstance(app, Flask)


class TestMT4MockAPIFlask:
    @pytest.fixture
    def client(self):
        app = create_app()
        app.config['TESTING'] = True
        with app.test_client() as client:
            yield client
    
    def test_server_status_endpoint(self, client):
        """Test the server status endpoint."""
        response = client.get('/api/status')
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["status"] == "ok"
        assert data["mode"] == "mock"
    
    def test_execute_trade_endpoint(self, client):
        """Test the trade execution endpoint."""
        trade_data = {
            "symbol": "EURUSD",
            "type": "BUY",
            "volume": 0.1
        }
        response = client.post('/api/trade', 
                            json=trade_data, 
                            content_type='application/json')
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["status"] == "success"
        assert "ticket" in data["data"]
    
    def test_get_orders_endpoint(self, client):
        """Test the get orders endpoint."""
        # Execute a trade first
        trade_data = {"symbol": "EURUSD", "type": "BUY", "volume": 0.1}
        client.post('/api/trade', json=trade_data, content_type='application/json')
        
        # Get all orders
        response = client.get('/api/orders')
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["status"] == "success"
        assert isinstance(data["data"], list)
        assert len(data["data"]) > 0
    
    def test_get_order_endpoint(self, client):
        """Test the get order endpoint."""
        # Execute a trade first
        trade_data = {"symbol": "EURUSD", "type": "BUY", "volume": 0.1}
        response = client.post('/api/trade', json=trade_data, content_type='application/json')
        trade_result = json.loads(response.data)
        ticket = trade_result["data"]["ticket"]
        
        # Get the order
        response = client.get(f'/api/orders/{ticket}')
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["status"] == "success"
        assert data["data"]["ticket"] == ticket
    
    def test_close_order_endpoint(self, client):
        """Test the close order endpoint."""
        # Execute a trade first
        trade_data = {"symbol": "EURUSD", "type": "BUY", "volume": 0.1}
        response = client.post('/api/trade', json=trade_data, content_type='application/json')
        trade_result = json.loads(response.data)
        ticket = trade_result["data"]["ticket"]
        
        # Close the order
        response = client.post(f'/api/orders/{ticket}/close')
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["status"] == "success"
        assert data["data"]["status"] == "closed"
    
    def test_modify_order_endpoint(self, client):
        """Test the modify order endpoint."""
        # Execute a trade first
        trade_data = {"symbol": "EURUSD", "type": "BUY", "volume": 0.1}
        response = client.post('/api/trade', json=trade_data, content_type='application/json')
        trade_result = json.loads(response.data)
        ticket = trade_result["data"]["ticket"]
        
        # Modify the order
        modify_data = {"sl": 1.2000, "tp": 1.2500}
        response = client.post(f'/api/orders/{ticket}/modify', 
                            json=modify_data, 
                            content_type='application/json')
        data = json.loads(response.data)
        assert response.status_code == 200
        assert data["status"] == "success"
        assert data["data"]["sl"] == 1.2000
        assert data["data"]["tp"] == 1.2500