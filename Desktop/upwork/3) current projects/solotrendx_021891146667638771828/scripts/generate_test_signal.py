#!/usr/bin/env python3
"""
Test Signal Generator for SoloTrend X

This script generates test trading signals and sends them to the Webhook API.
It can create both TradingView and EA signals in various configurations for testing.
"""

import argparse
import json
import random
import requests
from datetime import datetime

def generate_tradingview_signal(symbol=None, side=None, price=None):
    """Generate a sample TradingView signal"""
    # Default values
    symbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCHF", "USDCAD"]
    sides = ["BUY", "SELL"]
    
    # Use provided values or random ones
    symbol = symbol or random.choice(symbols)
    side = side or random.choice(sides)
    
    if price is None:
        # Generate a realistic price based on the symbol
        if symbol == "EURUSD":
            price = round(random.uniform(1.05, 1.15), 4)
        elif symbol == "GBPUSD":
            price = round(random.uniform(1.20, 1.30), 4)
        elif symbol == "USDJPY":
            price = round(random.uniform(105.0, 115.0), 2)
        elif symbol == "AUDUSD":
            price = round(random.uniform(0.65, 0.75), 4)
        elif symbol == "USDCHF":
            price = round(random.uniform(0.90, 1.00), 4)
        elif symbol == "USDCAD":
            price = round(random.uniform(1.25, 1.35), 4)
        else:
            price = round(random.uniform(1.0, 2.0), 4)
    
    # Calculate stop loss and take profits based on side
    sl = round(price * 0.99, 4) if side == "BUY" else round(price * 1.01, 4)
    tp1 = round(price * 1.01, 4) if side == "BUY" else round(price * 0.99, 4)
    tp2 = round(price * 1.02, 4) if side == "BUY" else round(price * 0.98, 4)
    tp3 = round(price * 1.03, 4) if side == "BUY" else round(price * 0.97, 4)
    
    timeframes = ["M5", "M15", "H1", "H4", "D1"]
    
    return {
        "signal_type": "tradingview",
        "symbol": symbol,
        "side": side,  # Use side as webhook API expects this field name
        "direction": side, # Include direction for backward compatibility
        "price": price,
        "stop_loss": sl,   # Use full name for better compatibility
        "sl": sl,        # Include sl for backward compatibility
        "tp1": tp1,
        "tp2": tp2,
        "tp3": tp3,
        "timeframe": random.choice(timeframes),
        "strategy": "SOLOTREND X",
        "risk": f"{random.randint(1, 5)}%",
        "expiration": f"{random.randint(1, 12)}h"
    }

