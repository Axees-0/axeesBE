@echo off
REM SoloTrend X Setup Helper using the local Python installation
REM This batch file sets up the environment using the Python in environment/python folder

echo ===============================================
echo SoloTrend X Environment Setup (Local Python)
echo ===============================================
echo.

REM Set path to local Python
set PYTHON_PATH=%CD%\environment\python
echo Using Python from: %PYTHON_PATH%

REM Check if Python exists in the specified directory
if not exist "%PYTHON_PATH%\python.exe" (
    echo ERROR: Python not found in %PYTHON_PATH%
    echo Please check the directory structure and ensure python.exe is available.
    goto :ERROR
)

REM Add the local Python to PATH temporarily
set PATH=%PYTHON_PATH%;%PYTHON_PATH%\Scripts;%PATH%

REM Check if Python works
echo Checking Python...
"%PYTHON_PATH%\python.exe" --version
if %errorlevel% neq 0 (
    echo ERROR: Failed to run Python from %PYTHON_PATH%
    goto :ERROR
)

REM Create necessary directories
echo Creating logs directory...
mkdir data\logs 2>nul

REM Create environment variables file
echo Creating .env file...
echo # SoloTrend X Environment Variables > .env
echo MT4_API_URL=http://localhost:5003/api >> .env
echo WEBHOOK_API_URL=http://localhost:5000 >> .env
echo TELEGRAM_CONNECTOR_URL=http://localhost:5001 >> .env
echo MT4_SERVER=demo.metaquotes.com >> .env
echo MT4_LOGIN=80001413 >> .env
echo MT4_PASSWORD=9K63%%M?d?cTP >> .env
echo USE_REAL_MT4=true >> .env
echo TELEGRAM_BOT_TOKEN= >> .env
echo TELEGRAM_CHAT_ID= >> .env

REM Upgrade pip
echo Installing/upgrading pip...
"%PYTHON_PATH%\python.exe" -m pip install --upgrade pip

REM Install required packages
echo Installing required packages...
"%PYTHON_PATH%\python.exe" -m pip install flask==2.2.3 python-telegram-bot==13.7 python-dotenv==0.19.2 requests==2.28.2 pyjwt==2.6.0 flask-cors==3.0.10

REM Create MT4 API starter batch file
echo Creating MT4 API starter batch file...
echo @echo off > start_mt4_api.bat
echo set PATH=%PYTHON_PATH%;%PYTHON_PATH%\Scripts;%%PATH%% >> start_mt4_api.bat
echo echo Starting MT4 API service... >> start_mt4_api.bat
echo "%PYTHON_PATH%\python.exe" scripts\start_mt4_api.py --server demo.metaquotes.com --login 80001413 --password "9K63%%M?d?cTP" --port 5003 --mode mock >> start_mt4_api.bat

