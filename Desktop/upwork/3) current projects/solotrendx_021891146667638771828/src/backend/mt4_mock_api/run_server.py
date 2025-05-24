#!/usr/bin/env python
"""
Script to run the MT4 Mock API server.
"""
import logging
import argparse
from api import create_app

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('data/logs/mt4_mock_api.log')
    ]
)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Run the MT4 Mock API server')
    parser.add_argument('--host', default='0.0.0.0',
                        help='Host to bind the server to')
    parser.add_argument('--port', type=int, default=5003,
                        help='Port to bind the server to')
    parser.add_argument('--debug', action='store_true',
                        help='Run in debug mode')
    return parser.parse_args()

def main():
    """Main function to run the server."""
    args = parse_args()
    app = create_app()
    
    logging.info(f"Starting MT4 Mock API server on {args.host}:{args.port}")
    app.run(host=args.host, port=args.port, debug=args.debug)

if __name__ == '__main__':
    main()