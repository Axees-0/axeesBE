#!/usr/bin/env python3
"""
Test script for Telegram Connector webhook.
Sends a sample trading signal to verify the connector is working correctly.
"""

import requests
import json
import os
import sys
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get the correct project root
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(script_dir, '..'))
project_root = os.path.abspath(os.path.join(backend_dir, '..', '..'))

# Try to load environment variables from project root .env file if dotenv is available
env_path = os.path.join(project_root, '.env')
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=env_path)
    logger.info(f"Loaded configuration from: {env_path}")
except ImportError:
    logger.warning("python-dotenv not installed, using environment variables directly or defaults")
    # Try to manually parse the .env file
    if os.path.exists(env_path):
        logger.info(f"Manually parsing .env file: {env_path}")
        try:
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip().strip('"\'')
        except Exception as e:
            logger.error(f"Error manually parsing .env file: {e}")

# Get port from environment or use default
flask_port = os.environ.get('FLASK_PORT', '5005')
logger.info(f"Using port: {flask_port}")

# Default webhook URL if not specified - Ensure it matches the endpoint in routes.py
DEFAULT_WEBHOOK_URL = f"http://localhost:{flask_port}/webhook"

def send_test_signal(webhook_url=None):
    """Send a test trading signal to the webhook endpoint."""
    if not webhook_url:
        # First check for WEBHOOK_URL in environment
        webhook_url = os.environ.get('WEBHOOK_URL', DEFAULT_WEBHOOK_URL)
        
        # Log the URL being used
        logger.info(f"Using webhook URL: {webhook_url}")
    
    # Create a sample trading signal
    signal = {
        "symbol": "EURUSD",
        "side": "BUY",
        "price": 1.0765,
        "sl": 1.0730,
        "tp1": 1.0800,
        "tp2": 1.0850,
        "tp3": 1.0900,
        "timeframe": "H1",
        "strategy": "SoloTrend X Test",
        "risk": "1%",
        "timestamp": datetime.now().isoformat(),
        "source": "test_script"
    }
    
    try:
        print(f"\n{'='*80}")
        print(f"SENDING TEST SIGNAL TO: {webhook_url}")
        print(f"{'='*80}")
        
        print("\nSignal data:")
        print(json.dumps(signal, indent=2))
        
        # Send the POST request
        response = requests.post(
            webhook_url,
            json=signal,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Check the response
        if response.status_code == 200:
            print(f"\n✅ SUCCESS: Signal sent successfully (Status: {response.status_code})")
            print("\nResponse data:")
            try:
                print(json.dumps(response.json(), indent=2))
            except json.JSONDecodeError:
                print(response.text)
        else:
            print(f"\n❌ ERROR: Failed to send signal (Status: {response.status_code})")
            print("\nResponse data:")
            print(response.text)
            
        return response.status_code == 200
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ CONNECTION ERROR: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {str(e)}")
        return False

def check_service_running(url):
    """Check if the service is running by sending a request to the health endpoint."""
    # Extract base URL from webhook URL
    try:
        # Handle various URL formats safely
        parts = url.split('/')
        if len(parts) >= 3:  # At minimum http://host
            # Reconstruct base URL (without paths)
            if '://' in url:
                protocol_parts = url.split('://')
                protocol = protocol_parts[0]
                remaining = protocol_parts[1].split('/')
                host_port = remaining[0]
                base_url = f"{protocol}://{host_port}"
            else:
                # Handle case without protocol
                host_port = parts[0]
                base_url = f"http://{host_port}"
        else:
            # Fallback for invalid URLs
            base_url = "http://localhost:5005"
        
        health_url = f"{base_url}/health"
    except Exception as e:
        logger.error(f"Error parsing URL '{url}': {str(e)}")
        # Fallback to default
        health_url = "http://localhost:5005/health"
    
    try:
        logger.info(f"Checking service health at: {health_url}")
        response = requests.get(health_url, timeout=5)
        if response.status_code == 200:
            logger.info(f"Service is running (Status: {response.status_code})")
            return True
        else:
            logger.error(f"Service returned error (Status: {response.status_code})")
            return False
    except requests.exceptions.RequestException as e:
        logger.error(f"Service is not running: {str(e)}")
        return False
        
def check_requirements():
    """Check if required packages are installed."""
    try:
        import requests
        return True
    except ImportError:
        print("\n❌ ERROR: Required package 'requests' is not installed.")
        print("Please install it using: pip install requests")
        print("If you're using a virtual environment, make sure it's activated.")
        return False

if __name__ == "__main__":
    # Check requirements first
    if not check_requirements():
        sys.exit(1)
        
    # Display help info if requested
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help']:
        print("\nUsage: python test_signal.py [webhook_url]")
        print("\nOptions:")
        print("  webhook_url  Optional URL to send the signal to")
        print("\nEnvironment variables used:")
        print("  FLASK_PORT   Port number for the Telegram connector (default: 5005)")
        print("  WEBHOOK_URL  Custom webhook URL (if not specified, uses localhost with FLASK_PORT)")
        print("\nExamples:")
        print("  python test_signal.py")
        print("  python test_signal.py http://localhost:5005/webhook/signal")
        sys.exit(0)
        
    # Get webhook URL from command line argument if provided
    webhook_url = None
    if len(sys.argv) > 1:
        webhook_url = sys.argv[1]
    
    # If no custom URL provided, use the default one from .env
    if not webhook_url:
        webhook_url = DEFAULT_WEBHOOK_URL
    
    # Check if service is running
    if not check_service_running(webhook_url):
        # Extract base URL more safely for the error message
        base_url = "localhost:5005"
        if '://' in webhook_url:
            parts = webhook_url.split('://')
            if len(parts) > 1 and '/' in parts[1]:
                base_url = parts[1].split('/')[0]
        
        print(f"\n❌ ERROR: Telegram connector service is not running at {base_url}")
        print(f"Please start the service using the appropriate script.")
        print(f"Command to run the service: python {os.path.join(script_dir, 'run.py')}")
        sys.exit(1)
    
    success = send_test_signal(webhook_url)
    sys.exit(0 if success else 1)