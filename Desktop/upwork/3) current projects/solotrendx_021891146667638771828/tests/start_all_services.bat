@echo off
setlocal enabledelayedexpansion

echo ==== SoloTrend X System Startup ====
echo Starting services at %date% %time%
echo.

rem Create log file for startup
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a%%b)
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\\"
set "LOG_FILE=%PROJECT_ROOT%data\logs\startup_%mydate%_%mytime%.log"

echo Service startup initiated at %date% %time% > "%LOG_FILE%"

rem ============== DIRECTORY SETUP ==============

rem Ensure log directory exists
if not exist "%PROJECT_ROOT%data\logs" (
    mkdir "%PROJECT_ROOT%data\logs"
    echo Created log directory
)

rem ============== VIRTUAL ENVIRONMENT DETECTION ==============

rem Define the virtual environment path
set "VENV_DIR=%PROJECT_ROOT%environment\python\venv"
echo Virtual environment: %VENV_DIR% >> "%LOG_FILE%"

rem Check if virtual environment exists at primary location
if not exist "%VENV_DIR%" (
    echo WARNING: Primary virtual environment not found at %VENV_DIR%
    echo Checking alternative locations...
    
    rem Check if a venv directory exists at the project root
    if exist "%PROJECT_ROOT%venv" (
        echo Found virtual environment at project root
        set "VENV_DIR=%PROJECT_ROOT%venv"
    rem Check if a venv directory exists in the script directory
    ) else if exist "%SCRIPT_DIR%venv" (
        echo Found virtual environment at script directory
        set "VENV_DIR=%SCRIPT_DIR%venv"
    ) else (
        echo ERROR: Could not find virtual environment
        echo Please run setup_venv.bat first
        echo ERROR: Could not find virtual environment >> "%LOG_FILE%"
        echo Please run setup_venv.bat first >> "%LOG_FILE%"
        pause
        exit /b 1
    )
)

rem ============== COMPONENT PATHS SETUP ==============

rem Create absolute paths to component directories
set "MT4_API_DIR=%PROJECT_ROOT%src\backend\MT4RestfulAPIWrapper"
set "WEBHOOK_DIR=%PROJECT_ROOT%src\backend\webhook_api"
set "TELEGRAM_DIR=%PROJECT_ROOT%src\backend\telegram_connector"
set "LOG_DIR=%PROJECT_ROOT%data\logs"

echo Path configuration: >> "%LOG_FILE%"
echo - MT4 API Directory: %MT4_API_DIR% >> "%LOG_FILE%"
echo - Webhook Directory: %WEBHOOK_DIR% >> "%LOG_FILE%"
echo - Telegram Directory: %TELEGRAM_DIR% >> "%LOG_FILE%"
echo - Log Directory: %LOG_DIR% >> "%LOG_FILE%"

rem Print diagnostic information to console
echo MT4 API Directory: %MT4_API_DIR%
echo Webhook Directory: %WEBHOOK_DIR%
echo Telegram Directory: %TELEGRAM_DIR%

rem ============== VERIFY COMPONENT FILES ==============

rem Check if key files exist
set "ERROR_COUNT=0"

if not exist "%MT4_API_DIR%\direct_run.py" (
    echo ERROR: MT4 API startup script not found
    set /a ERROR_COUNT+=1
)

if not exist "%WEBHOOK_DIR%\run_server.py" (
    echo ERROR: Webhook API startup script not found
    set /a ERROR_COUNT+=1
)

if not exist "%TELEGRAM_DIR%\run.py" (
    echo ERROR: Telegram connector startup script not found
    set /a ERROR_COUNT+=1
)

if %ERROR_COUNT% GTR 0 (
    echo Found %ERROR_COUNT% missing files. Cannot continue.
    echo Found %ERROR_COUNT% missing files. Cannot continue. >> "%LOG_FILE%"
    pause
    exit /b 1
)

rem ============== CONFIGURATION SETUP ==============

rem Read port settings from .env file
set "MT4_API_PORT=5002"
set "WEBHOOK_API_PORT=5003"
set "TELEGRAM_PORT=5005"
set "USE_MOCK_MODE=false"
set "MOCK_MODE=False"

