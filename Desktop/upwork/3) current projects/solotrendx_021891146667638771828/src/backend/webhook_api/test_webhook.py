"""
Script to test the complete signal flow directly.
This script sends a signal directly to the Webhook API
and then directly to the Telegram Connector.
"""
import requests
import json
import sys
import random
import argparse

def generate_tradingview_signal(symbol="EURUSD", side="BUY"):
    """Generate a sample TradingView signal"""
    price = round(random.uniform(1.05, 1.15), 4)
    
    # Calculate stop loss and take profits based on side
    sl = round(price * 0.99, 4) if side == "BUY" else round(price * 1.01, 4)
    tp1 = round(price * 1.01, 4) if side == "BUY" else round(price * 0.99, 4)
    tp2 = round(price * 1.02, 4) if side == "BUY" else round(price * 0.98, 4)
    tp3 = round(price * 1.03, 4) if side == "BUY" else round(price * 0.97, 4)
    
    timeframes = ["M5", "M15", "H1", "H4", "D1"]
    
    return {
        "signal_type": "tradingview",
        "symbol": symbol,
        "side": side,
        "direction": side,
        "price": price,
        "stop_loss": sl,
        "sl": sl,
        "tp1": tp1,
        "tp2": tp2,
        "tp3": tp3,
        "timeframe": random.choice(timeframes),
        "strategy": "SOLOTREND X",
        "risk": f"{random.randint(1, 5)}%",
        "expiration": f"{random.randint(1, 12)}h"
    }

def test_webhook_api(signal):
    """Test sending to the Webhook API"""
    print("Sending signal to Webhook API...")
    url = "http://localhost:5003/webhook/tradingview"
    try:
        response = requests.post(
            url,
            json=signal,
            headers={"Content-Type": "application/json"}
        )
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending to Webhook API: {e}")
        return False

def test_telegram_connector(signal):
    """Test sending directly to Telegram Connector"""
    print("Sending signal directly to Telegram Connector...")
    url = "http://localhost:5001/webhook"
    try:
        response = requests.post(
            url,
            json=signal,
            headers={"Content-Type": "application/json"}
        )
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending to Telegram Connector: {e}")
        return False

def main():
    """Run tests for both APIs"""
    parser = argparse.ArgumentParser(description="Test Webhook and Telegram APIs")
    parser.add_argument("--symbol", default="EURUSD", help="Trading symbol (e.g., EURUSD)")
    parser.add_argument("--side", choices=["BUY", "SELL"], default="BUY", help="Trade direction")
    parser.add_argument("--skip-webhook", action="store_true", help="Skip testing the webhook API")
    parser.add_argument("--skip-telegram", action="store_true", help="Skip testing the Telegram Connector")
    
    args = parser.parse_args()
    
    # Generate a test signal
    signal = generate_tradingview_signal(args.symbol, args.side)
    print(f"Test signal: {json.dumps(signal, indent=2)}")
    
    # Test both APIs
    webhook_success = True
    telegram_success = True
    
    if not args.skip_webhook:
        webhook_success = test_webhook_api(signal)
    
    if not args.skip_telegram:
        telegram_success = test_telegram_connector(signal)
    
    # Summary
    print("\n--- Test Results ---")
    if not args.skip_webhook:
        print(f"Webhook API: {'✅ Success' if webhook_success else '❌ Failed'}")
    else:
        print("Webhook API: Skipped")
        
    if not args.skip_telegram:
        print(f"Telegram Connector: {'✅ Success' if telegram_success else '❌ Failed'}")
    else:
        print("Telegram Connector: Skipped")
    
    if webhook_success and telegram_success:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())