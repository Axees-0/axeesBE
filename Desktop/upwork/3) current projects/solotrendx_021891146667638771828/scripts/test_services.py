#!/usr/bin/env python
"""
MT4 Services Test Script
------------------------
This script verifies connections between all components of the SoloTrend X system.
It tests:
1. MT4 REST API health endpoint
2. Webhook API health endpoint
3. Telegram Bot health endpoint
4. Connections between components

Usage:
python scripts/test_services.py
"""

import os
import sys
import requests
import json
import datetime
import time
from urllib.parse import urljoin

def log(message):
    """Log a message with timestamp."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def check_endpoint(url, description):
    """Check if an endpoint is accessible and returns a 200 status code."""
    log(f"Testing {description} at {url}...")
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            log(f"✅ {description} is UP (Status: {response.status_code})")
            try:
                return response.json()
            except:
                return response.text
        else:
            log(f"❌ {description} returned status code {response.status_code}")
            try:
                log(f"Response: {response.text}")
            except:
                pass
            return None
    except requests.exceptions.ConnectionError:
        log(f"❌ {description} connection refused - service may not be running")
        return None
    except requests.exceptions.Timeout:
        log(f"❌ {description} timed out - service may be unresponsive")
        return None
    except Exception as e:
        log(f"❌ {description} error: {str(e)}")
        return None

def check_all_services():
    """Check all services and connections."""
    # Service ports (defaults if not in environment)
    mt4_api_port = os.environ.get("PORT", "5002")
    webhook_api_port = os.environ.get("WEBHOOK_API_PORT", "5003")
    telegram_port = os.environ.get("FLASK_PORT", "5005")
    
    # Service URLs
    mt4_api_url = f"http://localhost:{mt4_api_port}"
    webhook_api_url = f"http://localhost:{webhook_api_port}"
    telegram_url = f"http://localhost:{telegram_port}"
    
    # Health endpoint paths (normalized to ensure consistency)
    mt4_health_path = "/api/health"
    webhook_health_path = "/health"
    telegram_health_path = "/health"
    
    # 1. Check MT4 API
    mt4_health_url = urljoin(mt4_api_url.rstrip("/") + "/", mt4_health_path.lstrip("/"))
    mt4_result = check_endpoint(mt4_health_url, "MT4 REST API")
    
    # 2. Check Webhook API
    webhook_health_url = urljoin(webhook_api_url.rstrip("/") + "/", webhook_health_path.lstrip("/"))
    webhook_result = check_endpoint(webhook_health_url, "Webhook API")
    
    # 3. Check Telegram Bot
    telegram_health_url = urljoin(telegram_url.rstrip("/") + "/", telegram_health_path.lstrip("/"))
    telegram_result = check_endpoint(telegram_health_url, "Telegram Bot")
    
    # Check if services can connect to each other
    log("\nChecking connections between services...")
    
    # Check if Telegram connector can access MT4 API
    telegram_mt4_check_url = urljoin(telegram_url.rstrip("/") + "/", "check_mt4_connection")
    telegram_mt4_result = check_endpoint(telegram_mt4_check_url, "Telegram -> MT4 API connection")
    
    # Check if MT4 API is in mock mode
    if mt4_result and isinstance(mt4_result, dict) and "mock_mode" in mt4_result:
        if mt4_result["mock_mode"]:
            log("⚠️ WARNING: MT4 API is running in MOCK MODE. Set USE_MOCK_MODE=false to connect to real MT4.")
        else:
            log("✅ MT4 API is configured to connect to real MT4 terminal")
    
    # Test MT4 API credentials
    if mt4_result:
        mt4_credentials_url = urljoin(mt4_api_url.rstrip("/") + "/", "api/test_credentials")
        mt4_credentials_result = check_endpoint(mt4_credentials_url, "MT4 Authentication")
        if mt4_credentials_result and isinstance(mt4_credentials_result, dict):
            if mt4_credentials_result.get("success"):
                log("✅ MT4 credentials verified successfully")
            else:
                log(f"❌ MT4 credentials failed: {mt4_credentials_result.get('message', 'Unknown error')}")
    
    # Provide summary
    log("\n=== Service Test Summary ===")
    log(f"MT4 REST API: {'✅ UP' if mt4_result else '❌ DOWN'}")
    log(f"Webhook API: {'✅ UP' if webhook_result else '❌ DOWN'}")
    log(f"Telegram Bot: {'✅ UP' if telegram_result else '❌ DOWN'}")
    log(f"Telegram -> MT4: {'✅ Connected' if telegram_mt4_result else '❌ Not connected'}")
    
    # Return overall status
    return all([mt4_result, webhook_result, telegram_result, telegram_mt4_result])

if __name__ == "__main__":
    log("Starting MT4 Services Test")
    log("=========================")
    
    # Give services time to fully initialize
    log("Waiting 5 seconds for services to initialize...")
    time.sleep(5)
    
    # Run tests
    success = check_all_services()
    
    # Exit with appropriate status code
    if success:
        log("\n✅ All tests passed! The system is properly connected and configured.")
        sys.exit(0)
    else:
        log("\n❌ Some tests failed. Please check the logs above for details.")
        sys.exit(1)