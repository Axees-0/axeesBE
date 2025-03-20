@echo off
echo Sending test signal to SoloTrend X system...
echo.

rem Get the current directory and fix path issues
set "PROJECT_ROOT=%~dp0"
echo Project root: %PROJECT_ROOT%

rem Define the virtual environment path
set "VENV_DIR=%PROJECT_ROOT%environment\python\venv"
echo Virtual environment: %VENV_DIR%

rem Check if virtual environment exists
if not exist "%VENV_DIR%" (
    echo Virtual environment not found. Please run setup_venv.bat first.
    pause
    exit /b 1
)

rem Activate virtual environment
call "%VENV_DIR%\Scripts\activate.bat"

rem Use the same ports as defined in start_all_services.bat
set WEBHOOK_API_PORT=5003
set TELEGRAM_PORT=5001
set MT4_API_PORT=5002

rem First verify all services are running
echo Verifying services are running before sending test signal...

echo 1. Checking MT4 REST API (port %MT4_API_PORT%)...
curl -s http://localhost:%MT4_API_PORT%/api/health
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: MT4 REST API is not running! Please start services with start_all_services.bat
    pause
    exit /b 1
)

echo 2. Checking Webhook API (port %WEBHOOK_API_PORT%)...
curl -s http://localhost:%WEBHOOK_API_PORT%/health
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Webhook API is not running! Please start services with start_all_services.bat
    pause
    exit /b 1
)

echo 3. Checking Telegram Connector (port %TELEGRAM_PORT%)...
curl -s http://localhost:%TELEGRAM_PORT%/health
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Telegram Connector is not running! Please start services with start_all_services.bat
    pause
    exit /b 1
)

echo All services are running! Sending test trading signal...
echo.

rem Send the test signal with proper formatting
curl -X POST http://localhost:%WEBHOOK_API_PORT%/webhook/tradingview ^
     -H "Content-Type: application/json" ^
     -d "{\"symbol\":\"EURUSD\",\"side\":\"BUY\",\"price\":1.1234,\"sl\":1.1200,\"tp1\":1.1300,\"strategy\":\"SoloTrend X Test\"}"
echo.
echo.

echo Test signal sent. Check your Telegram for notification.
echo.
echo If you received a Telegram notification, all services are working correctly!
echo If you see an error message, verify all services are running with check_services.bat
echo.
pause