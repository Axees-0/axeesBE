@echo off
REM SoloTrend X Setup Helper
REM This batch file helps install Python and set up the environment

echo ===============================================
echo SoloTrend X Windows Setup Helper
echo ===============================================
echo.

REM Check if Python is already installed
python --version > nul 2>&1
if %errorlevel% equ 0 (
    echo Python is already installed.
    python --version
    goto :PYTHON_INSTALLED
)

echo Python is not installed or not in your PATH.
echo.
echo How would you like to proceed?
echo 1. Download and install Python automatically
echo 2. Open Microsoft Store to install Python
echo 3. Skip Python installation (if you want to install it manually)
echo.

set /p choice="Enter your choice (1, 2, or 3): "

if "%choice%"=="1" (
    echo Downloading Python installer...
    curl -L -o python_installer.exe https://www.python.org/ftp/python/3.10.10/python-3.10.10-amd64.exe
    
    if %errorlevel% neq 0 (
        echo Failed to download Python installer.
        echo Please try manually downloading from: https://www.python.org/downloads/windows/
        goto :ERROR
    )
    
    echo Running Python installer...
    echo IMPORTANT: Make sure to check "Add Python to PATH" during installation!
    python_installer.exe /quiet InstallAllUsers=1 PrependPath=1
    
    echo Waiting for installation to complete...
    timeout /t 30
    
    echo Cleaning up...
    del python_installer.exe
    
    echo Checking Python installation...
    python --version
    if %errorlevel% neq 0 (
        echo.
        echo Python was not added to PATH.
        echo Please restart your computer and try again.
        goto :ERROR
    )
) else if "%choice%"=="2" (
    echo Opening Microsoft Store...
    start ms-windows-store://pdp/?ProductId=9PJPW5LDXLZ5
    
    echo Please install Python from the Microsoft Store and then press any key to continue...
    pause
    
    echo Checking Python installation...
    python --version
    if %errorlevel% neq 0 (
        echo.
        echo Python was not added to PATH.
        echo Please restart your computer and try again.
        goto :ERROR
    )
) else if "%choice%"=="3" (
    echo Skipping Python installation...
    echo Please install Python manually from: https://www.python.org/downloads/windows/
    goto :ERROR
) else (
    echo Invalid choice. Please run the script again.
    goto :ERROR
)

:PYTHON_INSTALLED
echo.
echo Python is installed successfully!
echo.

REM Create necessary directories
echo Creating logs directory...
mkdir data\logs 2>nul

REM Create environment variables file
echo Creating .env file...
echo # SoloTrend X Environment Variables > .env
echo MT4_API_URL=http://localhost:5003/api >> .env
echo WEBHOOK_API_URL=http://localhost:5000 >> .env
echo TELEGRAM_CONNECTOR_URL=http://localhost:5001 >> .env
echo MT4_SERVER=demo.metaquotes.com >> .env
echo MT4_LOGIN=80001413 >> .env
echo MT4_PASSWORD=9K63%%M?d?cTP >> .env
echo USE_REAL_MT4=true >> .env
echo TELEGRAM_BOT_TOKEN= >> .env
echo TELEGRAM_CHAT_ID= >> .env

REM Install pip if needed and upgrade
echo Installing/upgrading pip...
python -m ensurepip --upgrade
python -m pip install --upgrade pip

REM Install required packages
echo Installing required packages...
python -m pip install flask==2.2.3 python-telegram-bot==13.7 python-dotenv==0.19.2 requests==2.28.2 pyjwt==2.6.0 flask-cors==3.0.10

REM Create MT4 API starter batch file
echo Creating MT4 API starter batch file...
echo @echo off > start_mt4_api.bat
echo echo Starting MT4 API service... >> start_mt4_api.bat
echo python scripts\start_mt4_api.py --server demo.metaquotes.com --login 80001413 --password "9K63%%M?d?cTP" --port 5003 >> start_mt4_api.bat

REM Create webhook API starter batch file
echo Creating Webhook API starter batch file...
echo @echo off > start_webhook_api.bat
echo echo Starting Webhook API service... >> start_webhook_api.bat
echo set FLASK_APP=src.backend.webhook_api.app >> start_webhook_api.bat
echo set FLASK_PORT=5000 >> start_webhook_api.bat
echo set TELEGRAM_WEBHOOK_URL=http://localhost:5001/webhook >> start_webhook_api.bat
echo python -m src.backend.mt4_mock_api.run_server --port 5000 >> start_webhook_api.bat

REM Create all services starter batch file
echo Creating all services starter batch file...
echo @echo off > start_all_services.bat
echo echo Starting SoloTrend X services... >> start_all_services.bat
echo. >> start_all_services.bat
echo rem Start MT4 API service >> start_all_services.bat
echo start "MT4 API" cmd /c start_mt4_api.bat >> start_all_services.bat
echo. >> start_all_services.bat
echo rem Wait for MT4 API to start >> start_all_services.bat
echo echo Waiting for MT4 API to start... >> start_all_services.bat
echo timeout /t 5 >> start_all_services.bat
echo. >> start_all_services.bat
echo rem Start Webhook API service >> start_all_services.bat
echo start "Webhook API" cmd /c start_webhook_api.bat >> start_all_services.bat
echo. >> start_all_services.bat
echo echo All services started! >> start_all_services.bat
echo echo MT4 API: http://localhost:5003/api >> start_all_services.bat
echo echo Webhook API: http://localhost:5000 >> start_all_services.bat

echo.
echo ===============================================
echo Setup completed successfully!
echo ===============================================
echo.
echo Next steps:
echo 1. Install MT4 Terminal using CloudTrader.4.terminal.setup.exe
echo 2. Run start_all_services.bat to start all services
echo 3. Check services are running at:
echo    - MT4 API: http://localhost:5003/api/health
echo    - Webhook API: http://localhost:5000/health
echo.
echo For more information, see the PRODUCTION_SETUP.md file
echo.
pause
exit /b 0

:ERROR
echo.
echo Setup encountered an error. Please fix the issues and try again.
echo.
pause
exit /b 1