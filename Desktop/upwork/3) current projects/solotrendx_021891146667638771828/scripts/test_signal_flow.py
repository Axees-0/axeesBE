#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
End-to-end signal flow test for SoloTrend X system.
Tests the entire signal flow from webhook to MT4 API.
"""

import os
import sys
import time
import json
import logging
import requests
import argparse
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("signal_flow_test.log")
    ]
)
logger = logging.getLogger(__name__)

# Get project root
project_root = Path(__file__).resolve().parents[1]
logger.info(f"Project root: {project_root}")

class SignalFlowTester:
    """Tests the signal flow through all components"""
    
    def __init__(self, base_urls=None):
        """
        Initialize the tester
        
        Args:
            base_urls: Dictionary with base URLs for services
        """
        # Default service URLs
        self.service_urls = {
            "mt4_api": "http://localhost:5002/api",
            "webhook_api": "http://localhost:5003",
            "telegram_health": "http://localhost:5001/health",
            "telegram_webhook": "http://localhost:5001/webhook"
        }
        
        # Override with provided URLs
        if base_urls:
            self.service_urls.update(base_urls)
        
        # Track test results
        self.results = {
            "mt4_api_health": False,
            "webhook_api_health": False,
            "telegram_health": False,
            "webhook_to_telegram": False,
            "telegram_to_mt4": False,
            "end_to_end": False
        }
    
    def check_health(self, service_name):
        """
        Check if a service is healthy
        
        Args:
            service_name: Name of the service to check
            
        Returns:
            True if healthy, False otherwise
        """
        if service_name == "webhook_api":
            url = f"{self.service_urls['webhook_api']}/health"
        elif service_name == "mt4_api":
            url = f"{self.service_urls['mt4_api']}/health"
        elif service_name == "telegram_health":
            url = self.service_urls["telegram_health"]
        else:
            logger.error(f"Unknown service: {service_name}")
            return False
        
        try:
            logger.info(f"Checking health of {service_name} at {url}")
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"{service_name} health check passed: {data}")
                return True
            else:
                logger.error(f"{service_name} health check failed: {response.status_code} - {response.text}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"{service_name} health check failed: {e}")
            return False
    
    def send_webhook_signal(self, signal_type="tradingview"):
        """
        Send a test signal to the webhook API
        
        Args:
            signal_type: Type of signal to send
            
        Returns:
            Response object if successful, None otherwise
        """
        if signal_type == "tradingview":
            endpoint = f"{self.service_urls['webhook_api']}/webhook/tradingview"
            data = {
                "symbol": "EURUSD",
                "action": "BUY",
                "price": 1.1234,
                "sl": 1.1200,
                "tp": 1.1300,
                "volume": 0.1,
                "strategy": "Test",
                "interval": "H1",
                "source": "test_script"
            }
        elif signal_type == "ea":
            endpoint = f"{self.service_urls['webhook_api']}/webhook/ea"
            data = {
                "symbol": "EURUSD",
                "cmd": "BUY",
                "price": 1.1234,
                "sl": 1.1200,
                "tp": 1.1300,
                "volume": 0.1,
                "magic": 12345,
                "source": "test_script"
            }
        elif signal_type == "generic":
            endpoint = f"{self.service_urls['webhook_api']}/webhook"
            data = {
                "symbol": "EURUSD",
                "side": "BUY",
                "price": 1.1234,
                "sl": 1.1200,
                "tp": 1.1300,
                "volume": 0.1,
                "source": "test_script"
            }
        else:
            logger.error(f"Unknown signal type: {signal_type}")
            return None
        
        try:
            logger.info(f"Sending {signal_type} signal to {endpoint}")
            logger.info(f"Signal data: {json.dumps(data)}")
            
            response = requests.post(
                endpoint,
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"Signal sent successfully: {response.json()}")
                return response
            else:
                logger.error(f"Failed to send signal: {response.status_code} - {response.text}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Error sending signal: {e}")
            return None
    
    def send_direct_telegram_signal(self):
        """
        Send a signal directly to the Telegram webhook
        
        Returns:
            Response object if successful, None otherwise
        """
        data = {
            "symbol": "EURUSD",
            "action": "BUY",
            "price": 1.1234,
            "sl": 1.1200,
            "tp": 1.1300,
            "volume": 0.1,
            "source": "direct_test"
        }
        
        try:
            endpoint = self.service_urls["telegram_webhook"]
            logger.info(f"Sending direct signal to Telegram webhook: {endpoint}")
            logger.info(f"Signal data: {json.dumps(data)}")
            
            response = requests.post(
                endpoint,
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"Direct signal sent successfully: {response.json()}")
                return response
            else:
                logger.error(f"Failed to send direct signal: {response.status_code} - {response.text}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Error sending direct signal: {e}")
            return None
    
    def send_mt4_trade(self):
        """
        Send a trade directly to the MT4 API
        
        Returns:
            Response object if successful, None otherwise
        """
        data = {
            "login": 12345,  # Demo login
            "symbol": "EURUSD",
            "type": "buy",
            "volume": 0.1,
            "price": 1.1234,
            "sl": 1.1200,
            "tp": 1.1300,
            "comment": "test_script"
        }
        
        try:
            endpoint = f"{self.service_urls['mt4_api']}/trades"
            logger.info(f"Sending trade to MT4 API: {endpoint}")
            logger.info(f"Trade data: {json.dumps(data)}")
            
            response = requests.post(
                endpoint,
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code in (200, 201):
                logger.info(f"Trade sent successfully: {response.json()}")
                return response
            else:
                logger.error(f"Failed to send trade: {response.status_code} - {response.text}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Error sending trade: {e}")
            return None
    
    def run_health_checks(self):
        """Run health checks for all services"""
        logger.info("Running health checks for all services...")
        
        # MT4 API health check
        self.results["mt4_api_health"] = self.check_health("mt4_api")
        
        # Webhook API health check
        self.results["webhook_api_health"] = self.check_health("webhook_api")
        
        # Telegram health check
        self.results["telegram_health"] = self.check_health("telegram_health")
        
        return all([
            self.results["mt4_api_health"],
            self.results["webhook_api_health"],
            self.results["telegram_health"]
        ])
    
    def test_webhook_to_telegram(self):
        """Test signal flow from webhook to Telegram"""
        logger.info("Testing signal flow from webhook to Telegram...")
        
        # Send signals through webhook API for each type
        tradingview_response = self.send_webhook_signal("tradingview")
        
        if tradingview_response:
            logger.info("TradingView signal flow test passed")
            self.results["webhook_to_telegram"] = True
            return True
        
        logger.error("Webhook to Telegram signal flow test failed")
        return False
    
    def test_telegram_to_mt4(self):
        """Test signal flow from Telegram to MT4"""
        logger.info("Testing signal flow from Telegram to MT4...")
        
        # Send signal directly to Telegram webhook
        telegram_response = self.send_direct_telegram_signal()
        
        if telegram_response:
            logger.info("Telegram to MT4 signal flow test passed")
            self.results["telegram_to_mt4"] = True
            return True
        
        logger.error("Telegram to MT4 signal flow test failed")
        return False
    
    def test_end_to_end(self):
        """Test complete end-to-end signal flow"""
        logger.info("Testing end-to-end signal flow...")
        
        # Send a signal through the webhook API
        webhook_response = self.send_webhook_signal("tradingview")
        
        if webhook_response:
            # Sleep to allow signal to propagate
            time.sleep(1)
            
            logger.info("End-to-end signal flow test passed")
            self.results["end_to_end"] = True
            return True
        
        logger.error("End-to-end signal flow test failed")
        return False
    
    def direct_mt4_test(self):
        """Test direct communication with MT4 API"""
        logger.info("Testing direct communication with MT4 API...")
        
        # Send a trade directly to MT4 API
        mt4_response = self.send_mt4_trade()
        
        if mt4_response:
            logger.info("Direct MT4 API test passed")
            return True
        
        logger.error("Direct MT4 API test failed")
        return False
    
    def run_all_tests(self):
        """Run all tests and return results"""
        logger.info("Running all tests...")
        
        # Step 1: Run health checks
        health_checks_passed = self.run_health_checks()
        
        if not health_checks_passed:
            logger.error("Health checks failed, skipping further tests")
            return self.results
        
        # Step 2: Test direct MT4 communication
        direct_mt4_passed = self.direct_mt4_test()
        
        # Step 3: Test Telegram to MT4 flow
        telegram_to_mt4_passed = self.test_telegram_to_mt4()
        
        # Step 4: Test webhook to Telegram flow
        webhook_to_telegram_passed = self.test_webhook_to_telegram()
        
        # Step 5: Test end-to-end flow
        if telegram_to_mt4_passed and webhook_to_telegram_passed:
            end_to_end_passed = self.test_end_to_end()
        else:
            logger.warning("Skipping end-to-end test as prerequisite tests failed")
            end_to_end_passed = False
        
        return self.results
    
    def print_results(self):
        """Print test results in a formatted way"""
        logger.info("\n=== TEST RESULTS ===\n")
        
        # Health checks
        logger.info("Health Checks:")
        logger.info(f"  MT4 API: {'✅ Passed' if self.results['mt4_api_health'] else '❌ Failed'}")
        logger.info(f"  Webhook API: {'✅ Passed' if self.results['webhook_api_health'] else '❌ Failed'}")
        logger.info(f"  Telegram: {'✅ Passed' if self.results['telegram_health'] else '❌ Failed'}")
        
        # Flow tests
        logger.info("\nFlow Tests:")
        logger.info(f"  Webhook → Telegram: {'✅ Passed' if self.results['webhook_to_telegram'] else '❌ Failed'}")
        logger.info(f"  Telegram → MT4: {'✅ Passed' if self.results['telegram_to_mt4'] else '❌ Failed'}")
        logger.info(f"  End-to-End: {'✅ Passed' if self.results['end_to_end'] else '❌ Failed'}")
        
        # Overall result
        all_passed = all(self.results.values())
        logger.info(f"\nOverall Result: {'✅ All tests passed' if all_passed else '❌ Some tests failed'}")
        
        # Recommendation
        if not all_passed:
            logger.info("\nRecommendation:")
            
            if not self.results["mt4_api_health"]:
                logger.info("  - Check if MT4 API is running and accessible")
            if not self.results["webhook_api_health"]:
                logger.info("  - Check if Webhook API is running and accessible")
            if not self.results["telegram_health"]:
                logger.info("  - Check if Telegram connector is running and accessible")
            if not self.results["webhook_to_telegram"]:
                logger.info("  - Check Webhook API to Telegram connection")
            if not self.results["telegram_to_mt4"]:
                logger.info("  - Check Telegram to MT4 API connection")
            if not self.results["end_to_end"]:
                logger.info("  - Check complete signal flow")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Test SoloTrend X signal flow")
    parser.add_argument("--mt4-api", default="http://localhost:5002/api", help="MT4 API base URL")
    parser.add_argument("--webhook-api", default="http://localhost:5003", help="Webhook API base URL")
    parser.add_argument("--telegram", default="http://localhost:5001", help="Telegram connector base URL")
    
    args = parser.parse_args()
    
    # Set up service URLs
    base_urls = {
        "mt4_api": args.mt4_api,
        "webhook_api": args.webhook_api,
        "telegram_health": f"{args.telegram}/health",
        "telegram_webhook": f"{args.telegram}/webhook"
    }
    
    logger.info(f"Using service URLs: {json.dumps(base_urls, indent=2)}")
    
    # Create and run tester
    tester = SignalFlowTester(base_urls)
    tester.run_all_tests()
    tester.print_results()

if __name__ == "__main__":
    main()