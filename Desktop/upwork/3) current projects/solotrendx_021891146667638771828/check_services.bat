@echo off
echo Checking SoloTrend X services...
echo.

echo ===== MT4 REST API =====
curl -s http://localhost:5000/api/health
echo.
echo.

echo ===== Webhook API =====
curl -s http://localhost:5002/health
echo.
echo.

echo ===== Telegram Connector =====
curl -s http://localhost:5001/health
echo.
echo.

echo Checking service processes...
echo.
tasklist | findstr "python"
echo.

echo Checking listening ports...
echo.
netstat -ano | findstr "5000 5001 5002" | findstr "LISTENING"
echo.

echo Service check complete!
pause