def generate_ea_signal(signal_type, symbol=None, ticket=None):
    """Generate a sample EA signal"""
    # Default values
    symbols = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCHF", "USDCAD"]
    ticket = ticket or random.randint(10000, 99999)
    symbol = symbol or random.choice(symbols)
    
    # Generate price based on symbol
    if symbol == "EURUSD":
        price = round(random.uniform(1.05, 1.15), 4)
    elif symbol == "GBPUSD":
        price = round(random.uniform(1.20, 1.30), 4)
    elif symbol == "USDJPY":
        price = round(random.uniform(105.0, 115.0), 2)
    elif symbol == "AUDUSD":
        price = round(random.uniform(0.65, 0.75), 4)
    elif symbol == "USDCHF":
        price = round(random.uniform(0.90, 1.00), 4)
    elif symbol == "USDCAD":
        price = round(random.uniform(1.25, 1.35), 4)
    else:
        price = round(random.uniform(1.0, 2.0), 4)
    
    # Base signal with common fields
    base_signal = {
        "signal_type": "ea",
        "symbol": symbol,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Generate signal based on type
    if signal_type == "open_buy":
        sl = round(price * 0.99, 4)
        tp = round(price * 1.01, 4)
        signal = {
            "action": "OPEN_BUY",
            "price": price,
            "stop_loss": sl,
            "take_profit": tp,
            "volume": round(random.uniform(0.01, 1.0), 2)
        }
    elif signal_type == "open_sell":
        sl = round(price * 1.01, 4)
        tp = round(price * 0.99, 4)
        signal = {
            "action": "OPEN_SELL",
            "price": price,
            "stop_loss": sl,
            "take_profit": tp,
            "volume": round(random.uniform(0.01, 1.0), 2)
        }
    elif signal_type == "close_buy":
        signal = {
            "action": "CLOSE_BUY",
            "ticket": ticket,
            "price": price,
            "profit": round(random.uniform(-10.0, 50.0), 2)
        }
    elif signal_type == "close_sell":
        signal = {
            "action": "CLOSE_SELL",
            "ticket": ticket,
            "price": price,
            "profit": round(random.uniform(-10.0, 50.0), 2)
        }
    elif signal_type == "modify":
        signal = {
            "action": "MODIFY",
            "ticket": ticket,
            "new_sl": round(price * 0.995, 4),
            "new_tp": round(price * 1.015, 4)
        }
    elif signal_type == "trail":
        old_sl = round(price * 0.99, 4)
        new_sl = round(price * 0.995, 4)
        signal = {
            "action": "TRAIL",
            "ticket": ticket,
            "old_sl": old_sl,
            "new_sl": new_sl,
            "trail_points": round(abs(old_sl - new_sl) * 10000)
        }
    else:
        # Invalid type for testing
        signal = {
            "action": "INVALID"
        }
    
    # Merge the base signal with the specific signal type
    base_signal.update(signal)
    return base_signal

def send_signal(webhook_url, signal_data, verbose=False):
    """Send a signal to the webhook"""
    if verbose:
        print(f"Sending signal to {webhook_url}:")
        print(json.dumps(signal_data, indent=2))
    
    try:
        response = requests.post(
            webhook_url,
            json=signal_data,
            headers={"Content-Type": "application/json"}
        )
        
        if verbose:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
        
        return response
    except Exception as e:
        print(f"Error sending signal: {e}")
        return None

def main():
    """Main function for generating and sending test signals"""
    parser = argparse.ArgumentParser(description="Generate and send test trading signals")
    parser.add_argument("--url", default="http://localhost:5003/webhook", 
                        help="Full URL of the webhook endpoint")
    parser.add_argument("--source", choices=["tradingview", "ea"], default="tradingview", 
                        help="Signal source")
    parser.add_argument("--type", help="For EA signals: open_buy, open_sell, close_buy, close_sell, modify, trail")
    parser.add_argument("--symbol", help="Trading symbol (e.g., EURUSD)")
    parser.add_argument("--side", choices=["BUY", "SELL"], help="Trade direction (for TradingView)")
    parser.add_argument("--price", type=float, help="Price level")
    parser.add_argument("--ticket", type=int, help="Ticket number (for EA signals)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--count", type=int, default=1, help="Number of signals to generate")
    parser.add_argument("--direct", action="store_true", 
                        help="Send directly to Telegram connector (bypass webhook API)")
    
    args = parser.parse_args()
    
    # Prepare the webhook URL
    if args.direct:
        webhook_url = args.url  # Use the provided URL directly
    else:
        # Check if URL already includes the source part
        if f"/{args.source}" in args.url:
            webhook_url = args.url
        # Check if URL ends with /webhook
        elif args.url.endswith("/webhook"):
            webhook_url = f"{args.url}/{args.source}"
        # If URL doesn't have webhook at all
        elif "webhook" not in args.url:
            webhook_url = f"{args.url}/webhook/{args.source}"
        # Default case: just use the URL as is
        else:
            webhook_url = args.url
            
    # Debug output for URL construction
    if args.verbose:
        print(f"Original URL: {args.url}")
        print(f"Final webhook URL: {webhook_url}")
    
    for i in range(args.count):
        if args.count > 1:
            print(f"\nGenerating signal {i+1}/{args.count}")
        
        # Generate signal based on source
        if args.source == "tradingview":
            signal = generate_tradingview_signal(args.symbol, args.side, args.price)
            # Make sure the side field is set properly for webhook API
            if 'side' not in signal and 'direction' in signal:
                signal['side'] = signal['direction']
        else:  # EA signals
            if not args.type:
                ea_types = ["open_buy", "open_sell", "close_buy", "close_sell", "modify", "trail"]
                signal_type = random.choice(ea_types)
            else:
                signal_type = args.type
            
            signal = generate_ea_signal(signal_type, args.symbol, args.ticket)
        
        # For debugging: print the webhook URL
        if args.verbose:
            print(f"Using webhook URL: {webhook_url}")
            
        # Send the signal
        response = send_signal(webhook_url, signal, args.verbose)
        
        if response and response.status_code == 200 and not args.verbose:
            print("✅ Signal sent successfully")
        elif response and not args.verbose:
            print(f"❌ Signal failed with status {response.status_code}")

if __name__ == "__main__":
    main()