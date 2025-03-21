@echo off
setlocal enabledelayedexpansion

echo ==== SoloTrend X Service Check ====
echo Checking all system services...
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
set "MT4_API_PORT=5002"
set "WEBHOOK_API_PORT=5003"
set "TELEGRAM_PORT=5005"

if exist "%PROJECT_ROOT%.env" (
    echo Reading port settings from .env file...
    
    rem Parse the .env file for port settings
    for /f "tokens=1,* delims==" %%a in ('type "%PROJECT_ROOT%.env" ^| findstr "PORT"') do (
        if "%%a"=="WEBHOOK_API_PORT" set "WEBHOOK_API_PORT=%%b"
        if "%%a"=="FLASK_PORT" set "TELEGRAM_PORT=%%b"
        if "%%a"=="PORT" set "MT4_API_PORT=%%b"
    )
)

echo Using port configuration:
echo - MT4 API Port: %MT4_API_PORT%
echo - Webhook API Port: %WEBHOOK_API_PORT%
echo - Telegram Port: %TELEGRAM_PORT%

rem Activate virtual environment and run the test script
echo Using virtual environment at %VENV_DIR%
call "%VENV_DIR%\Scripts\activate.bat"
set "PYTHONPATH=%PROJECT_ROOT%"

rem Export environment variables for the test script
set "PORT=%MT4_API_PORT%"
set "WEBHOOK_API_PORT=%WEBHOOK_API_PORT%"
set "FLASK_PORT=%TELEGRAM_PORT%"

echo Running service connection test...
python "%PROJECT_ROOT%scripts\test_services.py" > "%LOG_DIR%\service_check.log" 2>&1

rem Display the results
type "%LOG_DIR%\service_check.log"

echo.
if %ERRORLEVEL% EQU 0 (
    echo Service Check: SUCCESS
    echo All services are running and properly connected.
) else (
    echo Service Check: FAILED
    echo One or more services are not running or connections are broken.
    echo See the detailed log above for troubleshooting information.
)

pause