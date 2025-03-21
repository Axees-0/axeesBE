@echo off
setlocal enabledelayedexpansion

echo ==== SoloTrend X Test Signal ====
echo Sending a test signal to the webhook API...
echo.

rem Set up paths
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\\"
set "VENV_DIR=%PROJECT_ROOT%environment\python\venv"
set "LOG_DIR=%PROJECT_ROOT%data\logs"

rem Ensure log directory exists
if not exist "%LOG_DIR%" (
    mkdir "%LOG_DIR%"
    echo Created log directory
)

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
        pause
        exit /b 1
    )
)

rem Try to read from .env file if it exists
set "WEBHOOK_API_PORT=5003"

if exist "%PROJECT_ROOT%.env" (
    echo Reading port settings from .env file...
    
    rem Parse the .env file for port settings
    for /f "tokens=1,* delims==" %%a in ('type "%PROJECT_ROOT%.env" ^| findstr "WEBHOOK_API_PORT"') do (
        if "%%a"=="WEBHOOK_API_PORT" set "WEBHOOK_API_PORT=%%b"
    )
)

echo Using Webhook API Port: %WEBHOOK_API_PORT%

rem Activate virtual environment and run the test script
echo Using virtual environment at %VENV_DIR%
call "%VENV_DIR%\Scripts\activate.bat"
set "PYTHONPATH=%PROJECT_ROOT%"

rem Ask user which test they want to run
echo.
echo Choose a test type:
echo 1. Send signal to webhook API (will trigger Telegram notification)
echo 2. Send signal directly to MT4 API (will create trade in MT4)
echo.
set /p test_type="Enter your choice (1 or 2): "

if "%test_type%"=="1" (
    echo.
    echo Sending signal to webhook API...
    python "%PROJECT_ROOT%scripts\generate_test_signal.py" --url "http://localhost:%WEBHOOK_API_PORT%/webhook" --verbose
) else if "%test_type%"=="2" (
    echo.
    echo Sending signal directly to MT4 API...
    python "%PROJECT_ROOT%scripts\generate_test_signal.py" --url "http://localhost:%WEBHOOK_API_PORT%/webhook" --direct --verbose
) else (
    echo.
    echo Invalid choice. Please enter 1 or 2.
    pause
    exit /b 1
)

echo.
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Test Signal: SUCCESS
    echo.
    echo Next steps:
    if "%test_type%"=="1" (
        echo 1. Check your Telegram bot for the signal notification
        echo 2. Verify the signal details are correct
        echo 3. Try executing the trade from Telegram
    ) else (
        echo 1. Check your MT4 terminal for the new order
        echo 2. Verify the order details are correct
    )
) else (
    echo.
    echo Test Signal: FAILED
    echo.
    echo Troubleshooting:
    echo 1. Make sure all services are running (use check_services.bat)
    echo 2. Check the logs in data\logs directory
    echo 3. Verify MT4 terminal is connected (use check_mt4_connection.bat)
)

pause