#!/usr/bin/env python3
"""
Simple mock server for the Webhook API that doesn't use Flask at all.
This is a temporary solution for testing until we resolve the Flask CLI issue.
"""
import os
import sys
import json
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get the port from environment
port = int(os.environ.get('WEBHOOK_API_PORT', 7003))
telegram_webhook_url = os.environ.get('TELEGRAM_WEBHOOK_URL', 'http://localhost:7001/webhook')

class MockWebhookHandler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self, content_type="application/json"):
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.end_headers()
        
    def do_GET(self):
        if self.path == '/health':
            self._set_headers()
            response = {
                'status': 'success',
                'message': 'Webhook API Mock Server is running'
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self._set_headers()
            response = {
                'status': 'error',
                'message': 'Endpoint not found'
            }
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        if self.path.startswith('/webhook/tradingview'):
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Log the received signal
            logger.info(f"Received trading signal: {post_data.decode()}")
            
            # Forward to telegram connector (in a real implementation)
            logger.info(f"Would forward to Telegram Connector at: {telegram_webhook_url}")
            
            # Respond with success
            self._set_headers()
            response = {
                'status': 'success',
                'message': 'Signal received and forwarded to Telegram'
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self._set_headers()
            response = {
                'status': 'error',
                'message': 'Endpoint not found'
            }
            self.wfile.write(json.dumps(response).encode())

def run():
    server_address = ('', port)
    httpd = socketserver.TCPServer(server_address, MockWebhookHandler)
    logger.info(f"Starting mock Webhook API server on port {port}")
    logger.info(f"Telegram webhook URL: {telegram_webhook_url}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    finally:
        httpd.server_close()
        logger.info("Server closed")

if __name__ == "__main__":
    run()