@echo off
echo Creating .env file with default configuration...
echo.

rem Get the current directory
set "PROJECT_ROOT=%~dp0"
echo Project root: %PROJECT_ROOT%

rem Check if .env already exists
if exist "%PROJECT_ROOT%.env" (
    echo .env file already exists.
    set /p OVERWRITE=Do you want to overwrite it? (y/n): 
    if /i "%OVERWRITE%" neq "y" goto END
)

echo Creating .env file...
(
echo # MT4 Connection Settings
echo MT4_SERVER=localhost
echo MT4_PORT=443
echo MT4_LOGIN=80001413
echo MT4_PASSWORD=9K63%%M?d?cTP
echo # API Security
echo SECRET_KEY=development_secret_key_change_in_production
echo TOKEN_EXPIRY=3600
echo API_ADMIN_USERNAME=admin
echo API_ADMIN_PASSWORD=password
echo # Telegram Settings
echo TELEGRAM_BOT_TOKEN=your_telegram_bot_token
echo TELEGRAM_CHAT_ID=your_telegram_chat_id
echo # Server Settings
echo PORT=5000
echo WEBHOOK_PORT=5002
echo TELEGRAM_PORT=5001
echo FLASK_DEBUG=True
echo # Mode Settings
echo USE_MOCK_MODE=True
) > "%PROJECT_ROOT%.env"

echo .env file created successfully!
echo.
echo To use real MT4 instead of mock mode, edit the .env file
echo and change USE_MOCK_MODE=True to USE_MOCK_MODE=False
echo.

:END
pause