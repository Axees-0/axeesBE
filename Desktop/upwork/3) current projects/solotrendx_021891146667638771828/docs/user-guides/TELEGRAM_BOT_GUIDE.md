# SoloTrend X Telegram Bot Guide

## Architecture Overview

The Telegram Bot serves as the user interface for the SoloTrend X trading system, connecting the trading signal sources to human decision-making.

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Webhook API    │─────▶│  Telegram Bot   │◀────▶│  Telegram API   │
│  (Flask)        │      │  (Python)       │      │  (External)     │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        ▲                        │
        │                        │
        │                        ▼
┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │
│  Trading Signal │      │  User Interface │
│  Source         │      │  Commands &     │
│  (External)     │      │  Callbacks      │
│                 │      │                 │
└─────────────────┘      └─────────────────┘
```

## Key Components

1. **Telegram Bot** - Core component that handles:
   - User commands and interactions
   - Sending notifications
   - Processing callbacks from buttons
   - Handling trading signals

2. **Webhook API** - Flask server that:
   - Receives external trading signals
   - Forwards formatted signals to the Telegram bot
   - Provides administrative endpoints

3. **MT4 Connector** - Service that:
   - Communicates with MT4 API
   - Executes trades based on user decisions
   - Retrieves order status and account information

4. **Environment Variables** - Configuration for the bot:
   - `TELEGRAM_BOT_TOKEN` - Authentication for the Telegram API
   - `TELEGRAM_CHAT_ID` - Default chat to send messages
   - `ADMIN_USER_IDS` - User IDs with admin privileges
   - `ALLOWED_USER_IDS` - User IDs allowed to use the bot

## Signal Flow Process

### 1. Signal Reception & Notification Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  External       │────▶│  Flask Webhook  │────▶│  Format Signal  │
│  Signal Source  │     │  Endpoint       │     │  Message        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Send to User   │
                                               │  via Telegram   │
                                               └─────────────────┘
```

1. External system (TradingView or MT4 EA) sends signal to webhook endpoint
2. Signal is validated and processed by webhook API
3. Signal is forwarded to Telegram Connector
4. Telegram bot formats message with signal details
5. Message is sent to allowed users with action buttons

### 2. User Decision & Trade Execution Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Views     │────▶│  User Presses   │────▶│  Button         │
│  Signal Message │     │  Action Button  │     │  Callback       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  MT4 API Sends  │◀────│  MT4 Connector  │◀────│  User Settings  │
│  Order to Broker│     │  Executes Trade │     │  Applied        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. User receives signal notification in Telegram
2. User reviews signal details and presses action button
3. Callback handler processes button press
4. User preferences (lot size, etc.) are applied to trade
5. MT4 Connector executes trade through MT4 API
6. Trade confirmation sent back to user

## Technical Implementation Details

### Signal Handling

The `process_webhook_signal` function receives and processes signals:

1. **Validates Signal**: Ensures symbol and action are present
2. **Normalizes Fields**: Handles different field names (side/action/direction)
3. **Creates Buttons**: Generates action buttons for user interaction
4. **Sends to Users**: Distributes signal to all allowed users
5. **Error Handling**: Captures and logs any issues during processing

Key code excerpt from `signal_handler.py`:
```python
# Format the signal message
message = format_signal_message(safe_signal_data)

# Create inline keyboard for trade actions
keyboard = [
    [
        InlineKeyboardButton("✅ Accept", callback_data=f"trade_{signal_id}_accept"),
        InlineKeyboardButton("❌ Reject", callback_data=f"trade_{signal_id}_reject")
    ],
    [InlineKeyboardButton("⚙️ Custom", callback_data=f"trade_{signal_id}_custom")]
]
reply_markup = InlineKeyboardMarkup(keyboard)
```

### Message Formatting

Messages are formatted with rich details to help users make trading decisions:

1. **Markdown Formatting**: Uses `parse_mode="Markdown"` for rich text
2. **Emoji Usage**: Visual indicators for different elements
3. **Structured Layout**: Consistent organization of information
4. **Action Buttons**: Inline buttons for interactive decision-making

Sample message format:
```
🔔 *SIGNAL: EURUSD BUY*
💰 Price: 1.1234
📊 Volume: 0.1
🛑 Stop Loss: 1.1200
🎯 Take Profit: 1.1300
📡 Source: tradingview
🕒 Time: 2025-03-19T15:30:45
```

### User Management

The bot implements user management to control access:

