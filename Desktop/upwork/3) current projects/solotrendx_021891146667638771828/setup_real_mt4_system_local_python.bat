@echo off
REM SoloTrend X Real MT4 Production Setup using local Python
REM This script sets up a real MT4 production environment on Windows

echo ===============================================
echo SoloTrend X Real MT4 Production Setup
echo ===============================================
echo.

REM Configuration
set MT4_SERVER=demo.metaquotes.com
set MT4_LOGIN=80001413
set MT4_PASSWORD=9K63%%M?d?cTP
set PROJECT_ROOT=%CD%
set DATA_LOGS_DIR=%PROJECT_ROOT%\data\logs
set MT4_API_PORT=5003
set WEBHOOK_API_PORT=5000
set TELEGRAM_PORT=5001
set MT4_DLL_DEST=%PROJECT_ROOT%\src\backend\MT4RestfulAPIWrapper

REM Define local Python path - this is the key change
set PYTHON_EXE=%PROJECT_ROOT%\venv\python-3.13.2-amd64.exe
if not exist "%PYTHON_EXE%" (
    echo Looking for Python executable in venv...
    set PYTHON_EXE=%PROJECT_ROOT%\environment\python\python.exe
)
if not exist "%PYTHON_EXE%" (
    echo Looking for Python executable in environment/python...
    for /r "%PROJECT_ROOT%\environment\python" %%f in (python.exe) do (
        set PYTHON_EXE=%%f
        goto :FOUND_PYTHON
    )
)
if not exist "%PYTHON_EXE%" (
    for /r "%PROJECT_ROOT%\venv" %%f in (python.exe) do (
        set PYTHON_EXE=%%f
        goto :FOUND_PYTHON
    )
)

if not exist "%PYTHON_EXE%" (
    echo ERROR: Python executable not found in project directories.
    echo Please specify the path to Python executable.
    set /p PYTHON_EXE="Enter full path to python.exe: "
    
    if not exist "!PYTHON_EXE!" (
        echo ERROR: The specified Python executable does not exist.
        goto :ERROR
    )
)

:FOUND_PYTHON
echo Using Python from: %PYTHON_EXE%

REM Create logs directory
if not exist "%DATA_LOGS_DIR%" (
    echo Creating logs directory...
    mkdir "%DATA_LOGS_DIR%"
)

REM Check Python version
"%PYTHON_EXE%" -c "import sys; print(f'Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"
if %errorlevel% neq 0 (
    echo ERROR: Failed to run Python. Please check the Python installation.
    goto :ERROR
)

REM Verify MT4 Terminal installation
set MT4_TERMINAL_PATH=%APPDATA%\MetaQuotes\Terminal
if not exist "%MT4_TERMINAL_PATH%" (
    echo MT4 Terminal not found. Installing now...
    
    set MT4_INSTALLER=%PROJECT_ROOT%\src\backend\CloudTrader.4.terminal.setup.exe
    if not exist "%MT4_INSTALLER%" (
        echo ERROR: MT4 installer not found at %MT4_INSTALLER%
        echo Please download the MT4 installer and place it in src/backend/
        goto :ERROR
    )
    
    echo Installing MT4 Terminal...
    echo IMPORTANT: When prompted, use these credentials:
    echo   Server: %MT4_SERVER%
    echo   Login: %MT4_LOGIN%
    echo   Password: %MT4_PASSWORD%
    
    echo Press any key to start the MT4 installation...
    pause >nul
    
    start /wait "" "%MT4_INSTALLER%"
    
    if not exist "%MT4_TERMINAL_PATH%" (
        echo ERROR: MT4 installation failed or was cancelled.
        goto :ERROR
    )
    
    echo MT4 Terminal installed successfully.
) else (
    echo MT4 Terminal found at %MT4_TERMINAL_PATH%
)

REM Find the MT4 terminal folder
set MT4_FOLDER=
for /d %%d in ("%MT4_TERMINAL_PATH%\*") do (
    if exist "%%d\MQL4" set MT4_FOLDER=%%d
)

if "%MT4_FOLDER%"=="" (
    echo ERROR: Could not find MT4 terminal folder.
    echo Please run MT4 Terminal at least once to create the folder.
    goto :ERROR
)

