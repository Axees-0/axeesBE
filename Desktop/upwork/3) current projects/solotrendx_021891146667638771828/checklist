# MT4 Terminal Integration Checklist

## 📋 Step 1: Install MT4 Terminal on Windows
- [ ] Ensure access to a Windows machine (dedicated, VM, or Parallels Desktop)
- [ ] Copy and install `src/backend/CloudTrader.4.terminal.setup.exe`
- [ ] Enter credentials during installation:
  - Server: CLOUD TRADER MT
  - Login: 80000300
  - Password: D7m!NMg&tteB
- [ ] Verify successful login to MT4 terminal
- [ ] Ensure terminal remains running at all times

## 📋 Step 2: Prepare MT4 Manager API Files
- [ ] Locate `mtmanapi.dll` and `mtmanapi64.dll` in MT4 installation directory
- [ ] Copy both files to `src/backend/MT4RestfulAPIWrapper/`
- [ ] Verify the files have proper permissions (read/execute)

## 📋 Step 3: Configure Environment Variables
- [ ] Create/edit `.env` file in project root with the following:
```
# MT4 API Configuration
MT4_SERVER=localhost
MT4_PORT=443
MT4_LOGIN=80000300
MT4_PASSWORD=D7m!NMg&tteB
USE_MOCK_MODE=false
PORT=5002

# Webhook API Configuration
WEBHOOK_API_PORT=5003

# Telegram connector configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_BOT_LINK=https://t.me/your_bot_username
TELEGRAM_CHAT_ID=your_chat_id
ADMIN_USER_IDS=your_admin_user_id
ALLOWED_USER_IDS=your_user_id
FLASK_PORT=5005
```
- [ ] Replace Telegram configuration with actual values
- [ ] Verify the .env file is saved in the correct location

## 📋 Step 4: Modify start_all_services.bat Script
- [ ] Edit `tests/start_all_services.bat` to use real MT4 API:
  - [ ] Set `USE_MOCK_MODE=false`
  - [ ] Add MT4 credentials (server, port, login, password)
  - [ ] Update Telegram configuration values
- [ ] Save the modified script

## 📋 Step 5: Verify MT4 Terminal Status
- [ ] Confirm MT4 terminal is running on Windows
- [ ] Verify active login to the broker account
- [ ] Check terminal connection status (green connection indicator)
- [ ] Ensure Expert Advisors are enabled (smiling face icon)

## 📋 Step 6: Start Services
- [ ] Run the modified start_all_services.bat script
- [ ] Monitor console output for errors
- [ ] Check each component starts successfully:
  - [ ] MT4 REST API
  - [ ] Webhook API
  - [ ] Telegram Bot

## 📋 Step 7: Verify Connections
- [ ] Run check_services.bat to verify all components
- [ ] Review logs for errors:
  - [ ] data\logs\mt4_rest_api.log
  - [ ] data\logs\webhook_api.log
  - [ ] data\logs\telegram_connector.log
- [ ] Test API endpoints manually:
  - [ ] MT4 API health: http://localhost:5002/api/health
  - [ ] Webhook API: http://localhost:5003/health
  - [ ] Telegram connector: http://localhost:5005/health

## 📋 Step 8: Test with Sample Signal
- [ ] Generate test trade signal:
  ```
  python scripts\generate_test_signal.py --url http://localhost:5003/webhook --direct
  ```
- [ ] Check Telegram bot for notification
- [ ] Try executing the trade via Telegram button
- [ ] Verify the order appears in MT4 terminal

## ⚠️ Troubleshooting
- MT4 Connection Issues:
  - [ ] Verify MT4 is running and logged in
  - [ ] Check login credentials in .env file
  - [ ] Confirm MT4 server allows API connections
  - [ ] Restart MT4 terminal if necessary

- DLL Loading Issues:
  - [ ] Verify DLL files are in correct location
  - [ ] Run command prompt as Administrator
  - [ ] Check Windows Event Viewer for errors

- Telegram Bot Issues:
  - [ ] Verify bot token is correct
  - [ ] Ensure conversation with bot is started
  - [ ] Check chat ID configuration

- Path Issues:
  - [ ] Check for spaces or special characters in paths
  - [ ] Verify all paths are correct for Windows environment

IMPORTANT: This checklist must be followed step by step, checking off each item before proceeding to the next. Claude should reference this checklist for every MT4 terminal integration task.