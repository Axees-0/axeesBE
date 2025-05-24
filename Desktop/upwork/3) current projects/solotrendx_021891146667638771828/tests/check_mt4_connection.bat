@echo off
setlocal enabledelayedexpansion

echo ==== MT4 Connection Test ====
echo Checking connection to MT4 terminal...
echo.

rem Set up paths
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\\"
set "VENV_DIR=%PROJECT_ROOT%environment\python\venv"

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

rem Activate virtual environment and run the test script
echo Using virtual environment at %VENV_DIR%
call "%VENV_DIR%\Scripts\activate.bat"
set "PYTHONPATH=%PROJECT_ROOT%"

python "%PROJECT_ROOT%scripts\test_mt4_connection.py"

echo.
if %ERRORLEVEL% EQU 0 (
    echo MT4 Connection Test: SUCCESS
) else (
    echo MT4 Connection Test: FAILED
    echo Please ensure the MT4 terminal is running and properly configured.
)

pause