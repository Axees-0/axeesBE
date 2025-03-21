@echo off
setlocal enabledelayedexpansion

echo ============== PATH DIAGNOSTIC TOOL ==============
echo.
echo This script will diagnose path and file issues
echo.

rem Get the current directory structure
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\\"

echo Script directory: %SCRIPT_DIR%
echo Project root: %PROJECT_ROOT%

rem Create a log file
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a%%b)
set "LOG_FILE=%SCRIPT_DIR%path_diagnostic_%mydate%_%mytime%.log"
echo Creating log file: %LOG_FILE%
echo PATH DIAGNOSTIC REPORT > "%LOG_FILE%"
echo Run at: %date% %time% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

echo ============== CHECKING DIRECTORY STRUCTURE ==============
echo Listing key directories to verify structure...
echo.

echo Checking project root...
dir /b "%PROJECT_ROOT%" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Project root not accessible: %PROJECT_ROOT%
    echo ERROR: Project root not accessible: %PROJECT_ROOT% >> "%LOG_FILE%"
) else (
    echo Project root directory is accessible
    echo Project root directory contains: >> "%LOG_FILE%"
    dir /b "%PROJECT_ROOT%" >> "%LOG_FILE%"
)
echo.

echo Checking src directory...
if exist "%PROJECT_ROOT%src" (
    echo src directory exists
    echo src directory exists >> "%LOG_FILE%"
    dir /b "%PROJECT_ROOT%src" >> "%LOG_FILE%"
) else (
    echo ERROR: src directory not found
    echo ERROR: src directory not found >> "%LOG_FILE%"
)
echo.

echo Checking backend directory...
if exist "%PROJECT_ROOT%src\backend" (
    echo backend directory exists
    echo backend directory exists >> "%LOG_FILE%"
    dir /b "%PROJECT_ROOT%src\backend" >> "%LOG_FILE%"
) else (
    echo ERROR: backend directory not found
    echo ERROR: backend directory not found >> "%LOG_FILE%"
)
echo.

echo ============== CHECKING COMPONENT PATHS ==============
echo.

set "MT4_API_DIR=%PROJECT_ROOT%src\backend\MT4RestfulAPIWrapper"
set "WEBHOOK_DIR=%PROJECT_ROOT%src\backend\webhook_api"
set "TELEGRAM_DIR=%PROJECT_ROOT%src\backend\telegram_connector"

echo MT4 API Directory: %MT4_API_DIR%
echo Webhook Directory: %WEBHOOK_DIR%
echo Telegram Directory: %TELEGRAM_DIR%
echo.

echo Checking MT4 API directory...
if exist "%MT4_API_DIR%" (
    echo MT4 API directory exists
    echo MT4 API directory exists >> "%LOG_FILE%"
    echo Contents: >> "%LOG_FILE%"
    dir /b "%MT4_API_DIR%" >> "%LOG_FILE%"
) else (
    echo ERROR: MT4 API directory not found
    echo ERROR: MT4 API directory not found >> "%LOG_FILE%"
)
echo.

echo Checking webhook directory...
if exist "%WEBHOOK_DIR%" (
    echo Webhook directory exists
    echo Webhook directory exists >> "%LOG_FILE%"
    echo Contents: >> "%LOG_FILE%"
    dir /b "%WEBHOOK_DIR%" >> "%LOG_FILE%"
) else (
    echo ERROR: Webhook directory not found
    echo ERROR: Webhook directory not found >> "%LOG_FILE%"
)
echo.

echo Checking telegram directory...
if exist "%TELEGRAM_DIR%" (
    echo Telegram directory exists
    echo Telegram directory exists >> "%LOG_FILE%"
    echo Contents: >> "%LOG_FILE%"
    dir /b "%TELEGRAM_DIR%" >> "%LOG_FILE%"
) else (
    echo ERROR: Telegram directory not found
    echo ERROR: Telegram directory not found >> "%LOG_FILE%"
)
echo.

echo ============== CHECKING KEY FILES ==============
echo.