echo Using MT4 terminal folder: %MT4_FOLDER%

REM Check for MT4 Manager API DLL
set MT4_DLL_SOURCE=%MT4_FOLDER%\mtmanapi.dll
if not exist "%MT4_DLL_SOURCE%" (
    echo WARNING: MT4 Manager API DLL not found in MT4 folder.
    echo Looking for DLL in project directory...
    
    set MT4_DLL_SOURCE=%PROJECT_ROOT%\src\backend\MT4ManagerAPI\mtmanapi.dll
    if not exist "%MT4_DLL_SOURCE%" (
        echo ERROR: MT4 Manager API DLL not found in project directory.
        echo Please ensure MT4 Manager API is installed.
        goto :ERROR
    )
)

REM Create MT4 API wrapper directory if it doesn't exist
if not exist "%MT4_DLL_DEST%" (
    echo Creating MT4 API wrapper directory...
    mkdir "%MT4_DLL_DEST%"
)

REM Copy MT4 Manager API DLL to project
echo Copying MT4 Manager API DLL to project...
copy "%MT4_DLL_SOURCE%" "%MT4_DLL_DEST%\mtmanapi.dll"
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy MT4 Manager API DLL.
    goto :ERROR
)

REM Install required Python packages
echo Installing required Python packages...
"%PYTHON_EXE%" -m pip install flask==2.2.3 python-telegram-bot==13.7 python-dotenv==0.19.2 requests==2.28.2 pyjwt==2.6.0 flask-cors==3.0.10

REM Create .env file
echo Creating .env file...
echo # SoloTrend X Environment Variables > .env
echo MT4_SERVER=%MT4_SERVER% >> .env
echo MT4_LOGIN=%MT4_LOGIN% >> .env
echo MT4_PASSWORD=%MT4_PASSWORD% >> .env
echo MT4_API_URL=http://localhost:%MT4_API_PORT%/api >> .env
echo WEBHOOK_API_URL=http://localhost:%WEBHOOK_API_PORT% >> .env
echo TELEGRAM_CONNECTOR_URL=http://localhost:%TELEGRAM_PORT% >> .env
echo USE_REAL_MT4=true >> .env
echo TELEGRAM_BOT_TOKEN= >> .env
echo TELEGRAM_CHAT_ID= >> .env
echo SECRET_KEY=production-secret-key-change-me >> .env
echo API_ADMIN_USERNAME=admin >> .env
echo API_ADMIN_PASSWORD=password >> .env

echo .env file created with MT4 credentials.
echo IMPORTANT: Edit .env to add your Telegram bot token and chat ID.

REM Create start_mt4_api.bat
echo Creating MT4 API starter batch file...
echo @echo off > start_mt4_api.bat
echo echo Starting MT4 API service with REAL MT4 terminal... >> start_mt4_api.bat
echo set PYTHON_EXE=%PYTHON_EXE% >> start_mt4_api.bat
echo set MT4_SERVER=%MT4_SERVER% >> start_mt4_api.bat
echo set MT4_LOGIN=%MT4_LOGIN% >> start_mt4_api.bat
echo set MT4_PASSWORD=%MT4_PASSWORD% >> start_mt4_api.bat
echo set USE_MOCK_MODE=false >> start_mt4_api.bat
echo set PORT=%MT4_API_PORT% >> start_mt4_api.bat
echo "%%PYTHON_EXE%%" -m src.backend.MT4RestfulAPIWrapper.mt4_rest_api_implementation >> start_mt4_api.bat

REM Create start_webhook_api.bat
echo Creating Webhook API starter batch file...
echo @echo off > start_webhook_api.bat
echo echo Starting Webhook API service... >> start_webhook_api.bat
echo set PYTHON_EXE=%PYTHON_EXE% >> start_webhook_api.bat
echo set FLASK_APP=src.backend.webhook_api.app >> start_webhook_api.bat
echo set FLASK_DEBUG=False >> start_webhook_api.bat
echo set FLASK_PORT=%WEBHOOK_API_PORT% >> start_webhook_api.bat
echo set TELEGRAM_WEBHOOK_URL=http://localhost:%TELEGRAM_PORT%/webhook >> start_webhook_api.bat
echo "%%PYTHON_EXE%%" -m flask run --host=0.0.0.0 --port=%WEBHOOK_API_PORT% >> start_webhook_api.bat

