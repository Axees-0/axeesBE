#!/bin/bash
# Setup script for configuring Parallels Desktop Windows VM for SoloTrend X with real MT4

# Create logs directory
mkdir -p data/logs

# Set MT4 credentials
MT4_LOGIN="80001413"
MT4_PASSWORD="9K63%M?d?cTP"
MT4_SERVER="demo.metaquotes.com"

echo "Setting up SoloTrend X on Parallels Windows VM"
echo "MT4 Login: $MT4_LOGIN"
echo "MT4 Server: $MT4_SERVER"

# 1. Check if MT4 terminal installer exists
MT4_INSTALLER="src/backend/CloudTrader.4.terminal.setup.exe"
if [ ! -f "$MT4_INSTALLER" ]; then
  echo "ERROR: MT4 installer not found at $MT4_INSTALLER"
  exit 1
fi

# 2. Create .env file with credentials
cat > .env << EOL
# SoloTrend X Environment Variables
MT4_API_URL=http://localhost:5003/api
WEBHOOK_API_URL=http://localhost:5000
TELEGRAM_CONNECTOR_URL=http://localhost:5001
MT4_SERVER=$MT4_SERVER
MT4_LOGIN=$MT4_LOGIN
MT4_PASSWORD=$MT4_PASSWORD
USE_REAL_MT4=true
EOL

echo "Created .env file with MT4 credentials"

# 3. Create Windows PowerShell setup script with detailed instructions
cat > scripts/windows_setup_instructions.ps1 << 'EOL'
# SoloTrend X Windows Setup Instructions

Write-Host "SoloTrend X Windows Setup Instructions" -ForegroundColor Green
Write-Host "------------------------------------" -ForegroundColor Green
Write-Host ""

# Find the MT4 installer path
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$mt4Installer = Join-Path $projectRoot "src\backend\CloudTrader.4.terminal.setup.exe"

Write-Host "Step 1: Install MT4 Terminal" -ForegroundColor Yellow
Write-Host "- Run the MT4 installer: $mt4Installer"
Write-Host "- Follow the installation wizard"
Write-Host "- When prompted, enter the login credentials from the .env file"
Write-Host "- Complete the installation and launch MT4"
Write-Host ""

Write-Host "Step 2: Run the Windows environment setup script" -ForegroundColor Yellow
Write-Host "- Open PowerShell as Administrator"
Write-Host "- Navigate to the project directory"
Write-Host "- Run: .\scripts\setup_windows_environment.ps1"
Write-Host ""

Write-Host "Step 3: Configure Environment" -ForegroundColor Yellow
Write-Host "- Check that .env file exists with proper credentials"
Write-Host "- Verify that MT4 Manager API files are correctly installed"
Write-Host ""

Write-Host "Step 4: Start Services" -ForegroundColor Yellow
Write-Host "- Run: .\start_all_services.bat"
Write-Host "- This will start the MT4 API, Webhook API, and Telegram connector"
Write-Host ""

Write-Host "Step 5: Test End-to-End" -ForegroundColor Yellow
Write-Host "- Run: .\run_e2e_tests.bat"
Write-Host "- This will execute the end-to-end tests against the real MT4 environment"
Write-Host ""

Write-Host "For detailed instructions, refer to the documentation in the docs directory." -ForegroundColor Cyan
EOL

echo "Created Windows setup instructions"

# 4. Make sure all scripts are executable
chmod +x scripts/*.sh
chmod +x scripts/*.py

echo "Setup script completed. Please follow these steps:"
echo "1. Start your Parallels Windows VM"
echo "2. Copy the project files to the Windows VM"
echo "3. Install MT4 terminal using $MT4_INSTALLER"
echo "4. Run setup_windows_environment.ps1 in PowerShell as Administrator"
echo "5. Start the services using start_all_services.bat"
echo "6. Run the end-to-end tests using run_e2e_tests.bat"
echo ""
echo "For detailed instructions, see scripts/windows_setup_instructions.ps1"