rem Try to read from .env file if it exists
if exist "%PROJECT_ROOT%.env" (
    echo Reading port settings from .env file... >> "%LOG_FILE%"
    
    rem Parse the .env file for port settings
    for /f "tokens=1,* delims==" %%a in ('type "%PROJECT_ROOT%.env" ^| findstr "PORT"') do (
        if "%%a"=="WEBHOOK_API_PORT" set "WEBHOOK_API_PORT=%%b"
        if "%%a"=="FLASK_PORT" set "TELEGRAM_PORT=%%b"
        if "%%a"=="PORT" set "MT4_API_PORT=%%b"
    )
    
    rem Parse the .env file for mock mode settings
    for /f "tokens=1,* delims==" %%a in ('type "%PROJECT_ROOT%.env" ^| findstr "MOCK"') do (
        if "%%a"=="USE_MOCK_MODE" set "USE_MOCK_MODE=%%b"
        if "%%a"=="MOCK_MODE" set "MOCK_MODE=%%b"
    )
)

echo Using port configuration: >> "%LOG_FILE%"
echo - MT4 API Port: %MT4_API_PORT% >> "%LOG_FILE%"
echo - Webhook API Port: %WEBHOOK_API_PORT% >> "%LOG_FILE%"
echo - Telegram Port: %TELEGRAM_PORT% >> "%LOG_FILE%"

echo Using the following ports:
echo - MT4 API: %MT4_API_PORT%
echo - Webhook API: %WEBHOOK_API_PORT%
echo - Telegram: %TELEGRAM_PORT%

rem ============== START SERVICES ==============

rem Create individual log files for each service
set "MT4_LOG=%LOG_DIR%\mt4_start.log"
set "WEBHOOK_LOG=%LOG_DIR%\webhook_start.log"
set "TELEGRAM_LOG=%LOG_DIR%\telegram_start.log"

rem Start component 1: MT4 REST API with real MT4 connection
echo Starting MT4 REST API on port %MT4_API_PORT%... >> "%LOG_FILE%"
echo Starting MT4 REST API with REAL MT4 connection...
start cmd /k "title MT4 REST API && echo MT4 API starting from %MT4_API_DIR% > "%MT4_LOG%" && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set PORT=%MT4_API_PORT% && set USE_MOCK_MODE=%USE_MOCK_MODE% && set MT4_SERVER=localhost && set MT4_PORT=443 && set MT4_LOGIN=80000300 && set MT4_PASSWORD=D7m!NMg&tteB && cd /d "%MT4_API_DIR%" && python direct_run.py 2>> "%MT4_LOG%""
echo MT4 API started >> "%LOG_FILE%"

rem Wait a moment before starting the next component
timeout /t 3 > nul

rem Start component 2: Webhook API
echo Starting Webhook API on port %WEBHOOK_API_PORT%... >> "%LOG_FILE%"
echo Starting Webhook API...
start cmd /k "title Webhook API && echo Webhook API starting from %WEBHOOK_DIR% > "%WEBHOOK_LOG%" && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set FLASK_APP=app && cd /d "%WEBHOOK_DIR%" && python run_server.py 2>> "%WEBHOOK_LOG%""
echo Webhook API started >> "%LOG_FILE%"

rem Wait a moment before starting the next component
timeout /t 3 > nul

rem Start component 3: Telegram Bot
echo Starting Telegram Bot on port %TELEGRAM_PORT%... >> "%LOG_FILE%"
echo Starting Telegram Bot...
start cmd /k "title Telegram Bot && echo Telegram Bot starting from %TELEGRAM_DIR% > "%TELEGRAM_LOG%" && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set MT4_API_URL=http://localhost:%MT4_API_PORT%/api && set FLASK_PORT=%TELEGRAM_PORT% && set MOCK_MODE=%MOCK_MODE% && cd /d "%TELEGRAM_DIR%" && python run.py 2>> "%TELEGRAM_LOG%""
echo Telegram Bot started >> "%LOG_FILE%"

echo All components started! >> "%LOG_FILE%"
echo Service startup completed at %date% %time% >> "%LOG_FILE%"

echo ==== STARTUP COMPLETE ====
echo.
echo All components started:
echo.
echo MT4 REST API running on port %MT4_API_PORT%
echo Webhook API running on port %WEBHOOK_API_PORT%
echo Telegram Bot running on port %TELEGRAM_PORT%
echo.
echo Log files:
echo - Main startup log: %LOG_FILE%
echo - MT4 API log: %MT4_LOG%
echo - Webhook API log: %WEBHOOK_LOG%
echo - Telegram log: %TELEGRAM_LOG%
echo.
echo Press any key to exit this window (services will continue running)
pause