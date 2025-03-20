@echo off
echo Starting SoloTrend X System Components...

rem Get the current directory and fix path issues
set "PROJECT_ROOT=%~dp0"
echo Project root: %PROJECT_ROOT%

rem Define the virtual environment path
set "VENV_DIR=%PROJECT_ROOT%environment\python\venv"
echo Virtual environment: %VENV_DIR%

rem Check if virtual environment exists, if not create it
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo Virtual environment not found. Creating...
    mkdir "%PROJECT_ROOT%environment\python" 2>nul
    python -m venv "%VENV_DIR%"
    call "%VENV_DIR%\Scripts\activate.bat"
    echo Installing requirements...
    pip install -r "%PROJECT_ROOT%requirements.txt"
    deactivate
    echo Virtual environment setup complete.
)

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
start cmd /k "title MT4 REST API && cd /d "%MT4_API_DIR%" && echo Current dir: %cd% && echo Activating venv: %VENV_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && echo PYTHONPATH=%PROJECT_ROOT% && set "PYTHONPATH=%PROJECT_ROOT%" && set "USE_MOCK_MODE=true" && set "PORT=5002" && echo Running python mt4_rest_api_implementation.py && python mt4_rest_api_implementation.py"

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 2: Webhook API
echo Starting Webhook API...
start cmd /k "title Webhook API && cd /d "%WEBHOOK_DIR%" && echo Current dir: %cd% && echo Activating venv: %VENV_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && echo PYTHONPATH=%PROJECT_ROOT% && set "PYTHONPATH=%PROJECT_ROOT%" && set "FLASK_APP=src.backend.webhook_api.app" && set "FLASK_DEBUG=True" && set "FLASK_PORT=5003" && set "TELEGRAM_WEBHOOK_URL=http://localhost:5001/webhook" && set "MOCK_MODE=True" && echo Running python run_server.py && python run_server.py"

rem Wait a moment before starting the next component
timeout /t 3

rem Start component 3: Telegram Connector
echo Starting Telegram Connector...
start cmd /k "title Telegram Connector && cd /d "%TELEGRAM_DIR%" && echo Current dir: %cd% && echo Activating venv: %VENV_DIR% && call "%VENV_DIR%\Scripts\activate.bat" && echo PYTHONPATH=%PROJECT_ROOT% && set "PYTHONPATH=%PROJECT_ROOT%" && set "FLASK_APP=src.backend.telegram_connector.app" && set "FLASK_DEBUG=True" && set "FLASK_PORT=5001" && set "MT4_API_URL=http://localhost:5002/api" && echo Running python run.py && python run.py"

echo All components started!
echo MT4 REST API running in first window
echo Webhook API running in second window
echo Telegram Connector running in third window
echo.
echo Logs are being saved to:
echo - %LOG_DIR%\mt4_rest_api.log
echo - %LOG_DIR%\webhook_api.log
echo - %LOG_DIR%\telegram_connector.log
echo.
echo Press any key to exit this window (services will continue running)
pause