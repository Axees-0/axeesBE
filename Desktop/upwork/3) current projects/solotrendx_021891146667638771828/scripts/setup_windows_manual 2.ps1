# SoloTrend X Windows Manual Setup Script
# This script fixes issues with the automated setup

# Stop on first error
$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$VenvName = "venv"

# Function to log messages
function Log-Message($message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $message"
    Write-Host $logMessage
}

Log-Message "Starting SoloTrend X Windows Manual Setup"
Log-Message "Project Root: $ProjectRoot"

# Recreate virtual environment
Log-Message "Recreating virtual environment..."
if (Test-Path "$ProjectRoot\$VenvName") {
    Log-Message "Removing existing virtual environment..."
    Remove-Item -Recurse -Force "$ProjectRoot\$VenvName"
}

# Create virtual environment
Log-Message "Creating new virtual environment with Python's built-in venv..."
python -m venv "$ProjectRoot\$VenvName"

# Verify virtual environment was created
if (Test-Path "$ProjectRoot\$VenvName\Scripts\activate.bat") {
    Log-Message "Virtual environment created successfully"
} else {
    Log-Message "ERROR: Failed to create virtual environment" -ForegroundColor Red
    exit 1
}

# Activate virtual environment and install dependencies
Log-Message "Activating virtual environment using batch file..."
cmd /c "$ProjectRoot\$VenvName\Scripts\activate.bat && pip install -r $ProjectRoot\requirements.txt"

# Create logs directory
if (-not (Test-Path "$ProjectRoot\data\logs")) {
    New-Item -ItemType Directory -Path "$ProjectRoot\data\logs" -Force | Out-Null
    Log-Message "Created logs directory"
}

# Check for MT4 installation
$MT4InstallPath = "$env:USERPROFILE\AppData\Roaming\MetaQuotes\Terminal"
if (-not (Test-Path $MT4InstallPath)) {
    Log-Message "MetaTrader 4 not found in $MT4InstallPath"
    Log-Message "Please install MT4 Terminal manually using the CloudTrader.4.terminal.setup.exe installer"
} else {
    Log-Message "MetaTrader 4 found in $MT4InstallPath"
}

# Set up environment variables for services
Log-Message "Setting up environment variables..."

# Create a .env file for the services
$envFile = "$ProjectRoot\.env"
@"
# SoloTrend X Environment Variables
MT4_API_URL=http://localhost:5003/api
WEBHOOK_API_URL=http://localhost:5000
TELEGRAM_CONNECTOR_URL=http://localhost:5001
MT4_SERVER=demo.metaquotes.com
MT4_LOGIN=80001413
MT4_PASSWORD=9K63%M?d?cTP
USE_REAL_MT4=true
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
"@ | Out-File -FilePath $envFile -Encoding utf8

Log-Message "Environment variables file created at $envFile"
Log-Message "Please edit the .env file to add your Telegram credentials if needed"

# Create batch files for starting services
Log-Message "Creating batch files for starting services..."

# MT4 API service
@"
@echo off
echo Starting MT4 API service...
call "$ProjectRoot\$VenvName\Scripts\activate.bat"
python "$ProjectRoot\scripts\start_mt4_api.py" --server %MT4_SERVER% --login %MT4_LOGIN% --password %MT4_PASSWORD% --port 5003
"@ | Out-File -FilePath "$ProjectRoot\start_mt4_api.bat" -Encoding ascii

# Add simple Python script for MT4 API startup
@"
import os
import sys
import subprocess
import argparse

def main():
    parser = argparse.ArgumentParser(description='Start MT4 API')
    parser.add_argument('--server', default='demo.metaquotes.com', help='MT4 server address')
    parser.add_argument('--login', default='80001413', help='MT4 login ID')
    parser.add_argument('--password', default='', help='MT4 password')
    parser.add_argument('--port', type=int, default=5003, help='Port to run the API on')
    parser.add_argument('--mode', default='live', choices=['live', 'mock'], help='API mode')
    
    args = parser.parse_args()
    
    # Set environment variables
    os.environ['MT4_SERVER'] = args.server
    os.environ['MT4_LOGIN'] = args.login
    os.environ['MT4_PASSWORD'] = args.password
    os.environ['PORT'] = str(args.port)
    os.environ['USE_MOCK_MODE'] = 'true' if args.mode == 'mock' else 'false'
    
    print(f"Starting MT4 API in {args.mode} mode...")
    print(f"Server: {args.server}")
    print(f"Login: {args.login}")
    print(f"Port: {args.port}")
    
    # Run the MT4 API implementation
    if args.mode == 'mock':
        module_path = 'src.backend.mt4_mock_api.run_server'
    else:
        module_path = 'src.backend.MT4RestfulAPIWrapper.mt4_rest_api_implementation'
    
    cmd = [sys.executable, '-m', module_path]
    subprocess.run(cmd)

