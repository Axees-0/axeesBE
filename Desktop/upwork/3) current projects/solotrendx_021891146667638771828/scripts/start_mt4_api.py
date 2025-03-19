#!/usr/bin/env python
# Start the MT4 API (real or mock)

import os
import sys
import subprocess
import argparse
import platform

def main():
    parser = argparse.ArgumentParser(description='Start MT4 API')
    parser.add_argument('--server', default='demo.metaquotes.com', help='MT4 server address')
    parser.add_argument('--login', default='80001413', help='MT4 login ID')
    parser.add_argument('--password', default='9K63%M?d?cTP', help='MT4 password')
    parser.add_argument('--port', type=int, default=5003, help='Port to run the API on')
    parser.add_argument('--mode', default='live', choices=['live', 'mock'], help='API mode')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    
    args = parser.parse_args()
    
    # Set environment variables
    os.environ['MT4_SERVER'] = args.server
    os.environ['MT4_LOGIN'] = args.login
    os.environ['MT4_PASSWORD'] = args.password
    os.environ['PORT'] = str(args.port)
    os.environ['USE_MOCK_MODE'] = 'true' if args.mode == 'mock' else 'false'
    
    # Force mock mode on non-Windows platforms
    current_platform = platform.system()
    if current_platform != 'Windows' and args.mode == 'live':
        print(f"Warning: Running on {current_platform}. MT4 API will run in mock mode only.")
        print("MT4 Manager API only works on Windows. Switching to mock mode.")
        os.environ['USE_MOCK_MODE'] = 'true'
        args.mode = 'mock'
    
    print(f"Starting MT4 API in {args.mode} mode...")
    print(f"Server: {args.server}")
    print(f"Login: {args.login}")
    print(f"Port: {args.port}")
    
    # Create logs directory if it doesn't exist
    os.makedirs('data/logs', exist_ok=True)
    
    # Run the MT4 API implementation
    if args.mode == 'mock':
        module_path = 'src.backend.mt4_mock_api.run_server'
    else:
        module_path = 'src.backend.MT4RestfulAPIWrapper.mt4_rest_api_implementation'
    
    cmd = [sys.executable, '-m', module_path]
    subprocess.run(cmd)

if __name__ == '__main__':
    main()