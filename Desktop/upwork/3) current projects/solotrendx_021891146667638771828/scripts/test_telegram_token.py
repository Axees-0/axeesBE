#!/usr/bin/env python3
"""
Utility script to test a Telegram bot token for validity.
This helps diagnose issues with the token without having to run the full application.
"""

import os
import sys
import logging
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from telegram import Bot
from telegram.error import InvalidToken, TelegramError

# Add project root to path for imports
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
    ]
)
logger = logging.getLogger(__name__)

async def test_bot_token(token):
    """Test if a Telegram bot token is valid by trying to get bot info"""
    try:
        # Create bot instance
        bot = Bot(token=token)
        logger.info("Bot instance created successfully")
        
        # Test the token by getting bot information
        me = await bot.get_me()
        logger.info(f"✅ Token is valid! Bot info: @{me.username} (ID: {me.id})")
        return True, f"@{me.username}"
    except InvalidToken as e:
        logger.error(f"❌ Invalid token error: {e}")
        return False, str(e)
    except TelegramError as e:
        logger.error(f"❌ Telegram API error: {e}")
        return False, str(e)
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        return False, str(e)

async def main():
    """Main function to test Telegram bot token"""
    logger.info(f"Project root: {project_root}")
    
    # Load environment variables
    env_files = [
        os.path.join(project_root, '.env'),
        os.path.join(project_root, '.env.telegram'),
        os.path.join(project_root, '.env.local')
    ]
    
    for env_file in env_files:
        if os.path.exists(env_file):
            load_dotenv(env_file)
            logger.info(f"Loaded environment from: {env_file}")
    
    # Get token from environment
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN not found in environment variables")
        print("\nPlease set TELEGRAM_BOT_TOKEN in .env file or provide it as an argument")
        return
    
    # Validate token format
    token_parts = token.split(':')
    if len(token_parts) != 2:
        logger.error(f"Token format is invalid. Expected format: NUMBER:STRING")
        return
    
    try:
        # Check first part is a number
        bot_id = int(token_parts[0])
        logger.info(f"Bot ID from token: {bot_id}")
    except ValueError:
        logger.error(f"First part of token should be numeric")
        return
    
    # Test the token
    logger.info(f"Testing Telegram bot token...")
    valid, message = await test_bot_token(token)
    
    if valid:
        print("\n✅ Token is valid and working correctly!")
        print(f"Bot username: {message}")
    else:
        print("\n❌ Token validation failed!")
        print(f"Error: {message}")
        
        # Additional checks
        if "unauthorized" in message.lower():
            print("\nThis usually means the token has been revoked or is incorrect.")
            print("Please check that you're using the correct token from BotFather.")
        elif "blocked" in message.lower():
            print("\nYour bot might be blocked by Telegram API.")
            print("Try creating a new bot with @BotFather.")
        elif "too many requests" in message.lower():
            print("\nYou've hit Telegram's rate limits.")
            print("Wait a while before trying again.")

if __name__ == "__main__":
    asyncio.run(main())