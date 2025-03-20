import logging
import asyncio
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
from src.backend.telegram_connector.mt4_connector import MT4Connector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store user data
user_data_store = {}

# Initialize MT4 Connector
mt4_connector = None

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a welcome message when the command /start is issued."""
    user_id = update.effective_user.id
    user_name = update.effective_user.first_name
    
    # Check if user is allowed
    if user_id not in context.bot_data.get("allowed_users", []):
        logger.warning(f"Unauthorized access attempt by user {user_id}")
        await update.message.reply_text(
            "⚠️ You are not authorized to use this bot. Please contact the administrator."
        )
        return
    
    # Welcome message
    await update.message.reply_text(
        f"👋 Welcome to SoloTrend X Trading Bot, {user_name}!\n\n"
        "I'll notify you about trading signals and help you execute trades.\n\n"
        "Use /help to see available commands."
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send help information when the command /help is issued."""
    await update.message.reply_text(
        "🔍 *SoloTrend X Trading Bot Commands*\n\n"
        "/start - Start the bot\n"
        "/help - Show this help message\n"
        "/status - Check bot and connection status\n"
        "/settings - Configure your trading parameters\n"
        "/orders - View your open orders\n"
        "/cancel - Cancel current operation\n\n"
        "When you receive a signal, you can use the buttons below it to execute trades.",
        parse_mode="Markdown"
    )

async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Check status of the trading bot and MT4 connection."""
    # Check MT4 connection status
    status = mt4_connector.get_status()
    
    await update.message.reply_text(
        f"📊 *SoloTrend X Trading Bot Status*\n\n"
        f"Bot status: ✅ Running\n"
        f"MT4 connection: {'✅ Connected' if status.get('connected') else '❌ Disconnected'}\n"
        f"Mode: {'🔵 Mock' if context.bot_data.get('mock_mode') else '🟢 Live'}\n"
        f"Server: {status.get('server', 'N/A')}\n"
        f"Active signals: {len(context.bot_data.get('active_signals', []))}\n"
        f"Open orders: {status.get('open_orders', 0)}",
        parse_mode="Markdown"
    )

async def settings_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Configure trading settings."""
    # Get current settings or set defaults
    user_id = str(update.effective_user.id)
    if user_id not in user_data_store:
        user_data_store[user_id] = {
            "risk_percent": 1.0,
            "default_lot_size": 0.01,
            "auto_trade": False,
            "notifications": True
        }
    
    settings = user_data_store[user_id]
    
    # Create settings keyboard
    keyboard = [
        [InlineKeyboardButton(f"Risk: {settings['risk_percent']}%", callback_data="settings_risk")],
        [InlineKeyboardButton(f"Lot Size: {settings['default_lot_size']}", callback_data="settings_lot")],
        [InlineKeyboardButton(f"Auto-Trade: {'On' if settings['auto_trade'] else 'Off'}", callback_data="settings_auto")],
        [InlineKeyboardButton(f"Notifications: {'On' if settings['notifications'] else 'Off'}", callback_data="settings_notify")],
        [InlineKeyboardButton("Save Settings", callback_data="settings_save")]
    ]
    
    await update.message.reply_text(
        "⚙️ *Trading Settings*\n\n"
        "Configure your personal trading preferences:",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="Markdown"
    )

async def orders_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """View open orders."""
    # Get open orders from MT4 connector
    orders = mt4_connector.get_open_orders()
    
    if not orders:
        await update.message.reply_text("📭 You don't have any open orders.")
        return
    
    # Format orders message
    message = "📋 *Your Open Orders*\n\n"
    for order in orders:
        message += (
            f"Ticket: #{order['ticket']}\n"
            f"Symbol: {order['symbol']}\n"
            f"Type: {order['type']}\n"
            f"Size: {order['volume']}\n"
            f"Open Price: {order['open_price']}\n"
            f"Current Price: {order['current_price']}\n"
            f"SL: {order['sl']}\n"
            f"TP: {order['tp']}\n"
            f"Profit: {order['profit']}\n\n"
        )
        
        # Add buttons for each order
        keyboard = [
            [
                InlineKeyboardButton("Close", callback_data=f"close_{order['ticket']}"),
                InlineKeyboardButton("Modify", callback_data=f"modify_{order['ticket']}")
            ]
        ]
        
        await update.message.reply_text(
            message,
            reply_markup=InlineKeyboardMarkup(keyboard),
            parse_mode="Markdown"
        )

async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Cancel current operation."""
    await update.message.reply_text("Operation canceled.")
    return

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle button clicks."""
    query = update.callback_query
    await query.answer()
    
    callback_data = query.data
    
    if callback_data.startswith("trade_"):
        # Handle trade request
        _, signal_id, action = callback_data.split("_")
        await handle_trade_action(update, context, signal_id, action)
    
    elif callback_data.startswith("settings_"):
        # Handle settings update
        _, setting = callback_data.split("_")
        await handle_settings_update(update, context, setting)
    
    elif callback_data.startswith("close_"):
        # Handle order close request
        _, ticket = callback_data.split("_")
        await handle_close_order(update, context, ticket)
    
    elif callback_data.startswith("modify_"):
        # Handle order modify request
        _, ticket = callback_data.split("_")
        await handle_modify_order(update, context, ticket)

