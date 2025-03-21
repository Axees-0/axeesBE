#!/usr/bin/env python
"""
MT4 Connection Test Script
-------------------------
Tests connection to the MT4 terminal and verifies login credentials.

Usage:
python scripts/test_mt4_connection.py
"""

import os
import sys
import datetime
import requests
import time
from urllib.parse import urljoin

def log(message):
    """Log a message with timestamp."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def check_mt4_connection():
    """Check if MT4 terminal is connected via REST API."""
    # Get configuration from environment or use defaults
    mt4_api_port = os.environ.get("PORT", "5002")
    mt4_api_url = f"http://localhost:{mt4_api_port}"
    
    log(f"Testing MT4 connection via {mt4_api_url}...")
    
    # Test health endpoint
    try:
        health_url = urljoin(mt4_api_url.rstrip("/") + "/", "api/health")
        log(f"Accessing health endpoint: {health_url}")
        health_response = requests.get(health_url, timeout=5)
        
        if health_response.status_code == 200:
            log(f"✅ MT4 API health check successful (Status: {health_response.status_code})")
            try:
                health_data = health_response.json()
                log(f"Health response: {health_data}")
                
                # Check if running in mock mode
                if health_data.get("mock_mode"):
                    log("⚠️ WARNING: MT4 API is running in MOCK MODE. It will not connect to real MT4 terminal!")
            except:
                log(f"Health response: {health_response.text}")
        else:
            log(f"❌ MT4 API health check failed (Status: {health_response.status_code})")
            log(f"Response: {health_response.text}")
            return False
    except Exception as e:
        log(f"❌ MT4 API health check error: {str(e)}")
        return False
    
    # Test MT4 authentication
    try:
        auth_url = urljoin(mt4_api_url.rstrip("/") + "/", "api/test_credentials")
        log(f"Testing MT4 authentication: {auth_url}")
        auth_response = requests.get(auth_url, timeout=10)  # Longer timeout for authentication
        
        if auth_response.status_code == 200:
            log(f"✅ MT4 authentication check completed (Status: {auth_response.status_code})")
            try:
                auth_data = auth_response.json()
                log(f"Authentication response: {auth_data}")
                
                if auth_data.get("success"):
                    log("✅ MT4 terminal authenticated successfully!")
                    
                    # Get terminal information if available
                    if "terminal_info" in auth_data:
                        terminal_info = auth_data["terminal_info"]
                        log("\nMT4 Terminal Information:")
                        log(f"- Server: {terminal_info.get('server', 'Not available')}")
                        log(f"- Connected: {terminal_info.get('connected', 'Unknown')}")
                        log(f"- Version: {terminal_info.get('version', 'Not available')}")
                    
                    return True
                else:
                    log(f"❌ MT4 terminal authentication failed: {auth_data.get('message', 'No error message provided')}")
            except:
                log(f"Authentication response: {auth_response.text}")
        else:
            log(f"❌ MT4 authentication check failed (Status: {auth_response.status_code})")
            log(f"Response: {auth_response.text}")
            return False
    except Exception as e:
        log(f"❌ MT4 authentication error: {str(e)}")
        return False
    
    return False

if __name__ == "__main__":
    log("Starting MT4 Connection Test")
    log("==========================")
    
    # Give the MT4 API service time to initialize
    log("Waiting 3 seconds for MT4 API to initialize...")
    time.sleep(3)
    
    # Run test
    success = check_mt4_connection()
    
    # Print summary
    if success:
        log("\n✅ MT4 terminal connection test PASSED")
        log("The MT4 terminal is running and properly connected")
        sys.exit(0)
    else:
        log("\n❌ MT4 terminal connection test FAILED")
        log("Please check that:")
        log("1. MT4 terminal is running on Windows")
        log("2. You are logged in with the correct credentials")
        log("3. The terminal has a green connection indicator")
        log("4. Expert Advisors are enabled (smiling face icon)")
        log("5. The .env file has the correct MT4 settings")
        sys.exit(1)