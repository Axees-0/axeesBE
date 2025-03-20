@echo off
echo Checking SoloTrend X Services...
echo.

rem Get the current directory
set PROJECT_ROOT=%~dp0
echo Project root: %PROJECT_ROOT%

rem Define the virtual environment path
set VENV_DIR=%PROJECT_ROOT%environment\python\venv

rem Activate virtual environment
call %VENV_DIR%\Scripts\activate.bat

echo.
echo 1. Checking MT4 REST API (should be on port 5002)...
curl -s http://localhost:5002/api/health || echo Service not responding!

echo.
echo 2. Checking Webhook API (should be on port 5003)...
curl -s http://localhost:5003/health || echo Service not responding!

echo.
echo 3. Checking Telegram Connector (should be on port 5001)...
curl -s http://localhost:5001/health || echo Service not responding!

echo.
echo Service check complete!
pause