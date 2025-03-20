@echo off
echo Starting SoloTrend X System Components...

rem Get the current directory and fix path issues
set "PROJECT_ROOT=%~dp0"
echo Project root: %PROJECT_ROOT%

rem Handle UNC paths automatically
echo %PROJECT_ROOT% | findstr /B "\\\\" > nul
if %ERRORLEVEL% EQU 0 (
    echo Detected UNC path - using auto-path handling
    set "UNC_PATH=true"
) else (
    set "UNC_PATH=false"
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
if "%UNC_PATH%"=="true" (
    start cmd /k "title MT4 REST API && echo Using directory: %MT4_API_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set USE_MOCK_MODE=true && set PORT=5002 && python "%MT4_API_DIR%\mt4_rest_api_implementation.py""
) else (
    start cmd /k "title MT4 REST API && cd /d "%MT4_API_DIR%" && echo Current dir: %cd% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set USE_MOCK_MODE=true && set PORT=5002 && python mt4_rest_api_implementation.py"
)

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 2: Webhook API
echo Starting Webhook API...
if "%UNC_PATH%"=="true" (
    start cmd /k "title Webhook API && echo Using directory: %WEBHOOK_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set FLASK_APP=src.backend.webhook_api.app && set FLASK_DEBUG=True && set FLASK_PORT=5003 && set TELEGRAM_WEBHOOK_URL=http://localhost:5001/webhook && set MOCK_MODE=True && python "%WEBHOOK_DIR%\run_server.py""
) else (
    start cmd /k "title Webhook API && cd /d "%WEBHOOK_DIR%" && echo Current dir: %cd% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set FLASK_APP=src.backend.webhook_api.app && set FLASK_DEBUG=True && set FLASK_PORT=5003 && set TELEGRAM_WEBHOOK_URL=http://localhost:5001/webhook && set MOCK_MODE=True && python run_server.py"
)

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 3: Telegram Health Server
echo Starting Telegram Health Server...
if "%UNC_PATH%"=="true" (
    start cmd /k "title Telegram Health && echo Using directory: %TELEGRAM_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && python "%TELEGRAM_DIR%\test_health.py""
) else (
    start cmd /k "title Telegram Health && cd /d "%TELEGRAM_DIR%" && echo Current dir: %cd% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && python test_health.py"
)

rem Start component 4: Telegram Bot
echo Starting Telegram Bot...
if "%UNC_PATH%"=="true" (
    start cmd /k "title Telegram Bot && echo Using directory: %TELEGRAM_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set MT4_API_URL=http://localhost:5002/api && set FLASK_PORT=5001 && python "%TELEGRAM_DIR%\run.py""
) else (
    start cmd /k "title Telegram Bot && cd /d "%TELEGRAM_DIR%" && echo Current dir: %cd% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set MT4_API_URL=http://localhost:5002/api && set FLASK_PORT=5001 && python run.py"
)

echo All components started!
echo.
echo MT4 REST API running on port 5002
echo Webhook API running on port 5003
echo Telegram Health Server running on port 5001
echo Telegram Bot running in background
echo.
echo Press any key to exit this window (services will continue running)
pause