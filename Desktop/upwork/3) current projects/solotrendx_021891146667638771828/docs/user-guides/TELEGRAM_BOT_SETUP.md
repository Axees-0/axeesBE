# Telegram Bot Setup Guide

This guide explains the essential steps and code needed to set up a Telegram bot like the one used in SoloTrend X.

## 1. Create a Telegram Bot with BotFather

First, you need to create a bot and get a token:

1. Open Telegram and search for "BotFather" (@BotFather)
2. Send the command `/newbot`
3. Follow the instructions to choose a name and username
4. BotFather will provide a token like: `7890390388:AAHAeOn_tzn1rihuEfpCCNZLzXReIF3fBD4`

## 2. Set Up Environment Variables

Create a `.env` file with your configuration:

```
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=7890390388:AAHAeOn_tzn1rihuEfpCCNZLzXReIF3fBD4
TELEGRAM_CHAT_ID=6737051045
TELEGRAM_BOT_URL=https://t.me/solotrendx_pocketoption_bot

# API Configuration
MT4_API_URL=http://localhost:5002/api
FLASK_PORT=5001

# System Configuration
MOCK_MODE=True
ADMIN_USER_IDS=123456789
ALLOWED_USER_IDS=123456789,234567890
```

## 3. Install Required Packages

The Telegram bot requires specific packages to be installed in your Python environment:

```bash
pip install python-telegram-bot==20.0a6 python-dotenv flask requests
```

## 4. Understanding the Component Structure

The Telegram Connector component consists of several files:

- **app.py**: Creates and configures the Flask application
- **bot.py**: Handles Telegram bot setup and command processing
- **routes.py**: Defines API endpoints for the Flask app
- **signal_handler.py**: Processes trading signals from webhook
- **mt4_connector.py**: Communicates with the MT4 API
- **run.py**: Entry point to launch the service

## 5. Component Integration

The Telegram Connector serves as a bridge between:

1. **Webhook API**: Receives signals from TradingView/MT4 and forwards them to Telegram
2. **MT4 REST API**: Executes trades based on user decisions
3. **Telegram Bot API**: Sends notifications and receives user commands

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│  Webhook API   │───→│    Telegram    │←───→│  Telegram API  │
│   (Flask)      │    │   Connector    │    │   (External)   │
└────────────────┘    └────────────────┘    └────────────────┘
                           │      ↑
                           ↓      │
                      ┌────────────────┐
                      │  MT4 REST API  │
                      │     (Flask)    │
                      └────────────────┘
```

## 6. Starting the Telegram Connector

The connector can be started using the following commands:

```bash
# Set environment variables first
export PYTHONPATH=/path/to/project_root
export FLASK_PORT=5001
export MT4_API_URL=http://localhost:5002/api
export TELEGRAM_BOT_TOKEN=your_bot_token
export ADMIN_USER_IDS=123456789
export ALLOWED_USER_IDS=123456789

# Start the service
python src/backend/telegram_connector/run.py
```

On Windows, use the batch file:

```batch
start_all_services.bat
```

## 7. Testing the Telegram Bot

1. **Health Check**:
   ```
   curl http://localhost:5001/health
   ```

2. **Webhook Test**:
   ```
   curl -X POST http://localhost:5001/webhook \
        -H "Content-Type: application/json" \
        -d '{"symbol":"EURUSD","side":"BUY","price":1.1234,"sl":1.1200,"tp":1.1300}'
   ```

3. **Using the Test Script**:
   ```
   test_signal.bat
   ```

## 8. SoloTrend X Bot Commands

The bot supports the following commands:

- `/start` - Start the bot and receive a welcome message
- `/help` - Display available commands and usage
- `/status` - Check system status and connection
- `/settings` - Configure trading preferences
- `/orders` - View and manage current open orders
- `/cancel` - Cancel the current operation

## 9. Troubleshooting

- **Bot not responding**: Check logs at `data/logs/telegram_bot_debug.log`
- **Connection errors**: Verify MT4 REST API is running and accessible
- **Token issues**: Ensure your token follows the format `NUMBER:STRING`
- **Missing notifications**: Check ALLOWED_USER_IDS includes your Telegram user ID

## 10. Production Deployment

For production deployment:

1. **Use secure HTTPS**: Deploy behind Nginx/Apache with SSL certificates
2. **Persistent services**: Use systemd or supervisor to ensure services stay running
3. **Secure tokens**: Use environment variables rather than storing in files
4. **Monitoring**: Implement health check monitoring and alerts
5. **Logging**: Configure centralized logging for troubleshooting
6. **Backup bot token**: Store your Telegram bot token securely with backups

## Tips for Windows Deployment

When running on Windows (including Azure):

1. Always use absolute paths with `%PROJECT_ROOT%` variable
2. Ensure proper environment activation in batch files
3. Use health checks to verify services are running
4. Check log files for errors regularly
5. Keep token information secure