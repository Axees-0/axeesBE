"""
Global pytest fixtures for SoloTrend X testing.
"""
import os
import pytest
import json
from unittest.mock import MagicMock

# Constants for test data
TEST_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


@pytest.fixture
def sample_tradingview_signal():
    """
    Returns a sample TradingView signal for testing.
    """
    return {
        "symbol": "EURUSD",
        "side": "BUY",
        "price": 1.2345,
        "sl": 1.2300,
        "tp1": 1.2400,
        "tp2": 1.2450,
        "tp3": 1.2500,
        "currentTimeframe": "H1",
        "strategy": "SOLOTREND X",
        "risk": "1%",
        "expiration": "2h"
    }


@pytest.fixture
def sample_ea_signal():
    """
    Returns a sample MT4 EA signal for testing.
    """
    return {
        "symbol": "GBPUSD",
        "side": "SELL",
        "price": 1.3500,
        "sl": 1.3550,
        "tp": 1.3450,
        "type": "signal",
        "strategy": "DYNAMIC TRAILING STOP",
        "timeframe": "M15"
    }


@pytest.fixture
def mock_mt4_api():
    """
    Returns a mocked MT4 API instance.
    """
    mock = MagicMock()
    # Configure the mock to return success for trade operations
    mock.send_trade.return_value = {
        "status": "success",
        "message": "Trade executed (MOCK)",
        "ticket": 12345
    }
    return mock


@pytest.fixture
def mock_telegram_bot():
    """
    Returns a mocked Telegram bot instance.
    """
    mock = MagicMock()
    return mock


def _load_test_data(filename):
    """
    Helper to load test data from the data directory.
    """
    file_path = os.path.join(TEST_DATA_DIR, filename)
    if not os.path.exists(file_path):
        return None
    
    with open(file_path, "r") as f:
        return json.load(f)


@pytest.fixture
def load_test_data():
    """
    Fixture that provides a function to load test data.
    """
    return _load_test_data