REM Create the start_mt4_api.py file if it doesn't exist
if not exist "scripts\start_mt4_api.py" (
    echo Creating start_mt4_api.py script...
    mkdir scripts 2>nul
    
    echo import os > scripts\start_mt4_api.py
    echo import sys >> scripts\start_mt4_api.py
    echo import subprocess >> scripts\start_mt4_api.py
    echo import argparse >> scripts\start_mt4_api.py
    echo import platform >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo def main(): >> scripts\start_mt4_api.py
    echo     parser = argparse.ArgumentParser(description='Start MT4 API') >> scripts\start_mt4_api.py
    echo     parser.add_argument('--server', default='demo.metaquotes.com', help='MT4 server address') >> scripts\start_mt4_api.py
    echo     parser.add_argument('--login', default='80001413', help='MT4 login ID') >> scripts\start_mt4_api.py
    echo     parser.add_argument('--password', default='9K63%%M?d?cTP', help='MT4 password') >> scripts\start_mt4_api.py
    echo     parser.add_argument('--port', type=int, default=5003, help='Port to run the API on') >> scripts\start_mt4_api.py
    echo     parser.add_argument('--mode', default='live', choices=['live', 'mock'], help='API mode') >> scripts\start_mt4_api.py
    echo     parser.add_argument('--debug', action='store_true', help='Enable debug mode') >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo     args = parser.parse_args() >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo     # Set environment variables >> scripts\start_mt4_api.py
    echo     os.environ['MT4_SERVER'] = args.server >> scripts\start_mt4_api.py
    echo     os.environ['MT4_LOGIN'] = args.login >> scripts\start_mt4_api.py
    echo     os.environ['MT4_PASSWORD'] = args.password >> scripts\start_mt4_api.py
    echo     os.environ['PORT'] = str(args.port) >> scripts\start_mt4_api.py
    echo     os.environ['USE_MOCK_MODE'] = 'true' if args.mode == 'mock' else 'false' >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo     # Force mock mode on non-Windows platforms >> scripts\start_mt4_api.py
    echo     current_platform = platform.system() >> scripts\start_mt4_api.py
    echo     if current_platform != 'Windows' and args.mode == 'live': >> scripts\start_mt4_api.py
    echo         print(f"Warning: Running on {current_platform}. MT4 API will run in mock mode only.") >> scripts\start_mt4_api.py
    echo         print("MT4 Manager API only works on Windows. Switching to mock mode.") >> scripts\start_mt4_api.py
    echo         os.environ['USE_MOCK_MODE'] = 'true' >> scripts\start_mt4_api.py
    echo         args.mode = 'mock' >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo     print(f"Starting MT4 API in {args.mode} mode...") >> scripts\start_mt4_api.py
    echo     print(f"Server: {args.server}") >> scripts\start_mt4_api.py
    echo     print(f"Login: {args.login}") >> scripts\start_mt4_api.py
    echo     print(f"Port: {args.port}") >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo     # Create logs directory if it doesn't exist >> scripts\start_mt4_api.py
    echo     os.makedirs('data/logs', exist_ok=True) >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo     # Run the MT4 API mock server >> scripts\start_mt4_api.py
    echo     print("Running in mock mode - starting mock server...") >> scripts\start_mt4_api.py
    echo     # Simple HTTP server that mimics the MT4 API >> scripts\start_mt4_api.py
    echo     from http.server import HTTPServer, BaseHTTPRequestHandler >> scripts\start_mt4_api.py
    echo     import json >> scripts\start_mt4_api.py
    echo     import random >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo     class MockMT4Handler(BaseHTTPRequestHandler): >> scripts\start_mt4_api.py
    echo         def _set_headers(self, content_type='application/json'): >> scripts\start_mt4_api.py
    echo             self.send_response(200) >> scripts\start_mt4_api.py
    echo             self.send_header('Content-type', content_type) >> scripts\start_mt4_api.py
    echo             self.end_headers() >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo         def do_GET(self): >> scripts\start_mt4_api.py
    echo             if self.path == '/api/health': >> scripts\start_mt4_api.py
    echo                 self._set_headers() >> scripts\start_mt4_api.py
    echo                 response = { >> scripts\start_mt4_api.py
    echo                     'status': 'success', >> scripts\start_mt4_api.py
    echo                     'data': { >> scripts\start_mt4_api.py
    echo                         'service': 'MT4 Mock API', >> scripts\start_mt4_api.py
    echo                         'healthy': True >> scripts\start_mt4_api.py
    echo                     } >> scripts\start_mt4_api.py
    echo                 } >> scripts\start_mt4_api.py
    echo                 self.wfile.write(json.dumps(response).encode()) >> scripts\start_mt4_api.py
    echo             elif self.path == '/api/status': >> scripts\start_mt4_api.py
    echo                 self._set_headers() >> scripts\start_mt4_api.py
    echo                 response = { >> scripts\start_mt4_api.py
    echo                     'status': 'success', >> scripts\start_mt4_api.py
    echo                     'data': { >> scripts\start_mt4_api.py
    echo                         'connected': True, >> scripts\start_mt4_api.py
    echo                         'logged_in': True, >> scripts\start_mt4_api.py
    echo                         'server': args.server, >> scripts\start_mt4_api.py
    echo                         'port': 443, >> scripts\start_mt4_api.py
    echo                         'using_mock_mode': True >> scripts\start_mt4_api.py
    echo                     } >> scripts\start_mt4_api.py
    echo                 } >> scripts\start_mt4_api.py
    echo                 self.wfile.write(json.dumps(response).encode()) >> scripts\start_mt4_api.py
    echo             else: >> scripts\start_mt4_api.py
    echo                 self._set_headers() >> scripts\start_mt4_api.py
    echo                 response = {'status': 'error', 'message': 'Endpoint not found'} >> scripts\start_mt4_api.py
    echo                 self.wfile.write(json.dumps(response).encode()) >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo         def do_POST(self): >> scripts\start_mt4_api.py
    echo             content_length = int(self.headers['Content-Length']) >> scripts\start_mt4_api.py
    echo             post_data = self.rfile.read(content_length) >> scripts\start_mt4_api.py
    echo             data = json.loads(post_data.decode('utf-8')) >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo             if self.path == '/api/trade': >> scripts\start_mt4_api.py
    echo                 # Mock place order >> scripts\start_mt4_api.py
    echo                 self._set_headers() >> scripts\start_mt4_api.py
    echo                 ticket = random.randint(10000, 99999) >> scripts\start_mt4_api.py
    echo                 response = { >> scripts\start_mt4_api.py
    echo                     'status': 'success', >> scripts\start_mt4_api.py
    echo                     'data': { >> scripts\start_mt4_api.py
    echo                         'ticket': ticket, >> scripts\start_mt4_api.py
    echo                         'message': f'Order placed successfully with ticket {ticket}' >> scripts\start_mt4_api.py
    echo                     } >> scripts\start_mt4_api.py
    echo                 } >> scripts\start_mt4_api.py
    echo                 self.wfile.write(json.dumps(response).encode()) >> scripts\start_mt4_api.py
    echo             else: >> scripts\start_mt4_api.py
    echo                 self._set_headers() >> scripts\start_mt4_api.py
    echo                 response = {'status': 'error', 'message': 'Endpoint not found'} >> scripts\start_mt4_api.py
    echo                 self.wfile.write(json.dumps(response).encode()) >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo     # Run server >> scripts\start_mt4_api.py
    echo     server = HTTPServer(('0.0.0.0', args.port), MockMT4Handler) >> scripts\start_mt4_api.py
    echo     print(f'Mock MT4 API server started at http://localhost:{args.port}') >> scripts\start_mt4_api.py
    echo     try: >> scripts\start_mt4_api.py
    echo         server.serve_forever() >> scripts\start_mt4_api.py
    echo     except KeyboardInterrupt: >> scripts\start_mt4_api.py
    echo         print('Server stopped') >> scripts\start_mt4_api.py
    echo. >> scripts\start_mt4_api.py
    echo if __name__ == '__main__': >> scripts\start_mt4_api.py
    echo     main() >> scripts\start_mt4_api.py
)

