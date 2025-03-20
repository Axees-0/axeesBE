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

rem Activate virtual environment and send test signal
call "%VENV_DIR%\Scripts\activate.bat"

rem Use the same port as defined in start_all_services.bat
set WEBHOOK_API_PORT=5003

echo Sending test trading signal...
curl -X POST http://localhost:%WEBHOOK_API_PORT%/webhook/tradingview -H "Content-Type: application/json" -d "{\"symbol\":\"EURUSD\",\"side\":\"BUY\",\"price\":1.1234,\"sl\":1.1200,\"tp1\":1.1300,\"strategy\":\"SoloTrend X Test\"}"
echo.
echo.

echo Test signal sent. Check your Telegram for notification.
echo.
echo If you received a Telegram notification, all services are working correctly!
echo.
pause