async def handle_trade_action(update: Update, context: ContextTypes.DEFAULT_TYPE, signal_id: str, action: str) -> None:
    """Handle trading actions from callback buttons."""
    query = update.callback_query
    
    # Get the signal from bot_data
    signals = context.bot_data.get("active_signals", {})
    if signal_id not in signals:
        await query.edit_message_text("⚠️ This signal has expired or is no longer valid.")
        return
    
    signal = signals[signal_id]
    
    if action == "accept":
        # Get user settings for lot size
        user_id = str(update.effective_user.id)
        user_settings = user_data_store.get(user_id, {"default_lot_size": 0.01})
        lot_size = user_settings.get("default_lot_size", 0.01)
        
        # Prepare trade request
        trade_request = {
            "symbol": signal.get("symbol"),
            "direction": signal.get("direction", "BUY"),
            "volume": lot_size,
            "sl": signal.get("stop_loss"),
            "tp": signal.get("take_profit")
        }
        
        # Execute trade through MT4 connector
        try:
            result = mt4_connector.execute_trade(trade_request)
            
            if result.get("status") == "success":
                await query.edit_message_text(
                    f"✅ Trade executed successfully!\n\n"
                    f"Ticket: {result.get('ticket', 'N/A')}\n"
                    f"Symbol: {signal.get('symbol')}\n"
                    f"Direction: {signal.get('direction')}\n"
                    f"Lot Size: {lot_size}\n"
                    f"Entry Price: {result.get('price', 'Market')}\n"
                    f"SL: {signal.get('stop_loss')}\n"
                    f"TP: {signal.get('take_profit')}",
                    parse_mode="Markdown"
                )
            else:
                await query.edit_message_text(
                    f"❌ Trade execution failed!\n\n"
                    f"Error: {result.get('message', 'Unknown error')}\n\n"
                    f"Please try again or contact support.",
                    parse_mode="Markdown"
                )
        except Exception as e:
            logger.error(f"Error executing trade: {e}")
            await query.edit_message_text(
                f"❌ Error executing trade: {str(e)}\n\n"
                f"Please try again or contact support.",
                parse_mode="Markdown"
            )
    
    elif action == "reject":
        await query.edit_message_text(
            f"❌ Signal rejected:\n\n"
            f"Symbol: {signal.get('symbol')}\n"
            f"Direction: {signal.get('direction')}\n",
            parse_mode="Markdown"
        )
        
        # Remove from active signals
        if signal_id in signals:
            del signals[signal_id]
    
    elif action == "custom":
        # Show custom trade parameters form
        keyboard = [
            [InlineKeyboardButton("0.01", callback_data=f"lot_0.01_{signal_id}")],
            [InlineKeyboardButton("0.05", callback_data=f"lot_0.05_{signal_id}")],
            [InlineKeyboardButton("0.1", callback_data=f"lot_0.1_{signal_id}")],
            [InlineKeyboardButton("0.5", callback_data=f"lot_0.5_{signal_id}")],
            [InlineKeyboardButton("1.0", callback_data=f"lot_1.0_{signal_id}")],
            [InlineKeyboardButton("Cancel", callback_data=f"trade_{signal_id}_reject")]
        ]
        
        await query.edit_message_text(
            f"Select lot size for {signal.get('symbol')} {signal.get('direction')}:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )

async def handle_settings_update(update: Update, context: ContextTypes.DEFAULT_TYPE, setting: str) -> None:
    """Handle settings updates."""
    query = update.callback_query
    user_id = str(update.effective_user.id)
    
    # Initialize user settings if not exists
    if user_id not in user_data_store:
        user_data_store[user_id] = {
            "risk_percent": 1.0,
            "default_lot_size": 0.01,
            "auto_trade": False,
            "notifications": True
        }
    
    settings = user_data_store[user_id]
    
    if setting == "risk":
        # Cycle through risk percentages
        risk_options = [0.5, 1.0, 2.0, 3.0, 5.0]
        current_index = risk_options.index(settings["risk_percent"]) if settings["risk_percent"] in risk_options else 0
        new_index = (current_index + 1) % len(risk_options)
        settings["risk_percent"] = risk_options[new_index]
    
    elif setting == "lot":
        # Cycle through lot sizes
        lot_options = [0.01, 0.05, 0.1, 0.5, 1.0]
        current_index = lot_options.index(settings["default_lot_size"]) if settings["default_lot_size"] in lot_options else 0
        new_index = (current_index + 1) % len(lot_options)
        settings["default_lot_size"] = lot_options[new_index]
    
    elif setting == "auto":
        # Toggle auto-trade
        settings["auto_trade"] = not settings["auto_trade"]
    
    elif setting == "notify":
        # Toggle notifications
        settings["notifications"] = not settings["notifications"]
    
    elif setting == "save":
        # Save settings and close
        await query.edit_message_text(
            "✅ Your settings have been saved successfully.",
            parse_mode="Markdown"
        )
        return
    
    # Update keyboard with new settings
    keyboard = [
        [InlineKeyboardButton(f"Risk: {settings['risk_percent']}%", callback_data="settings_risk")],
        [InlineKeyboardButton(f"Lot Size: {settings['default_lot_size']}", callback_data="settings_lot")],
        [InlineKeyboardButton(f"Auto-Trade: {'On' if settings['auto_trade'] else 'Off'}", callback_data="settings_auto")],
        [InlineKeyboardButton(f"Notifications: {'On' if settings['notifications'] else 'Off'}", callback_data="settings_notify")],
        [InlineKeyboardButton("Save Settings", callback_data="settings_save")]
    ]
    
    await query.edit_message_text(
        "⚙️ *Trading Settings*\n\n"
        "Configure your personal trading preferences:",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="Markdown"
    )

async def handle_close_order(update: Update, context: ContextTypes.DEFAULT_TYPE, ticket: str) -> None:
    """Handle order close request."""
    query = update.callback_query
    
    try:
        result = mt4_connector.close_order(ticket)
        
        if result.get("status") == "success":
            await query.edit_message_text(
                f"✅ Order #{ticket} closed successfully!\n\n"
                f"Profit: {result.get('profit', 'N/A')}",
                parse_mode="Markdown"
            )
        else:
            await query.edit_message_text(
                f"❌ Failed to close order #{ticket}!\n\n"
                f"Error: {result.get('message', 'Unknown error')}",
                parse_mode="Markdown"
            )
    except Exception as e:
        logger.error(f"Error closing order: {e}")
        await query.edit_message_text(
            f"❌ Error closing order: {str(e)}",
            parse_mode="Markdown"
        )

async def handle_modify_order(update: Update, context: ContextTypes.DEFAULT_TYPE, ticket: str) -> None:
    """Handle order modification request."""
    query = update.callback_query
    
    # Get order details
    order = next((o for o in mt4_connector.get_open_orders() if o['ticket'] == int(ticket)), None)
    
    if not order:
        await query.edit_message_text(
            f"⚠️ Order #{ticket} not found or already closed.",
            parse_mode="Markdown"
        )
        return
    
    # Set context for conversation
    context.user_data["modifying_order"] = order
    
    # Show modification options
    keyboard = [
        [InlineKeyboardButton("Modify Stop Loss", callback_data=f"mod_sl_{ticket}")],
        [InlineKeyboardButton("Modify Take Profit", callback_data=f"mod_tp_{ticket}")],
        [InlineKeyboardButton("Cancel", callback_data="mod_cancel")]
    ]
    
    await query.edit_message_text(
        f"🔧 *Modify Order #{ticket}*\n\n"
        f"Symbol: {order['symbol']}\n"
        f"Type: {order['type']}\n"
        f"Open Price: {order['open_price']}\n"
        f"Current Price: {order['current_price']}\n"
        f"Current SL: {order['sl']}\n"
        f"Current TP: {order['tp']}\n\n"
        f"Select what you want to modify:",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode="Markdown"
    )

def setup_bot(app):
    """Initialize and configure the Telegram bot."""
    global mt4_connector
    
    # Get configuration from app
    token = app.config.get('TELEGRAM_BOT_TOKEN')
    if not token:
        logger.error("Telegram bot token not provided")
        return None
    
    mock_mode = app.config.get('MOCK_MODE', True)
    admin_user_ids = [int(user_id) for user_id in app.config.get('ADMIN_USER_IDS', []) if user_id]
    allowed_user_ids = [int(user_id) for user_id in app.config.get('ALLOWED_USER_IDS', []) if user_id]
    
    # Include admin users in allowed users list
    for admin_id in admin_user_ids:
        if admin_id not in allowed_user_ids:
            allowed_user_ids.append(admin_id)
    
    # Use MT4 connector from app
    global mt4_connector
    mt4_connector = app.mt4_connector
    
    # Create the Application
    application = Application.builder().token(token).build()
    
    # Store configuration in bot_data
    application.bot_data["mock_mode"] = mock_mode
    application.bot_data["admin_users"] = admin_user_ids
    application.bot_data["allowed_users"] = allowed_user_ids
    application.bot_data["active_signals"] = {}  # Store active signals
    
    # Add command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("status", status_command))
    application.add_handler(CommandHandler("settings", settings_command))
    application.add_handler(CommandHandler("orders", orders_command))
    application.add_handler(CommandHandler("cancel", cancel_command))
    
    # Add callback query handler for buttons
    application.add_handler(CallbackQueryHandler(handle_callback))
    
    # Start the bot
    asyncio.create_task(application.run_polling(allowed_updates=Update.ALL_TYPES))
    
    logger.info("Telegram bot started successfully")
    return application