REM Create start_telegram_connector.bat
echo Creating Telegram connector starter batch file...
echo @echo off > start_telegram_connector.bat
echo echo Starting Telegram Connector service... >> start_telegram_connector.bat
echo set PYTHON_EXE=%PYTHON_EXE% >> start_telegram_connector.bat
echo set FLASK_APP=src.backend.telegram_connector.app >> start_telegram_connector.bat
echo set FLASK_PORT=%TELEGRAM_PORT% >> start_telegram_connector.bat
echo "%%PYTHON_EXE%%" -m flask run --host=0.0.0.0 --port=%TELEGRAM_PORT% >> start_telegram_connector.bat

REM Create combined service starter
echo Creating all services starter batch file...
echo @echo off > start_all_services.bat
echo echo Starting SoloTrend X services with REAL MT4 terminal... >> start_all_services.bat
echo set PYTHON_EXE=%PYTHON_EXE% >> start_all_services.bat
echo. >> start_all_services.bat
echo REM Check if MT4 Terminal is running >> start_all_services.bat
echo echo Checking MT4 Terminal... >> start_all_services.bat
echo tasklist /FI "IMAGENAME eq terminal.exe" | find "terminal.exe" > nul >> start_all_services.bat
echo if %%errorlevel%% neq 0 ( >> start_all_services.bat
echo    echo WARNING: MT4 Terminal is not running! >> start_all_services.bat
echo    echo Please start MT4 Terminal and log in before proceeding. >> start_all_services.bat
echo    pause >> start_all_services.bat
echo ) >> start_all_services.bat
echo. >> start_all_services.bat
echo REM Start MT4 API service >> start_all_services.bat
echo start "MT4 API" cmd /c start_mt4_api.bat >> start_all_services.bat
echo. >> start_all_services.bat
echo REM Wait for MT4 API to start >> start_all_services.bat
echo echo Waiting for MT4 API to start... >> start_all_services.bat
echo timeout /t 5 >> start_all_services.bat
echo. >> start_all_services.bat
echo REM Start Webhook API service >> start_all_services.bat
echo start "Webhook API" cmd /c start_webhook_api.bat >> start_all_services.bat
echo. >> start_all_services.bat
echo REM Wait for Webhook API to start >> start_all_services.bat
echo echo Waiting for Webhook API to start... >> start_all_services.bat
echo timeout /t 5 >> start_all_services.bat
echo. >> start_all_services.bat
echo REM Start Telegram Connector service >> start_all_services.bat
echo start "Telegram Connector" cmd /c start_telegram_connector.bat >> start_all_services.bat
echo. >> start_all_services.bat
echo echo All services started! >> start_all_services.bat
echo echo MT4 API: http://localhost:%MT4_API_PORT%/api >> start_all_services.bat
echo echo Webhook API: http://localhost:%WEBHOOK_API_PORT% >> start_all_services.bat
echo echo Telegram Connector: http://localhost:%TELEGRAM_PORT% >> start_all_services.bat

REM Create test signal batch file
echo Creating test signal batch file...
echo @echo off > send_test_signal.bat
echo echo Sending test trading signal... >> send_test_signal.bat
echo set PYTHON_EXE=%PYTHON_EXE% >> send_test_signal.bat
echo "%%PYTHON_EXE%%" -c "import requests; import json; import random; signal = {'symbol': 'EURUSD', 'type': 'buy', 'login': %MT4_LOGIN%, 'price': round(random.uniform(1.05, 1.15), 5), 'sl': round(random.uniform(1.04, 1.05), 5), 'tp': round(random.uniform(1.15, 1.20), 5), 'volume': 0.01, 'comment': 'Test signal'}; print(f'Sending signal: {json.dumps(signal, indent=2)}'); response = requests.post('http://localhost:%MT4_API_PORT%/api/trades', json=signal, headers={'Authorization': 'Bearer ' + requests.post('http://localhost:%MT4_API_PORT%/api/auth/login', json={'username': 'admin', 'password': 'password'}).json()['data']['token']}); print(f'Response: {response.status_code}'); print(json.dumps(response.json(), indent=2))" >> send_test_signal.bat

