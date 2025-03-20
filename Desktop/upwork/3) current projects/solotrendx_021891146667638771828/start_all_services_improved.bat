@echo off
setlocal enabledelayedexpansion

echo Starting SoloTrend X System Components...

rem Get the current directory as project root and ensure consistent path format
set "PROJECT_ROOT=%~dp0"
echo Project root: %PROJECT_ROOT%

rem Define the virtual environment path
set "VENV_DIR=%PROJECT_ROOT%environment\python\venv"
echo Virtual environment: %VENV_DIR%

rem Create data/logs directory if it doesn't exist
if not exist "%PROJECT_ROOT%data\logs" (
    mkdir "%PROJECT_ROOT%data\logs"
    echo Created logs directory at %PROJECT_ROOT%data\logs
)

rem Create shortcut paths to avoid spaces and special characters 
set "MT4_API_DIR=%PROJECT_ROOT%src\backend\MT4RestfulAPIWrapper"
set "WEBHOOK_DIR=%PROJECT_ROOT%src\backend\webhook_api"
set "TELEGRAM_DIR=%PROJECT_ROOT%src\backend\telegram_connector"
set "LOG_DIR=%PROJECT_ROOT%data\logs"

rem Test if paths exist before attempting to start services
rem MT4 API check
if not exist "%MT4_API_DIR%\mt4_rest_api_implementation.py" (
    echo ERROR: MT4 API implementation file not found at %MT4_API_DIR%\mt4_rest_api_implementation.py
    goto error
)

rem Webhook API check
if not exist "%WEBHOOK_DIR%\run_server.py" (
    echo ERROR: Webhook API server file not found at %WEBHOOK_DIR%\run_server.py
    goto error
)

rem Telegram connector check
if not exist "%TELEGRAM_DIR%\run.py" (
    echo ERROR: Telegram Bot server file not found at %TELEGRAM_DIR%\run.py
    goto error
)

rem Check if Python virtual environment exists
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo ERROR: Python virtual environment not found at %VENV_DIR%
    goto error
)

rem Start component 1: MT4 REST API
echo Starting MT4 REST API...
start cmd /k "title MT4 REST API && echo Running from %MT4_API_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set USE_MOCK_MODE=true && set PORT=5002 && python "%MT4_API_DIR%\mt4_rest_api_implementation.py" 2> "%LOG_DIR%\mt4_rest_api_error.log""

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 2: Webhook API
echo Starting Webhook API...
start cmd /k "title Webhook API && echo Running from %WEBHOOK_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set WEBHOOK_API_PORT=5003 && set TELEGRAM_WEBHOOK_URL=http://localhost:5001/webhook && set MOCK_MODE=True && python "%WEBHOOK_DIR%\run_server.py" 2> "%LOG_DIR%\webhook_api_error.log""

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 3: Telegram Health Server
echo Starting Telegram Health Server...
start cmd /k "title Telegram Health && echo Running from %TELEGRAM_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && python "%TELEGRAM_DIR%\health_server.py" 2> "%LOG_DIR%\telegram_health_error.log""

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 4: Telegram Bot
echo Starting Telegram Bot...
start cmd /k "title Telegram Bot && echo Running from %TELEGRAM_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && set PYTHONPATH=%PROJECT_ROOT% && set MT4_API_URL=http://localhost:5002/api && set FLASK_PORT=5001 && set MOCK_MODE=True && python "%TELEGRAM_DIR%\run.py" 2> "%LOG_DIR%\telegram_bot_error.log""

echo.
echo All components started!
echo.
echo MT4 REST API running on port 5002
echo Webhook API running on port 5003
echo Telegram Health Server running on port 5001
echo Telegram Bot running in background
echo.
echo Checking service health (please wait)...

rem Wait a moment for services to start
timeout /t 5 > nul

rem Check if services are healthy
set "ALL_HEALTHY=true"

rem Check MT4 API health
curl -s http://localhost:5002/api/health > nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: MT4 API health check failed
    set "ALL_HEALTHY=false"
) else (
    echo MT4 API: Healthy
)

rem Check Webhook API health
curl -s http://localhost:5003/health > nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Webhook API health check failed
    set "ALL_HEALTHY=false"
) else (
    echo Webhook API: Healthy
)

rem Check Telegram Health Server
curl -s http://localhost:5001/health > nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Telegram Health Server health check failed
    set "ALL_HEALTHY=false"
) else (
    echo Telegram Health Server: Healthy
)

if "%ALL_HEALTHY%"=="true" (
    echo.
    echo All services are healthy!
) else (
    echo.
    echo WARNING: Some services may not be running correctly.
    echo Check error logs in %LOG_DIR% for more information.
)

echo.
echo Press any key to exit this window (services will continue running)
pause
exit /b 0

:error
echo.
echo ERROR: Failed to start services. Please check paths and configuration.
echo.
echo Press any key to exit...
pause
exit /b 1