if __name__ == '__main__':
    main()
"@ | Out-File -FilePath "$ProjectRoot\scripts\start_mt4_api.py" -Encoding utf8

# Webhook API service
@"
@echo off
echo Starting Webhook API service...
call "$ProjectRoot\$VenvName\Scripts\activate.bat"
set FLASK_APP=src.backend.webhook_api.app
set FLASK_DEBUG=True
set FLASK_PORT=5000
set TELEGRAM_WEBHOOK_URL=http://localhost:5001/webhook
python -m flask run --host=0.0.0.0 --port=5000
"@ | Out-File -FilePath "$ProjectRoot\start_webhook_api.bat" -Encoding ascii

# Telegram Connector service
@"
@echo off
echo Starting Telegram Connector service...
call "$ProjectRoot\$VenvName\Scripts\activate.bat"
set FLASK_APP=src.backend.telegram_connector.app
set FLASK_PORT=5001
set TELEGRAM_BOT_TOKEN=%TELEGRAM_BOT_TOKEN%
set TELEGRAM_CHAT_ID=%TELEGRAM_CHAT_ID%
set MT4_API_URL=http://localhost:5003/api
python -m flask run --host=0.0.0.0 --port=5001
"@ | Out-File -FilePath "$ProjectRoot\start_telegram_connector.bat" -Encoding ascii

# Create a single batch file to start all services
@"
@echo off
echo Starting SoloTrend X services...

rem Load environment variables
if exist "$ProjectRoot\.env" (
    for /F "tokens=*" %%A in ('type "$ProjectRoot\.env" ^| findstr /V "^#" ^| findstr /V "^$"') do set %%A
)

rem Start MT4 API service
start "MT4 API" cmd /c "$ProjectRoot\start_mt4_api.bat"

rem Wait for MT4 API to start
echo Waiting for MT4 API to start...
timeout /t 5

rem Start Webhook API service
start "Webhook API" cmd /c "$ProjectRoot\start_webhook_api.bat"

rem Wait for Webhook API to start
echo Waiting for Webhook API to start...
timeout /t 5

rem Start Telegram Connector service
start "Telegram Connector" cmd /c "$ProjectRoot\start_telegram_connector.bat"

echo All services started!
echo MT4 API: http://localhost:5003/api
echo Webhook API: http://localhost:5000
echo Telegram Connector: http://localhost:5001
"@ | Out-File -FilePath "$ProjectRoot\start_all_services.bat" -Encoding ascii

Log-Message "Batch files created in $ProjectRoot"

# Create requirements.txt if it doesn't exist
if (-not (Test-Path "$ProjectRoot\requirements.txt")) {
    @"
flask==2.2.3
python-telegram-bot==13.7
python-dotenv==0.19.2
requests==2.28.2
pytest==7.2.1
pyjwt==2.6.0
flask-cors==3.0.10
"@ | Out-File -FilePath "$ProjectRoot\requirements.txt" -Encoding utf8
    Log-Message "Created requirements.txt with essential dependencies"
}

# Final instructions
Log-Message "SoloTrend X Windows Manual Setup completed!"
Log-Message "-----------------------------------------------------"
Log-Message "Next Steps:"
Log-Message "1. Install the MT4 terminal using CloudTrader.4.terminal.setup.exe"
Log-Message "2. Run start_all_services.bat to start all services"
Log-Message "3. Check if services are running properly at their respective URLs"
Log-Message "-----------------------------------------------------"
Log-Message "For more information, see the PRODUCTION_SETUP.md file"