REM Create a simple Python script to check system health
echo Creating system verification script...
echo import requests >> %PROJECT_ROOT%\scripts\verify_system.py
echo import sys >> %PROJECT_ROOT%\scripts\verify_system.py
echo import subprocess >> %PROJECT_ROOT%\scripts\verify_system.py
echo import platform >> %PROJECT_ROOT%\scripts\verify_system.py
echo import time >> %PROJECT_ROOT%\scripts\verify_system.py
echo. >> %PROJECT_ROOT%\scripts\verify_system.py
echo def check_service(url, name): >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print(f"Checking {name}...") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     try: >> %PROJECT_ROOT%\scripts\verify_system.py
echo         response = requests.get(url, timeout=5) >> %PROJECT_ROOT%\scripts\verify_system.py
echo         if response.status_code == 200: >> %PROJECT_ROOT%\scripts\verify_system.py
echo             print(f"[PASS] {name} is running") >> %PROJECT_ROOT%\scripts\verify_system.py
echo             return True >> %PROJECT_ROOT%\scripts\verify_system.py
echo         else: >> %PROJECT_ROOT%\scripts\verify_system.py
echo             print(f"[FAIL] {name} returned status code {response.status_code}") >> %PROJECT_ROOT%\scripts\verify_system.py
echo             return False >> %PROJECT_ROOT%\scripts\verify_system.py
echo     except Exception as e: >> %PROJECT_ROOT%\scripts\verify_system.py
echo         print(f"[FAIL] {name} is not running: {e}") >> %PROJECT_ROOT%\scripts\verify_system.py
echo         return False >> %PROJECT_ROOT%\scripts\verify_system.py
echo. >> %PROJECT_ROOT%\scripts\verify_system.py
echo def check_mt4_terminal(): >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print("Checking MT4 Terminal...") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     if platform.system() == "Windows": >> %PROJECT_ROOT%\scripts\verify_system.py
echo         try: >> %PROJECT_ROOT%\scripts\verify_system.py
echo             result = subprocess.run(["tasklist", "/FI", "IMAGENAME eq terminal.exe"], capture_output=True, text=True) >> %PROJECT_ROOT%\scripts\verify_system.py
echo             if "terminal.exe" in result.stdout: >> %PROJECT_ROOT%\scripts\verify_system.py
echo                 print("[PASS] MT4 Terminal is running") >> %PROJECT_ROOT%\scripts\verify_system.py
echo                 return True >> %PROJECT_ROOT%\scripts\verify_system.py
echo             else: >> %PROJECT_ROOT%\scripts\verify_system.py
echo                 print("[FAIL] MT4 Terminal is not running") >> %PROJECT_ROOT%\scripts\verify_system.py
echo                 return False >> %PROJECT_ROOT%\scripts\verify_system.py
echo         except Exception as e: >> %PROJECT_ROOT%\scripts\verify_system.py
echo             print(f"[FAIL] Error checking MT4 Terminal: {e}") >> %PROJECT_ROOT%\scripts\verify_system.py
echo             return False >> %PROJECT_ROOT%\scripts\verify_system.py
echo     else: >> %PROJECT_ROOT%\scripts\verify_system.py
echo         print("[WARN] MT4 Terminal check only works on Windows") >> %PROJECT_ROOT%\scripts\verify_system.py
echo         return False >> %PROJECT_ROOT%\scripts\verify_system.py
echo. >> %PROJECT_ROOT%\scripts\verify_system.py
echo def main(): >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print("SoloTrend X System Verification") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print("=============================") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print() >> %PROJECT_ROOT%\scripts\verify_system.py
echo. >> %PROJECT_ROOT%\scripts\verify_system.py
echo     mt4_running = check_mt4_terminal() >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print() >> %PROJECT_ROOT%\scripts\verify_system.py
echo. >> %PROJECT_ROOT%\scripts\verify_system.py
echo     # Check MT4 API >> %PROJECT_ROOT%\scripts\verify_system.py
echo     mt4_api_ok = check_service("http://localhost:%MT4_API_PORT%/api/health", "MT4 API") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print() >> %PROJECT_ROOT%\scripts\verify_system.py
echo. >> %PROJECT_ROOT%\scripts\verify_system.py
echo     # Check Webhook API >> %PROJECT_ROOT%\scripts\verify_system.py
echo     webhook_api_ok = check_service("http://localhost:%WEBHOOK_API_PORT%/health", "Webhook API") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print() >> %PROJECT_ROOT%\scripts\verify_system.py
echo. >> %PROJECT_ROOT%\scripts\verify_system.py
echo     # Check Telegram Connector >> %PROJECT_ROOT%\scripts\verify_system.py
echo     telegram_ok = check_service("http://localhost:%TELEGRAM_PORT%/health", "Telegram Connector") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print() >> %PROJECT_ROOT%\scripts\verify_system.py
echo. >> %PROJECT_ROOT%\scripts\verify_system.py
echo     # Summary >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print("=============================") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print("Verification Summary:") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print(f"MT4 Terminal: {'✓ OK' if mt4_running else '✗ NOT RUNNING'}") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print(f"MT4 API: {'✓ OK' if mt4_api_ok else '✗ NOT RUNNING'}") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print(f"Webhook API: {'✓ OK' if webhook_api_ok else '✗ NOT RUNNING'}") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print(f"Telegram Connector: {'✓ OK' if telegram_ok else '✗ NOT RUNNING'}") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     print() >> %PROJECT_ROOT%\scripts\verify_system.py
echo. >> %PROJECT_ROOT%\scripts\verify_system.py
echo     # Overall status >> %PROJECT_ROOT%\scripts\verify_system.py
echo     if mt4_running and mt4_api_ok and webhook_api_ok and telegram_ok: >> %PROJECT_ROOT%\scripts\verify_system.py
echo         print("✅ All services are running correctly!") >> %PROJECT_ROOT%\scripts\verify_system.py
echo         print("Try sending a test signal with send_test_signal.bat") >> %PROJECT_ROOT%\scripts\verify_system.py
echo     else: >> %PROJECT_ROOT%\scripts\verify_system.py
echo         print("❌ Some services are not running correctly.") >> %PROJECT_ROOT%\scripts\verify_system.py
echo         print("Please check the logs in data/logs/ directory.") >> %PROJECT_ROOT%\scripts\verify_system.py
echo. >> %PROJECT_ROOT%\scripts\verify_system.py
echo if __name__ == "__main__": >> %PROJECT_ROOT%\scripts\verify_system.py
echo     main() >> %PROJECT_ROOT%\scripts\verify_system.py
echo     input("Press Enter to exit...") >> %PROJECT_ROOT%\scripts\verify_system.py

