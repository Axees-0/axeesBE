# SoloTrend X Windows Environment Setup Script
# This script sets up the SoloTrend X trading system on a Windows server with MT4

# Stop on first error
$ErrorActionPreference = "Stop"

# Configuration
$MT4InstallPath = "$env:USERPROFILE\AppData\Roaming\MetaQuotes\Terminal"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$PythonVersion = "3.10.12"
$VenvName = "venv"

# Function to check if a command exists
function Test-Command($command) {
    return (Get-Command $command -ErrorAction SilentlyContinue)
}

# Create log directory
if (-not (Test-Path "$ProjectRoot\data\logs")) {
    New-Item -ItemType Directory -Path "$ProjectRoot\data\logs" -Force | Out-Null
}

# Log file
$LogFile = "$ProjectRoot\data\logs\windows_setup.log"

# Function to log messages
function Log-Message($message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage
}

Log-Message "Starting SoloTrend X Windows Environment Setup"
Log-Message "Project Root: $ProjectRoot"

# Check for Python
if (-not (Test-Command "python")) {
    Log-Message "Python not found. Installing Python $PythonVersion..."
    
    # Download Python installer
    $pythonInstallerUrl = "https://www.python.org/ftp/python/$PythonVersion/python-$PythonVersion-amd64.exe"
    $pythonInstaller = "$env:TEMP\python-$PythonVersion-amd64.exe"
    
    Log-Message "Downloading Python installer from $pythonInstallerUrl..."
    Invoke-WebRequest -Uri $pythonInstallerUrl -OutFile $pythonInstaller
    
    # Install Python
    Log-Message "Installing Python..."
    Start-Process -FilePath $pythonInstaller -ArgumentList "/quiet", "InstallAllUsers=1", "PrependPath=1" -Wait
    
    # Refresh PATH environment variable
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    Log-Message "Python installation completed"
} else {
    $pythonVersion = python --version
    Log-Message "Python already installed: $pythonVersion"
}

# Ensure pip is installed
if (-not (Test-Command "pip")) {
    Log-Message "pip not found. Installing pip..."
    
    # Download get-pip.py
    $getPipUrl = "https://bootstrap.pypa.io/get-pip.py"
    $getPipScript = "$env:TEMP\get-pip.py"
    
    Log-Message "Downloading get-pip.py from $getPipUrl..."
    Invoke-WebRequest -Uri $getPipUrl -OutFile $getPipScript
    
    # Install pip
    Log-Message "Installing pip..."
    python $getPipScript
    
    Log-Message "pip installation completed"
} else {
    $pipVersion = pip --version
    Log-Message "pip already installed: $pipVersion"
}

# Create virtual environment
if (-not (Test-Path "$ProjectRoot\$VenvName")) {
    Log-Message "Creating virtual environment..."
    
    # Install virtualenv if not already installed
    if (-not (Test-Command "virtualenv")) {
        Log-Message "Installing virtualenv..."
        pip install virtualenv
    }
    
    # Create virtual environment
    Log-Message "Creating virtual environment at $ProjectRoot\$VenvName..."
    python -m virtualenv "$ProjectRoot\$VenvName"
    
    Log-Message "Virtual environment created"
} else {
    Log-Message "Virtual environment already exists at $ProjectRoot\$VenvName"
}

# Activate virtual environment and install dependencies
Log-Message "Activating virtual environment and installing dependencies..."
& "$ProjectRoot\$VenvName\Scripts\Activate.ps1"

# Install project dependencies
Log-Message "Installing project dependencies..."
pip install -r "$ProjectRoot\requirements.txt"

# Check for MT4 installation
if (-not (Test-Path $MT4InstallPath)) {
    Log-Message "MetaTrader 4 not found in $MT4InstallPath"
    Log-Message "Please install MetaTrader 4 manually and ensure it's properly configured with a demo or live account"
} else {
    Log-Message "MetaTrader 4 found in $MT4InstallPath"
    
    # Find the MT4 terminal folder (there might be multiple)
    $mt4Folders = Get-ChildItem -Path $MT4InstallPath -Directory
    if ($mt4Folders.Count -eq 0) {
        Log-Message "No MT4 terminal folders found in $MT4InstallPath"
        Log-Message "Please launch MetaTrader 4 at least once to create a terminal folder"
    } else {
        $mt4Folder = $mt4Folders[0].FullName
        Log-Message "Using MT4 terminal folder: $mt4Folder"
        
        # Create a symbolic link to the MT4 Manager API DLL
        $mtManagerApiDll = "$mt4Folder\mtmanapi.dll"
        if (Test-Path $mtManagerApiDll) {
            Log-Message "Found MT4 Manager API DLL: $mtManagerApiDll"
            
            # Copy the MT4 Manager API files to the project directory
            $mt4ApiDir = "$ProjectRoot\src\backend\MT4RestfulAPIWrapper"
            if (-not (Test-Path "$mt4ApiDir\mtmanapi.dll")) {
                Log-Message "Copying MT4 Manager API files to $mt4ApiDir..."
                Copy-Item -Path $mtManagerApiDll -Destination "$mt4ApiDir\mtmanapi.dll"
                Log-Message "MT4 Manager API files copied"
            } else {
                Log-Message "MT4 Manager API files already exist in $mt4ApiDir"
            }
        } else {
            Log-Message "MT4 Manager API DLL not found in $mt4Folder"
            Log-Message "Please install the MT4 Manager API files manually"
        }
    }
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
MT4_LOGIN=0
MT4_PASSWORD=password
USE_REAL_MT4=true
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
"@ | Out-File -FilePath $envFile -Encoding utf8

Log-Message "Environment variables file created at $envFile"
Log-Message "Please edit the .env file to add your MT4 and Telegram credentials"

# Create batch files for starting services
Log-Message "Creating batch files for starting services..."

# MT4 API service
@"
@echo off
echo Starting MT4 API service...
call "$ProjectRoot\$VenvName\Scripts\activate.bat"
python "$ProjectRoot\scripts\start_mt4_api.sh" --server %MT4_SERVER% --login %MT4_LOGIN% --password %MT4_PASSWORD% --port 5003
"@ | Out-File -FilePath "$ProjectRoot\start_mt4_api.bat" -Encoding ascii

# Webhook API service
@"
@echo off
echo Starting Webhook API service...
call "$ProjectRoot\$VenvName\Scripts\activate.bat"
set FLASK_APP=src.backend.webhook_api.app
set FLASK_DEBUG=False
set FLASK_PORT=5000
set TELEGRAM_WEBHOOK_URL=http://localhost:5001/webhook
python -m src.backend.webhook_api.run_server
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
python -m src.backend.telegram_connector.app
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

# Create a batch file for running tests
@"
@echo off
echo Running E2E tests...
call "$ProjectRoot\$VenvName\Scripts\activate.bat"
python -m pytest -m e2e tests/e2e -v --html=tests/e2e_report.html
"@ | Out-File -FilePath "$ProjectRoot\run_e2e_tests.bat" -Encoding ascii

Log-Message "Test batch file created in $ProjectRoot\run_e2e_tests.bat"

# Final instructions
Log-Message "SoloTrend X Windows Environment Setup completed!"
Log-Message "-----------------------------------------------------"
Log-Message "Next Steps:"
Log-Message "1. Edit the .env file to add your MT4 and Telegram credentials"
Log-Message "2. Run start_all_services.bat to start all services"
Log-Message "3. Run run_e2e_tests.bat to run the E2E tests against the real MT4 environment"
Log-Message "-----------------------------------------------------"
Log-Message "For more information, see the documentation in the docs directory"