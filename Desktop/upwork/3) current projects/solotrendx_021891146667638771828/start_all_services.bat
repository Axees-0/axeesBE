@echo off
echo Starting SoloTrend X System Components...

rem Get the current directory and fix path issues
set "PROJECT_ROOT=%~dp0"
echo Project root: %PROJECT_ROOT%

rem Define the virtual environment path
set "VENV_DIR=%PROJECT_ROOT%venv"
echo Virtual environment: %VENV_DIR%

rem Create separate log directories if they don't exist
if not exist "%PROJECT_ROOT%data\logs" (
    mkdir "%PROJECT_ROOT%data\logs"
)

rem Create shortcut paths to avoid spaces and special characters
set "MT4_API_DIR=%PROJECT_ROOT%src\backend\MT4RestfulAPIWrapper"
set "WEBHOOK_DIR=%PROJECT_ROOT%src\backend\webhook_api"
set "TELEGRAM_DIR=%PROJECT_ROOT%src\backend\telegram_connector"
set "LOG_DIR=%PROJECT_ROOT%data\logs"

rem Start component 1: MT4 REST API
echo Starting MT4 REST API...
start cmd /k "title MT4 REST API && cd /d "%MT4_API_DIR%" && call "%VENV_DIR%\Scripts\activate.bat" && set "PYTHONPATH=%PROJECT_ROOT%" && python mt4_rest_api_implementation.py > "%LOG_DIR%\mt4_rest_api.log" 2>&1"

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 2: Webhook API
echo Starting Webhook API...
start cmd /k "title Webhook API && cd /d "%WEBHOOK_DIR%" && call "%VENV_DIR%\Scripts\activate.bat" && set "PYTHONPATH=%PROJECT_ROOT%" && python run_server.py > "%LOG_DIR%\webhook_api.log" 2>&1"

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 3: Telegram Connector
echo Starting Telegram Connector...
start cmd /k "title Telegram Connector && cd /d "%TELEGRAM_DIR%" && call "%VENV_DIR%\Scripts\activate.bat" && set "PYTHONPATH=%PROJECT_ROOT%" && python app.py > "%LOG_DIR%\telegram_connector.log" 2>&1"

echo All components started!
echo MT4 REST API running in first window
echo Webhook API running in second window
echo Telegram Connector running in third window
echo.
echo Logs are being saved to:
echo - %LOG_DIR%\mt4_rest_api.log
echo - %LOG_DIR%\webhook_api.log
echo - %LOG_DIR%\telegram_connector.log
echo.
echo Press any key to exit this window (services will continue running)
pause