echo Checking MT4 API direct_run.py...
if exist "%MT4_API_DIR%\direct_run.py" (
    echo MT4 API direct_run.py exists
    echo MT4 API direct_run.py exists >> "%LOG_FILE%"
) else (
    echo ERROR: MT4 API direct_run.py not found
    echo ERROR: MT4 API direct_run.py not found >> "%LOG_FILE%"
)
echo.

echo Checking webhook run_server.py...
if exist "%WEBHOOK_DIR%\run_server.py" (
    echo Webhook run_server.py exists
    echo Webhook run_server.py exists >> "%LOG_FILE%"
) else (
    echo ERROR: Webhook run_server.py not found
    echo ERROR: Webhook run_server.py not found >> "%LOG_FILE%"
)
echo.

echo Checking telegram run.py...
if exist "%TELEGRAM_DIR%\run.py" (
    echo Telegram run.py exists
    echo Telegram run.py exists >> "%LOG_FILE%"
) else (
    echo ERROR: Telegram run.py not found
    echo ERROR: Telegram run.py not found >> "%LOG_FILE%"
)
echo.

echo Checking .env file...
if exist "%PROJECT_ROOT%.env" (
    echo .env file exists
    echo .env file exists >> "%LOG_FILE%"
    echo Environment variables in .env file: >> "%LOG_FILE%"
    findstr /i "PORT FLASK_PORT WEBHOOK_API_PORT USE_MOCK_MODE MOCK_MODE" "%PROJECT_ROOT%.env" >> "%LOG_FILE%"
) else (
    echo ERROR: .env file not found
    echo ERROR: .env file not found >> "%LOG_FILE%"
)
echo.

echo ============== CHECKING DLL FILES ==============
echo.

echo Checking MT4 API DLL files...
if exist "%MT4_API_DIR%\mtmanapi.dll" (
    echo mtmanapi.dll exists
    echo mtmanapi.dll exists >> "%LOG_FILE%"
) else (
    echo ERROR: mtmanapi.dll not found
    echo ERROR: mtmanapi.dll not found >> "%LOG_FILE%"
)

if exist "%MT4_API_DIR%\mtmanapi64.dll" (
    echo mtmanapi64.dll exists
    echo mtmanapi64.dll exists >> "%LOG_FILE%"
) else (
    echo ERROR: mtmanapi64.dll not found
    echo ERROR: mtmanapi64.dll not found >> "%LOG_FILE%"
)
echo.

echo ============== CHECKING VIRTUAL ENVIRONMENT ==============
echo.

set "VENV_DIR=%PROJECT_ROOT%environment\python\venv"
echo Primary virtual environment path: %VENV_DIR%

if exist "%VENV_DIR%" (
    echo Primary virtual environment exists
    echo Primary virtual environment exists >> "%LOG_FILE%"
) else (
    echo WARNING: Primary virtual environment not found
    echo WARNING: Primary virtual environment not found >> "%LOG_FILE%"
    
    if exist "%PROJECT_ROOT%venv" (
        echo Found alternative virtual environment at %PROJECT_ROOT%venv
        echo Found alternative virtual environment at %PROJECT_ROOT%venv >> "%LOG_FILE%"
        set "VENV_DIR=%PROJECT_ROOT%venv"
    ) else if exist "%SCRIPT_DIR%venv" (
        echo Found alternative virtual environment at %SCRIPT_DIR%venv
        echo Found alternative virtual environment at %SCRIPT_DIR%venv >> "%LOG_FILE%"
        set "VENV_DIR=%SCRIPT_DIR%venv"
    ) else (
        echo ERROR: No virtual environment found
        echo ERROR: No virtual environment found >> "%LOG_FILE%"
    )
)

if exist "%VENV_DIR%\Scripts\activate.bat" (
    echo Virtual environment activation script exists
    echo Virtual environment activation script exists >> "%LOG_FILE%"
) else (
    echo ERROR: Virtual environment activation script not found
    echo ERROR: Virtual environment activation script not found >> "%LOG_FILE%"
)
echo.

echo ============== SUMMARY ==============
echo.
echo Diagnostic complete! See log file at: %LOG_FILE%
echo.
echo Next steps:
echo 1. Check the log file for any errors
echo 2. Fix any missing files or directories
echo 3. Verify Python is installed and properly configured
echo 4. Check that your project structure matches expectations
echo.
echo Press any key to exit...
pause