"""
Telegram message sender utility for SoloTrend X trading system.
This module provides standalone functions for sending messages to Telegram users.
Can be used from any part of the application without dependency on the full bot implementation.
"""

import os
import asyncio
import logging
from pathlib import Path
from dotenv import load_dotenv
from telegram import Bot

# Configure logging
log_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'logs'))
os.makedirs(log_dir, exist_ok=True)

# Set up file handler for detailed logging
debug_file_handler = logging.FileHandler(os.path.join(log_dir, 'telegram_bot_debug.log'))
debug_file_handler.setLevel(logging.DEBUG)
debug_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]')
debug_file_handler.setFormatter(debug_formatter)

# Configure module logger
logger = logging.getLogger(__name__)
logger.addHandler(debug_file_handler)
logger.setLevel(logging.DEBUG)

# Load environment variables
project_root = Path(__file__).resolve().parents[3]  # Go up 3 levels to project root
load_dotenv(os.path.join(project_root, '.env'))
load_dotenv(os.path.join(project_root, '.env.local'))

# Get token and default chat ID from environment
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
DEFAULT_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
ADMIN_USER_IDS = os.getenv("ADMIN_USER_IDS", "").split(",")

# Check token for basic validity
if TOKEN:
    token_parts = TOKEN.split(':')
    if len(token_parts) != 2 or not token_parts[0].isdigit() or not token_parts[1]:
        logger.warning(f"TELEGRAM_BOT_TOKEN found but has invalid format (should be NUMBER:STRING)")
else:
    logger.warning("TELEGRAM_BOT_TOKEN not found in environment variables")

async def send_telegram_message(
    message: str, 
    chat_id=None, 
    parse_mode: str = "Markdown",
    disable_notification: bool = False
) -> bool:
    """
    Send a message to a Telegram chat.
    
    Args:
        message: The message text to send
        chat_id: The chat ID to send to (uses default from env if None)
        parse_mode: Text formatting mode ('Markdown' or 'HTML')
        disable_notification: Whether to send the message silently
    
    Returns:
        bool: True if successful, False if failed
    """
    # Use default chat ID if none provided
    if chat_id is None:
        if DEFAULT_CHAT_ID:
            try:
                chat_id = int(DEFAULT_CHAT_ID)
            except ValueError:
                logger.error(f"Invalid default chat ID: {DEFAULT_CHAT_ID}")
                return False
        else:
            # Try admin user IDs as fallback
            if ADMIN_USER_IDS and ADMIN_USER_IDS[0]:
                try:
                    chat_id = int(ADMIN_USER_IDS[0].strip())
                    logger.info(f"Using admin user as default chat ID: {chat_id}")
                except ValueError:
                    logger.error(f"Invalid admin user ID: {ADMIN_USER_IDS[0]}")
                    return False
            else:
                error_msg = "No chat_id provided and no default found in environment"
                logger.error(error_msg)
                return False
            
    # Check token
    if not TOKEN:
        logger.error("Telegram bot token is not set")
        return False
    
    token_parts = TOKEN.split(':')
    if len(token_parts) != 2 or not token_parts[0].isdigit() or not token_parts[1]:
        logger.error(f"Invalid Telegram bot token format. Expected format: '123456789:ABCDefGhiJklmNoPQRstUvwxyz'")
        return False
            
    try:
        # Create bot instance
        bot = Bot(token=TOKEN.strip())
        
        # Send message
        await bot.send_message(
            chat_id=chat_id,
            text=message,
            parse_mode=parse_mode,
            disable_notification=disable_notification
        )
        logger.info(f"Message sent to {chat_id}: {message[:50]}...")
        return True
    except Exception as e:
        logger.error(f"Failed to send Telegram message: {e}", exc_info=True)
        return False

# Helper function for calling from synchronous code
def send_message(message: str, chat_id=None, parse_mode: str = "Markdown") -> bool:
    """
    Synchronous wrapper for send_telegram_message
    
    Call this from any non-async code in your application
    """
    try:
        return asyncio.run(send_telegram_message(message, chat_id, parse_mode))
    except RuntimeError as e:
        # Handle the case where an event loop is already running
        if "This event loop is already running" in str(e):
            logger.warning("Event loop already running, using alternative approach")
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(send_telegram_message(message, chat_id, parse_mode))
                return result
            finally:
                loop.close()
        else:
            raise e

async def notify_admins(message: str, parse_mode: str = "Markdown") -> bool:
    """
    Send a notification to all admin users defined in ADMIN_USER_IDS
    
    Args:
        message: The message to send
        parse_mode: Text formatting mode
        
    Returns:
        bool: True if at least one message was sent successfully
    """
    if not ADMIN_USER_IDS or not ADMIN_USER_IDS[0]:
        logger.warning("No admin users defined in ADMIN_USER_IDS environment variable")
        return False
    
    success = False
    for admin_id in ADMIN_USER_IDS:
        if not admin_id.strip():
            continue
            
        try:
            admin_chat_id = int(admin_id.strip())
            if await send_telegram_message(message, admin_chat_id, parse_mode):
                success = True
        except ValueError:
            logger.error(f"Invalid admin user ID: {admin_id}")
            continue
    
    return success

# Synchronous version for use from non-async code
def notify_admins_sync(message: str, parse_mode: str = "Markdown") -> bool:
    """
    Synchronous version of notify_admins
    """
    try:
        return asyncio.run(notify_admins(message, parse_mode))
    except RuntimeError as e:
        # Handle the case where an event loop is already running
        if "This event loop is already running" in str(e):
            logger.warning("Event loop already running, using alternative approach")
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(notify_admins(message, parse_mode))
                return result
            finally:
                loop.close()
        else:
            raise e

def send_trade_notification(
    symbol: str, 
    action: str, 
    price: float, 
    stop_loss: float = None,
    take_profit: float = None,
    volume: float = None,
    strategy: str = None,
    chat_id = None
) -> bool:
    """
    Send a formatted trade notification
    
    Args:
        symbol: The trading symbol
        action: Action (BUY, SELL, etc.)
        price: Entry price
        stop_loss: Stop loss level
        take_profit: Take profit level
        volume: Trade volume
        strategy: Strategy name
        chat_id: Chat ID to send to (uses default if None)
        
    Returns:
        bool: True if successful, False if failed
    """
    # Format message with emojis and proper formatting
    message_lines = [
        f"🔔 *SIGNAL: {symbol} {action.upper()}*",
        f"💰 Price: {price}"
    ]
    
    if volume is not None:
        message_lines.append(f"📊 Volume: {volume}")
        
    if stop_loss is not None:
        message_lines.append(f"🛑 Stop Loss: {stop_loss}")
        
    if take_profit is not None:
        message_lines.append(f"🎯 Take Profit: {take_profit}")
        
    if strategy is not None:
        message_lines.append(f"📈 Strategy: {strategy}")
        
    # Add timestamp
    from datetime import datetime
    message_lines.append(f"🕒 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Join and send
    message = "\n".join(message_lines)
    return send_message(message, chat_id)

# Example usage when run directly
if __name__ == "__main__":
    success = send_message("🚀 Test message from Telegram Sender module")
    print(f"Message sent: {success}")
    
    # Test trade notification
    success = send_trade_notification(
        symbol="EURUSD",
        action="BUY",
        price=1.1234,
        stop_loss=1.1200,
        take_profit=1.1300,
        volume=0.1,
        strategy="SoloTrend X Test"
    )
    print(f"Trade notification sent: {success}")