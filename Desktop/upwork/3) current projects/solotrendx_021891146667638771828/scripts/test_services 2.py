#!/usr/bin/env python3
"""
Basic service test for SoloTrend X

Tests that all services are running and can communicate with each other.
"""

import argparse
import requests
import sys
import json
from datetime import datetime

def check_service_health(url, name):
    """Check if a service is running"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f"✅ {name} service is running: {url}")
            return True
        else:
            print(f"❌ {name} service is not responding properly: {url}")
            print(f"   Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {name} service is not available: {url}")
        print(f"   Error: {e}")
        return False

def send_test_signal(webhook_url):
    """Send a test signal to the webhook API"""
    # Create a simple test signal
    signal = {
        "signal_type": "tradingview",
        "symbol": "EURUSD",
        "direction": "BUY", 
        "price": 1.1234,
        "stop_loss": 1.1134,
        "tp1": 1.1334,
        "timeframe": "M15",
        "strategy": "TEST",
        "risk": "1%",
        "test_id": datetime.now().strftime("%Y%m%d%H%M%S")
    }
    
    try:
        response = requests.post(
            webhook_url,
            json=signal,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print(f"✅ Successfully sent test signal to webhook API")
            print(f"   Response: {response.text}")
            return True
        else:
            print(f"❌ Failed to send test signal to webhook API")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error sending test signal: {e}")
        return False
    
def main():
    """Main test function"""
    parser = argparse.ArgumentParser(description="Test the SoloTrend X services")
    parser.add_argument("--skip-signal", action="store_true", help="Skip sending a test signal")
    args = parser.parse_args()
    
    services = [
        {"url": "http://localhost:5002/api/health", "name": "MT4 REST API"},
        {"url": "http://localhost:5003/health", "name": "Webhook API"},
        {"url": "http://localhost:5001/health", "name": "Telegram Connector"}
    ]
    
    print("Testing SoloTrend X Services...")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Check each service
    all_services_running = True
    for service in services:
        service_running = check_service_health(service["url"], service["name"])
        all_services_running = all_services_running and service_running
    
    print("=" * 50)
    
    # Send a test signal
    if all_services_running and not args.skip_signal:
        print("Sending test signal...")
        success = send_test_signal("http://localhost:5003/webhook/tradingview")
        if success:
            print("✅ End-to-end test successful!")
        else:
            print("❌ End-to-end test failed")
    elif not all_services_running:
        print("⚠ Not sending test signal because some services are not running")
    
    # Print summary
    print("=" * 50)
    print("Test summary:")
    if all_services_running:
        print("✅ All services are running")
    else:
        print("❌ Some services are not running")
        
    print("\nℹ To generate and send a test signal, run:")
    print("python scripts/generate_test_signal.py --verbose")

if __name__ == "__main__":
    main()