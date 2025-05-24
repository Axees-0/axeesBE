# SoloTrend X Production Setup Guide

This guide provides detailed instructions for setting up SoloTrend X in a production environment with a real MT4 terminal.

## Prerequisites

- Windows machine (local or VM) with:
  - Windows 10/11 or Windows Server 2019+
  - At least 4GB RAM, 2 CPU cores
  - At least 50GB free disk space
- MetaTrader 4 Terminal with:
  - Valid login credentials
  - MT4 Manager API enabled
- Network connectivity:
  - Stable internet connection
  - Firewall rules allowing MT4 and HTTP traffic
- Telegram Bot:
  - Bot API token (from @BotFather)
  - Chat ID

## Setup Options

You have two options for running SoloTrend X in production:

1. **Option 1: Parallel Desktop Windows VM**
   - Run Windows in Parallels Desktop on your Mac
   - Install MT4 Terminal on the Windows VM
   - Run the MT4 API service on Windows
   - Run Webhook API and Telegram connector on macOS

2. **Option 2: Dedicated Windows Server**
   - Deploy a Windows Server (local or in Azure)
   - Install all components on the Windows Server
   - Configure for 24/7 operation

## Option 1: Setup with Parallels Desktop

### Step 1: Install MT4 Terminal on Windows VM

1. Start your Parallels Desktop Windows VM
2. Copy the MT4 installer to the Windows VM:
   ```
   src/backend/CloudTrader.4.terminal.setup.exe
   ```
3. Run the installer and follow the wizard
4. Enter the provided login credentials when prompted:
   - Server: demo.metaquotes.com
   - Login: 80001413
   - Password: 9K63%M?d?cTP
5. Complete the MT4 installation and verify you can log in

### Step 2: Prepare MT4 Manager API

1. Copy the MT4Manager API files from your MT4 installation to the project:
   - Look for `mtmanapi.dll` and `mtmanapi64.dll` in the MT4 installation folder
   - Copy them to the Windows VM project folder at:
     ```
     src/backend/MT4RestfulAPIWrapper/
     ```

### Step 3: Set Up the Windows Environment

1. Run the setup_parallels_windows.sh script on your Mac:
   ```bash
   chmod +x scripts/setup_parallels_windows.sh
   ./scripts/setup_parallels_windows.sh
   ```

2. This script will:
   - Create the .env file with the necessary credentials
   - Prepare Windows setup instructions
   - Generate all the necessary scripts

3. In your Windows VM, run the prepared PowerShell script:
   ```powershell
   cd C:\path\to\your\project
   powershell -ExecutionPolicy Bypass -File .\scripts\setup_windows_environment.ps1
   ```

### Step 4: Start the Services

#### Option A: Hybrid Mode (MT4 API on Windows, other services on Mac)

1. Start the MT4 API service on the Windows VM:
   ```
   .\start_mt4_api.bat
   ```

2. Start the Webhook API and Telegram connector on your Mac:
   ```bash
   ./scripts/start_webhook_api.sh
   ./scripts/start_telegram_connector.sh
   ```

#### Option B: All Services on Windows

1. Start all services on the Windows VM:
   ```
   .\start_all_services.bat
   ```

### Step 5: Run the Tests

1. Run the end-to-end tests to verify everything is working:
   ```
   .\run_e2e_tests.bat
   ```

## Option 2: Setup on a Dedicated Windows Server

### Step 1: Prepare the Windows Server

1. Provision a Windows Server (Azure VM recommended)
   - Windows Server 2019 or newer
   - At least 4GB RAM, 2 CPU cores
   - Standard D2s v3 or better for Azure

2. Install MT4 Terminal:
   - Download and install MetaTrader 4
   - Log in with your credentials
   - Ensure MT4 Manager API is enabled

### Step 2: Deploy SoloTrend X

1. Clone or copy the project to the Windows Server
2. Run the Windows environment setup script:
   ```powershell
   cd C:\path\to\your\project
   powershell -ExecutionPolicy Bypass -File .\scripts\setup_windows_environment.ps1
   ```

3. Edit the .env file to add your MT4 and Telegram credentials

### Step 3: Configure Services

1. Start all services manually first to verify they work:
   ```
   .\start_all_services.bat
   ```

2. Set up Windows Services for automatic startup:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\install_windows_services.ps1
   ```

3. Configure Windows Firewall:
   - Open ports 5000, 5001, and 5003 for incoming connections
   - Allow Python.exe through the firewall

### Step 4: Verify Production Setup

1. Run the end-to-end tests:
   ```
   .\run_e2e_tests.bat
   ```

2. Send a test signal:
   ```
   python scripts\generate_test_signal.py --url http://localhost:5001/webhook --direct
   ```

3. Check the Telegram bot for notifications

## Monitoring and Maintenance

### Health Check Endpoints

Monitor the health of all services using these endpoints:

- MT4 API: http://localhost:5003/api/health
- Webhook API: http://localhost:5000/health
- Telegram Connector: http://localhost:5001/health

### Log Files

All logs are stored in the `data/logs` directory:

- MT4 API logs: `data/logs/mt4_api.log`
- Webhook API logs: `data/logs/webhook_api.log`
- Telegram Connector logs: `data/logs/telegram_connector.log`

### Backup and Recovery

1. Regularly back up:
   - The entire project directory
   - MT4 terminal configuration
   - Telegram bot settings

2. For recovery:
   - Restore from backup
   - Run the setup script again
   - Verify all services are working

## Troubleshooting

### MT4 API Connection Issues

- Verify MT4 Terminal is running and logged in
- Check that mtmanapi.dll exists and can be accessed
- Try restarting MT4 Terminal
- Check firewall settings

### Telegram Bot Issues

- Verify the bot token is correct
- Make sure you've started a conversation with the bot
- Check that your chat ID is correct

### Service Startup Issues

- Check the log files for error messages
- Verify port availability (no conflicts)
- Ensure Python and dependencies are installed correctly
- Look for Windows permissions issues

## Next Steps

After your production environment is set up:

1. Configure real trading accounts for live trading
2. Set up secure HTTPS for webhook endpoints
3. Implement a monitoring dashboard
4. Set up email/SMS alerts for critical issues
5. Create backup and recovery procedures