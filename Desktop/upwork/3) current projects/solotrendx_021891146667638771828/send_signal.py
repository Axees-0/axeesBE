#!/usr/bin/env python
import requests
import json
import time
import os
import sys

def send_signal():
    """Send a test signal to the webhook API"""
    
    # Determine which port to use - try both the standard and mac versions
    ports = [5003, 7003]
    
    signal_data = {
        "symbol": "EURUSD",
        "side": "BUY",
        "price": 1.1234,
        "sl": 1.12,
        "tp1": 1.13,
        "strategy": "SoloTrend X Real Mode Test",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "source": "python_test_script"
    }
    
    for port in ports:
        try:
            print(f"Attempting to send signal to port {port}...")
            url = f"http://localhost:{port}/webhook/tradingview"
            response = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                data=json.dumps(signal_data),
                timeout=10
            )
            
            print(f"Response status code: {response.status_code}")
            print(f"Response content: {response.text}")
            
            if response.status_code == 200:
                print(f"SUCCESS: Signal sent successfully to port {port}")
                return True
        except Exception as e:
            print(f"Error sending to port {port}: {e}")
    
    print("FAILED: Could not send signal to any port")
    return False

if __name__ == "__main__":
    success = send_signal()
    if not success:
        sys.exit(1)