1. **Allowed Users**: Only users in `ALLOWED_USER_IDS` receive signals
2. **Admin Users**: Users in `ADMIN_USER_IDS` have additional privileges
3. **User Data**: Preferences stored in memory using `user_data_store`
4. **Settings Management**: User can customize trading parameters

Implementation in `bot.py`:
```python
# Process admin and allowed user IDs
admin_user_ids = [int(user_id) for user_id in admin_user_ids_raw if user_id]
allowed_user_ids = [int(user_id) for user_id in allowed_user_ids_raw if user_id]

# Include admin users in allowed users list
for admin_id in admin_user_ids:
    if admin_id not in allowed_user_ids:
        allowed_user_ids.append(admin_id)
```

### Trade Execution

The MT4 Connector handles trade execution:

1. **Request Formatting**: Prepares trade parameters for API
2. **API Communication**: Sends requests to MT4 REST API
3. **Response Handling**: Processes API responses and handles errors
4. **Mock Mode**: Can simulate trades when `MOCK_MODE=True`
5. **Status Tracking**: Maintains connection status information

Key methods in `mt4_connector.py`:
```python
def execute_trade(self, trade_data):
    """Execute a trade via MT4 REST API"""
    ...

def close_trade(self, ticket, volume=None):
    """Close an open trade"""
    ...
    
def modify_trade(self, ticket, sl=None, tp=None):
    """Modify an open trade"""
    ...
```

## Operation Modes

### 1. Live Mode

In live mode, the bot connects to real MT4 terminal and executes actual trades:

- `MOCK_MODE=False` in configuration
- Requires active MT4 terminal connection
- Uses real broker credentials
- Executes actual market orders

### 2. Mock Mode

In mock mode, the bot simulates trade execution for testing:

- `MOCK_MODE=True` in configuration
- No real MT4 connection required
- Simulates order tickets and trade execution
- Safe for testing without financial risk

## Error Handling & Reliability

The bot implements robust error handling:

1. **Connection Retry**: Automatically attempts reconnection
2. **Async Error Handling**: Protects against failures in async code
3. **Event Loop Management**: Handles event loop issues for async operations
4. **Extensive Logging**: Detailed logs for troubleshooting
5. **Graceful Fallbacks**: Continues operation even if specific features fail

## Security Features

The bot includes several security mechanisms:

1. **Token Validation**: Ensures bot token follows proper format
2. **User Authentication**: Only allowed users can access the bot
3. **Action Confirmation**: Critical actions require confirmation
4. **Protected Environment**: Sensitive data stored in environment variables
5. **Error Masking**: Prevents exposing sensitive details in errors

## Configuration Best Practices

1. **Environment Variables**: Store all configuration as environment variables
2. **Separation of Concerns**: Split configuration by component
3. **Default Fallbacks**: Provide safe defaults for missing config
4. **Validation Checks**: Verify critical configuration at startup
5. **Environment-Specific Settings**: Different configs for dev vs. production

## User Interface Design

The bot offers an intuitive user interface:

1. **Command-Based**: Primary interaction through `/commands`
2. **Keyboard Menus**: Custom keyboards for common actions
3. **Inline Buttons**: Context-specific actions within messages
4. **Feedback Messages**: Clear feedback for all user actions
5. **Consistent Formatting**: Standardized message structure

## Best Practices & Usage Guidelines

1. **Command Usage**:
   - `/start` - Begin interaction with the bot
   - `/help` - View available commands
   - `/status` - Check system status
   - `/settings` - Configure trading parameters
   - `/orders` - View and manage open orders

2. **Signal Response**:
   - Review signal details carefully before action
   - "Accept" for default parameters
   - "Custom" to modify parameters
   - "Reject" to ignore the signal

3. **Order Management**:
   - Use `/orders` to view current positions
   - Close trades directly from the orders list
   - Modify stop loss and take profit from the UI

4. **Error Recovery**:
   - If bot doesn't respond, check `/status`
   - Use `/cancel` to abort current operation
   - Restart bot if persistent issues occur

## Maintenance & Monitoring

1. **Log Monitoring**:
   - Check `data/logs/telegram_bot_debug.log` regularly
   - Monitor for repeated errors or warnings
   - Track service health via health endpoints

2. **Health Checks**:
   - Use `check_services.bat` to verify all services
   - HTTP health endpoint at `/health`
   - Periodic connectivity tests to external services

3. **Performance Considerations**:
   - Limit to 30 messages per second (Telegram API limit)
   - Monitor response time to user actions
   - Implement caching for frequent operations