REM Create webhook API starter batch file
echo Creating Webhook API starter batch file...
echo @echo off > start_webhook_api.bat
echo set PATH=%PYTHON_PATH%;%PYTHON_PATH%\Scripts;%%PATH%% >> start_webhook_api.bat
echo echo Starting Webhook API simulation... >> start_webhook_api.bat
echo "%PYTHON_PATH%\python.exe" -c "from http.server import HTTPServer, BaseHTTPRequestHandler; import json; import time; class WebhookHandler(BaseHTTPRequestHandler): def _set_headers(self): self.send_response(200); self.send_header('Content-type', 'application/json'); self.end_headers(); def do_GET(self): if self.path == '/health': self._set_headers(); self.wfile.write(json.dumps({'status': 'ok', 'service': 'webhook_api'}).encode()); else: self._set_headers(); self.wfile.write(json.dumps({'status': 'error', 'message': 'Endpoint not found'}).encode()); def do_POST(self): content_length = int(self.headers['Content-Length']); post_data = self.rfile.read(content_length); print(f'Received webhook: {post_data.decode()}'); self._set_headers(); self.wfile.write(json.dumps({'status': 'success', 'message': 'Signal received'}).encode()); print('Starting simple webhook server on port 5000...'); server = HTTPServer(('0.0.0.0', 5000), WebhookHandler); server.serve_forever()" >> start_webhook_api.bat

REM Create all services starter batch file
echo Creating all services starter batch file...
echo @echo off > start_all_services.bat
echo echo Starting SoloTrend X services... >> start_all_services.bat
echo. >> start_all_services.bat
echo rem Start MT4 API service >> start_all_services.bat
echo start "MT4 API" cmd /c start_mt4_api.bat >> start_all_services.bat
echo. >> start_all_services.bat
echo rem Wait for MT4 API to start >> start_all_services.bat
echo echo Waiting for MT4 API to start... >> start_all_services.bat
echo timeout /t 5 >> start_all_services.bat
echo. >> start_all_services.bat
echo rem Start Webhook API service >> start_all_services.bat
echo start "Webhook API" cmd /c start_webhook_api.bat >> start_all_services.bat
echo. >> start_all_services.bat
echo echo All services started! >> start_all_services.bat
echo echo MT4 API: http://localhost:5003/api >> start_all_services.bat
echo echo Webhook API: http://localhost:5000 >> start_all_services.bat

REM Create a test signal batch file
echo Creating test signal batch file...
echo @echo off > send_test_signal.bat
echo set PATH=%PYTHON_PATH%;%PYTHON_PATH%\Scripts;%%PATH%% >> send_test_signal.bat
echo echo Sending test trading signal... >> send_test_signal.bat
echo "%PYTHON_PATH%\python.exe" -c "import requests; import json; import random; signal = {'symbol': 'EURUSD', 'type': 'buy', 'price': round(random.uniform(1.05, 1.15), 5), 'sl': round(random.uniform(1.04, 1.05), 5), 'tp': round(random.uniform(1.15, 1.20), 5), 'volume': 0.1, 'comment': 'Test signal'}; print(f'Sending signal: {json.dumps(signal, indent=2)}'); response = requests.post('http://localhost:5003/api/trade', json=signal); print(f'Response: {response.status_code}'); print(response.json())" >> send_test_signal.bat

echo.
echo ===============================================
echo Setup completed successfully!
echo ===============================================
echo.
echo The following batch files have been created:
echo 1. start_mt4_api.bat - Starts the MT4 API mock server
echo 2. start_webhook_api.bat - Starts a simple webhook receiver
echo 3. start_all_services.bat - Starts all services
echo 4. send_test_signal.bat - Sends a test trading signal
echo.
echo Next steps:
echo 1. Run start_all_services.bat to start all services
echo 2. Run send_test_signal.bat to test the system
echo.
echo For MT4 Terminal integration:
echo - Install MT4 Terminal using CloudTrader.4.terminal.setup.exe
echo - Log in with:
echo   Server: demo.metaquotes.com
echo   Login: 80001413
echo   Password: 9K63%%M?d?cTP
echo.
pause
exit /b 0

:ERROR
echo.
echo Setup encountered an error. Please fix the issues and try again.
echo.
pause
exit /b 1