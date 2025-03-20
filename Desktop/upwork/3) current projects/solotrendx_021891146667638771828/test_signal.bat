@echo off
echo Sending test signal to SoloTrend X system...
echo.

rem Get the current directory
set PROJECT_ROOT=%~dp0
echo Project root: %PROJECT_ROOT%

rem Define the virtual environment path
set VENV_DIR=%PROJECT_ROOT%venv

rem Activate virtual environment and send test signal
call %VENV_DIR%\Scripts\activate.bat

echo Sending test trading signal...
curl -X POST http://localhost:5002/webhook/tradingview -H "Content-Type: application/json" -d "{\"symbol\":\"EURUSD\",\"side\":\"BUY\",\"price\":1.1234,\"sl\":1.1200,\"tp1\":1.1300,\"strategy\":\"SoloTrend X Test\"}"
echo.
echo.

echo Test signal sent. Check your Telegram for notification.
echo.
echo If you received a Telegram notification, all services are working correctly!
pause