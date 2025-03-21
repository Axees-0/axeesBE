# Windows MT4 Integration Guide

This guide explains how to properly set up the SoloTrend X system to work with a real MT4 terminal on Windows.

## Prerequisites

1. **MT4 Terminal**
   - MT4 terminal installed and running
   - Logged in with account credentials:
     - Server: CLOUD TRADER MT
     - Login: 80000300
     - Password: D7m!NMg&tteB

2. **Python Environment**
   - Python 3.8+ installed
   - Virtual environment set up using `setup_venv.bat`

## Step-by-Step Integration

### 1. Troubleshoot Path Issues (If Needed)

If you're experiencing path-related problems, run the diagnostic script:

```
tests\diagnose_paths.bat
```

This will check for all required directories and files, and generate a detailed report in the `tests` directory.

### 2. Start All Services

Run the main service startup script:

```
tests\start_all_services.bat
```

This script will:
- Detect your Python virtual environment
- Locate all necessary components
- Start the MT4 REST API with real MT4 connection
- Start the Webhook API
- Start the Telegram connector
- Create detailed logs for each service

### 3. Verify Services Are Running

After starting the services, you can check if everything is running properly:

```
tests\check_services.bat
```

This will:
- Test the connection to each service
- Check for errors in the logs
- Test interactions between components
- Generate a detailed health check report

### 4. Test the System

You can send a test signal to verify the complete workflow:

```
python scripts\generate_test_signal.py --url http://localhost:5003/webhook --direct
```

## Troubleshooting

### Common Issues

1. **"The system cannot find the path specified"**
   - Check the diagnostic report for missing files or directories
   - Make sure you're running the scripts from the Windows command prompt
   - Make sure the repository structure is intact

2. **"MT4 REST API is not running"**
   - Check if the MT4 terminal is actually running
   - Verify the MT4 credentials in the `.env` file
   - Look at the log files in `data/logs/mt4_start.log`

3. **"Virtual environment not found"**
   - Run `setup_venv.bat` to create the environment
   - Make sure Python is installed correctly

4. **"Telegram Chat not found"**
   - Make sure you've started a conversation with the Telegram bot
   - Check the `TELEGRAM_CHAT_ID` in the `.env` file
   - Look at the log files in `data/logs/telegram_start.log`

## Log Files

All logs are stored in the `data/logs` directory:

- `startup_DATE_TIME.log` - Main startup log
- `mt4_start.log` - MT4 API startup log
- `webhook_start.log` - Webhook API startup log
- `telegram_start.log` - Telegram connector startup log
- `service_check_DATE_TIME.log` - Service health check logs

## Integration Checklist

For a complete step-by-step guide to integrating with the real MT4 terminal, refer to:

```
tests\MT4_INTEGRATION_CHECKLIST.md
```