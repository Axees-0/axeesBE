@echo off
echo Starting SoloTrend X System Components...

rem Get the current directory and fix path issues
set "PROJECT_ROOT=%~dp0"
echo Project root: %PROJECT_ROOT%

rem Check if running from a UNC path
echo %PROJECT_ROOT% | findstr /B "\\\\" > nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Running from a UNC path, this may cause issues.
    echo Please run this script from a mapped drive letter.
    echo For example, map \\server\share to Z: and run from there.
    echo.
    set /p CONTINUE="Do you want to continue anyway? (Y/N): "
    if /i not "%CONTINUE%"=="Y" exit /b 1
)

rem Define the virtual environment path
set "VENV_DIR=%PROJECT_ROOT%environment\python\venv"
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
start cmd /k "title MT4 REST API && cd /d "%MT4_API_DIR%" && echo Current dir: %cd% && echo Activating venv && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set USE_MOCK_MODE=true && set PORT=5002 && python mt4_rest_api_implementation.py"

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 2: Webhook API
echo Starting Webhook API...
start cmd /k "title Webhook API && cd /d "%WEBHOOK_DIR%" && echo Current dir: %cd% && echo Activating venv && call "%VENV_DIR%\Scripts\activate.bat" && echo PYTHONPATH=%PROJECT_ROOT% && set PYTHONPATH=%PROJECT_ROOT% && set FLASK_APP=src.backend.webhook_api.app && set FLASK_DEBUG=True && set FLASK_PORT=5003 && set TELEGRAM_WEBHOOK_URL=http://localhost:5001/webhook && set MOCK_MODE=True && echo Starting webhook API && python run_server.py"

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 3: Telegram Health Server
echo Starting Telegram Health Server...
start cmd /k "title Telegram Health && cd /d "%TELEGRAM_DIR%" && echo Current dir: %cd% && echo Activating venv && call "%VENV_DIR%\Scripts\activate.bat" && echo PYTHONPATH=%PROJECT_ROOT% && set PYTHONPATH=%PROJECT_ROOT% && echo Starting simple health server && python test_health.py"

rem Start component 4: Telegram Bot
echo Starting Telegram Bot...
start cmd /k "title Telegram Bot && cd /d "%TELEGRAM_DIR%" && echo Current dir: %cd% && echo Activating venv && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set MT4_API_URL=http://localhost:5002/api && set FLASK_PORT=5001 && python run.py"

echo All components started!
echo.
echo MT4 REST API running on port 5002
echo Webhook API running on port 5003
echo Telegram Health Server running on port 5001
echo Telegram Bot running in background
echo.
echo IMPORTANT: If you're having UNC path issues, please map the network drive to a letter.
echo Example: net use Z: \\server\share\path
echo Then run this script from the mapped drive.
echo.
echo Press any key to exit this window (services will continue running)
pause