REM Create verification batch file
echo Creating system verification batch file...
echo @echo off > verify_system.bat
echo echo Running system verification... >> verify_system.bat
echo set PYTHON_EXE=%PYTHON_EXE% >> verify_system.bat
echo "%%PYTHON_EXE%%" scripts\verify_system.py >> verify_system.bat

echo.
echo ===============================================
echo SoloTrend X Real MT4 Production Setup Complete!
echo ===============================================
echo.
echo The following batch files have been created:
echo 1. start_mt4_api.bat - Starts the REAL MT4 API
echo 2. start_webhook_api.bat - Starts the Webhook API
echo 3. start_telegram_connector.bat - Starts the Telegram Connector
echo 4. start_all_services.bat - Starts all services
echo 5. send_test_signal.bat - Sends a test trading signal
echo 6. verify_system.bat - Verifies the system is running correctly
echo.
echo IMPORTANT NEXT STEPS:
echo ---------------------
echo 1. Ensure MT4 Terminal is running and logged in with:
echo    Server: %MT4_SERVER%
echo    Login: %MT4_LOGIN%
echo    Password: %MT4_PASSWORD%
echo.
echo 2. Add your Telegram bot token and chat ID to .env file
echo.
echo 3. Run start_all_services.bat to start all components
echo.
echo 4. Run verify_system.bat to confirm everything is working
echo.
echo 5. Run send_test_signal.bat to test real trading functionality
echo.
echo Python executable used: %PYTHON_EXE%
echo.
pause
exit /b 0

:ERROR
echo.
echo Setup encountered an error. Please fix the issues and try again.
echo.
pause
exit /b 1