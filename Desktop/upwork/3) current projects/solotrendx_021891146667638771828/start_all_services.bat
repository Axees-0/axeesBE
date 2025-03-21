@echo off
echo Starting SoloTrend X System Components...

rem Get the current directory and fix path issues
set "PROJECT_ROOT=%~dp0"
echo Project root: %PROJECT_ROOT%

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
start cmd /k "title MT4 REST API && echo Running from %MT4_API_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set USE_MOCK_MODE=true && set PORT=5002 && python "%MT4_API_DIR%\direct_run.py""

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 2: Webhook API
echo Starting Webhook API...
start cmd /k "title Webhook API && echo Running from %WEBHOOK_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set FLASK_APP=src.backend.webhook_api.app && python "%WEBHOOK_DIR%\run_server.py""

rem Wait a moment before starting the next component
timeout /t 3

rem REMOVED Telegram Health Server (causes port conflict)

rem Read .env file to get FLASK_PORT value
set "TELEGRAM_PORT=5005"
for /f "tokens=1,* delims==" %%a in ('type "%PROJECT_ROOT%.env" ^| findstr "FLASK_PORT"') do (
    if "%%a"=="FLASK_PORT" set "TELEGRAM_PORT=%%b"
)
echo Using Telegram port: %TELEGRAM_PORT%

rem Start component 4: Telegram Bot
echo Starting Telegram Bot...
start cmd /k "title Telegram Bot && echo Running from %TELEGRAM_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set MT4_API_URL=http://localhost:5002/api && set FLASK_PORT=%TELEGRAM_PORT% && set TELEGRAM_BOT_TOKEN=7890390388:AAHAeOn_tzn1rihuEfpCCNZLzXReIF3fBD4 && set ADMIN_USER_IDS=123456789 && set ALLOWED_USER_IDS=123456789 && set MOCK_MODE=True && python "%TELEGRAM_DIR%\run.py""

echo All components started!
echo.
echo MT4 REST API running on port 5002
echo Webhook API running on port 5003
echo Telegram Bot running on port %TELEGRAM_PORT%
echo.
echo Press any key to exit this window (services will continue running)
pause