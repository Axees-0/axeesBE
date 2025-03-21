@echo off
echo Starting SoloTrend X System Components...

rem Get the current directory and fix path issues
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\\"
echo Script directory: %SCRIPT_DIR%
echo Project root: %PROJECT_ROOT%

rem Define the virtual environment path
set "VENV_DIR=%PROJECT_ROOT%environment\python\venv"
echo Virtual environment: %VENV_DIR%

rem Check if virtual environment exists
if not exist "%VENV_DIR%" (
    echo WARNING: Virtual environment not found at %VENV_DIR%
    echo Checking alternative locations...
    
    if exist "%PROJECT_ROOT%venv" (
        echo Found virtual environment at %PROJECT_ROOT%venv
        set "VENV_DIR=%PROJECT_ROOT%venv"
    ) else if exist "%SCRIPT_DIR%venv" (
        echo Found virtual environment at %SCRIPT_DIR%venv
        set "VENV_DIR=%SCRIPT_DIR%venv"
    ) else (
        echo ERROR: Could not find virtual environment
        echo Please run setup_venv.bat first
        pause
        exit /b 1
    )
)

echo Using virtual environment: %VENV_DIR%

rem Create separate log directories if they don't exist
if not exist "%PROJECT_ROOT%data\logs" (
    mkdir "%PROJECT_ROOT%data\logs"
)

rem Create shortcut paths to avoid spaces and special characters 
set "MT4_API_DIR=%PROJECT_ROOT%src\backend\MT4RestfulAPIWrapper"
set "WEBHOOK_DIR=%PROJECT_ROOT%src\backend\webhook_api"
set "TELEGRAM_DIR=%PROJECT_ROOT%src\backend\telegram_connector"
set "LOG_DIR=%PROJECT_ROOT%data\logs"

rem Verify paths exist (for debugging)
echo MT4 API Directory: %MT4_API_DIR%
echo Webhook Directory: %WEBHOOK_DIR%
echo Telegram Directory: %TELEGRAM_DIR%
echo Log Directory: %LOG_DIR%

rem Create directories if they don't exist
if not exist "%MT4_API_DIR%" (
    echo Creating MT4 API directory...
    mkdir "%MT4_API_DIR%"
)
if not exist "%WEBHOOK_DIR%" (
    echo Creating Webhook directory...
    mkdir "%WEBHOOK_DIR%"
)
if not exist "%TELEGRAM_DIR%" (
    echo Creating Telegram directory...
    mkdir "%TELEGRAM_DIR%"
)
if not exist "%LOG_DIR%" (
    echo Creating Log directory...
    mkdir "%LOG_DIR%"
)

rem Start component 1: MT4 REST API with real MT4 connection
echo Starting MT4 REST API with REAL MT4 connection...
start cmd /k "title MT4 REST API && echo Running from %MT4_API_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set USE_MOCK_MODE=false && set MT4_SERVER=localhost && set MT4_PORT=443 && set MT4_LOGIN=80000300 && set MT4_PASSWORD=D7m!NMg&tteB && set PORT=5002 && python "%MT4_API_DIR%\direct_run.py""

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
echo Reading .env file from: %PROJECT_ROOT%.env
if exist "%PROJECT_ROOT%.env" (
    echo .env file found
    for /f "tokens=1,* delims==" %%a in ('type "%PROJECT_ROOT%.env" ^| findstr "FLASK_PORT"') do (
        if "%%a"=="FLASK_PORT" set "TELEGRAM_PORT=%%b"
    )
) else (
    echo WARNING: .env file not found, using default port: %TELEGRAM_PORT%
)
echo Using Telegram port: %TELEGRAM_PORT%

rem Start component 4: Telegram Bot
echo Starting Telegram Bot...
start cmd /k "title Telegram Bot && echo Running from %TELEGRAM_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set MT4_API_URL=http://localhost:5002/api && set FLASK_PORT=%TELEGRAM_PORT% && set TELEGRAM_BOT_TOKEN=7890390388:AAHAeOn_tzn1rihuEfpCCNZLzXReIF3fBD4 && set ADMIN_USER_IDS=123456789 && set ALLOWED_USER_IDS=123456789 && set MOCK_MODE=False && python "%TELEGRAM_DIR%\run.py""

echo All components started!
echo.
echo MT4 REST API running on port 5002
echo Webhook API running on port 5003
echo Telegram Bot running on port %TELEGRAM_PORT%
echo.
echo Press any key to exit this window (services will continue running)
pause