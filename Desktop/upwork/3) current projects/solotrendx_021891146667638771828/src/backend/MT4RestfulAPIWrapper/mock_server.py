#!/usr/bin/env python3
"""
Simple mock server for the MT4 REST API that doesn't use Flask at all.
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
port = int(os.environ.get('PORT', 7002))

class MockMT4Handler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self, content_type="application/json"):
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.end_headers()
        
    def do_GET(self):
        if self.path == '/api/health':
            self._set_headers()
            response = {
                'status': 'success',
                'data': {
                    'service': 'MT4 REST API (Mock)',
                    'time': '2025-03-20T12:45:00',
                    'healthy': True
                }
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
        if self.path.startswith('/api/trades'):
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Log the received order
            logger.info(f"Received trading order: {post_data.decode()}")
            
            # Respond with success
            self._set_headers()
            response = {
                'status': 'success',
                'data': {
                    'ticket': 12345,
                    'message': 'Order placed successfully with ticket 12345'
                }
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
    httpd = socketserver.TCPServer(server_address, MockMT4Handler)
    logger.info(f"Starting mock MT4 REST API server on port {port}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    finally:
        httpd.server_close()
        logger.info("Server closed")

if __name__ == "__main__":
    run()