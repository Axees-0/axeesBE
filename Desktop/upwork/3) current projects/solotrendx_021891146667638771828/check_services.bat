@echo off
echo Checking SoloTrend X Services...
echo.

rem Get the current directory and fix path issues
set "PROJECT_ROOT=%~dp0"
echo Project root: %PROJECT_ROOT%

rem Ensure log directory exists
if not exist "%PROJECT_ROOT%data\logs" (
    mkdir "%PROJECT_ROOT%data\logs"
)

rem Create a timestamped log file for this check
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set mytime=%%a%%b)
set "LOG_FILE=%PROJECT_ROOT%data\logs\service_check_%mydate%_%mytime%.log"
echo Service check started at %date% %time% > "%LOG_FILE%"

echo Log file: %LOG_FILE%
echo.

rem Define the virtual environment path
set "VENV_DIR=%PROJECT_ROOT%environment\python\venv"
echo Virtual environment: %VENV_DIR%
echo Virtual environment: %VENV_DIR% >> "%LOG_FILE%"

rem Check if virtual environment exists
if not exist "%VENV_DIR%" (
    echo ERROR: Virtual environment not found. Please run setup_venv.bat first.
    echo ERROR: Virtual environment not found. Please run setup_venv.bat first. >> "%LOG_FILE%"
    pause
    exit /b 1
)

rem Activate virtual environment
call "%VENV_DIR%\Scripts\activate.bat"
echo Virtual environment activated
echo Virtual environment activated >> "%LOG_FILE%"

rem Read port settings from .env file
set WEBHOOK_API_PORT=5003
set TELEGRAM_PORT=5005
set MT4_API_PORT=5002

rem Try to read from .env file if it exists
if exist "%PROJECT_ROOT%.env" (
    echo Reading port settings from .env file...
    
    rem Parse the .env file for port settings
    for /f "tokens=1,* delims==" %%a in ('type "%PROJECT_ROOT%.env" ^| findstr "PORT"') do (
        if "%%a"=="WEBHOOK_API_PORT" set "WEBHOOK_API_PORT=%%b"
        if "%%a"=="FLASK_PORT" set "TELEGRAM_PORT=%%b"
        if "%%a"=="PORT" set "MT4_API_PORT=%%b"
    )
)

echo Using port configuration: >> "%LOG_FILE%"
echo - MT4 API Port: %MT4_API_PORT% >> "%LOG_FILE%"
echo - Webhook API Port: %WEBHOOK_API_PORT% >> "%LOG_FILE%"
echo - Telegram Port: %TELEGRAM_PORT% >> "%LOG_FILE%"

echo Using the following ports for service checks:
echo - MT4 API: %MT4_API_PORT%
echo - Webhook API: %WEBHOOK_API_PORT%
echo - Telegram: %TELEGRAM_PORT%

echo Checking if services are running...
echo Checking if services are running... >> "%LOG_FILE%"

rem Check service logs for errors
echo Checking logs for errors...
echo Checking logs for errors... >> "%LOG_FILE%"
if exist "%PROJECT_ROOT%data\logs\mt4_rest_api.log" (
    echo Checking MT4 REST API logs for errors:
    echo Checking MT4 REST API logs for errors: >> "%LOG_FILE%"
    findstr /i "error exception failed" "%PROJECT_ROOT%data\logs\mt4_rest_api.log" >> "%LOG_FILE%"
    findstr /i "traceback" "%PROJECT_ROOT%data\logs\mt4_rest_api.log" >> "%LOG_FILE%"
)

if exist "%PROJECT_ROOT%data\logs\webhook_api.log" (
    echo Checking Webhook API logs for errors:
    echo Checking Webhook API logs for errors: >> "%LOG_FILE%"
    findstr /i "error exception failed" "%PROJECT_ROOT%data\logs\webhook_api.log" >> "%LOG_FILE%"
    findstr /i "traceback" "%PROJECT_ROOT%data\logs\webhook_api.log" >> "%LOG_FILE%"
)

if exist "%PROJECT_ROOT%data\logs\telegram_connector.log" (
    echo Checking Telegram Connector logs for errors:
    echo Checking Telegram Connector logs for errors: >> "%LOG_FILE%"
    findstr /i "error exception failed" "%PROJECT_ROOT%data\logs\telegram_connector.log" >> "%LOG_FILE%"
    findstr /i "traceback" "%PROJECT_ROOT%data\logs\telegram_connector.log" >> "%LOG_FILE%"
)

echo 1. Checking MT4 REST API (port %MT4_API_PORT%)...
echo 1. Checking MT4 REST API (port %MT4_API_PORT%)... >> "%LOG_FILE%"
curl -s http://localhost:%MT4_API_PORT%/api/health -o "%TEMP%\mt4_health.json"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: MT4 REST API is not running! Please start services with start_all_services.bat
    echo ERROR: MT4 REST API is not running! Please start services with start_all_services.bat >> "%LOG_FILE%"
) else (
    echo MT4 REST API is running.
    echo MT4 REST API is running. >> "%LOG_FILE%"
    type "%TEMP%\mt4_health.json" >> "%LOG_FILE%"
)
echo.

echo 2. Checking Webhook API (port %WEBHOOK_API_PORT%)...
echo 2. Checking Webhook API (port %WEBHOOK_API_PORT%)... >> "%LOG_FILE%"
curl -s http://localhost:%WEBHOOK_API_PORT%/health -o "%TEMP%\webhook_health.json"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Webhook API is not running! Please start services with start_all_services.bat
    echo ERROR: Webhook API is not running! Please start services with start_all_services.bat >> "%LOG_FILE%"
) else (
    echo Webhook API is running.
    echo Webhook API is running. >> "%LOG_FILE%"
    type "%TEMP%\webhook_health.json" >> "%LOG_FILE%"
)
echo.

echo 3. Checking Telegram Connector (port %TELEGRAM_PORT%)...
echo 3. Checking Telegram Connector (port %TELEGRAM_PORT%)... >> "%LOG_FILE%"
curl -s http://localhost:%TELEGRAM_PORT%/health -o "%TEMP%\telegram_health.json"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Telegram Connector is not running! Please start services with start_all_services.bat
    echo ERROR: Telegram Connector is not running! Please start services with start_all_services.bat >> "%LOG_FILE%"
) else (
    echo Telegram Connector is running.
    echo Telegram Connector is running. >> "%LOG_FILE%"
    type "%TEMP%\telegram_health.json" >> "%LOG_FILE%"
    
    echo Checking webhook endpoint...
    echo Checking webhook endpoint... >> "%LOG_FILE%"
    curl -s http://localhost:%TELEGRAM_PORT%/webhook -o "%TEMP%\telegram_webhook.json"
    type "%TEMP%\telegram_webhook.json" >> "%LOG_FILE%"
)
echo.

echo 4. Testing connections between components...
echo 4. Testing connections between components... >> "%LOG_FILE%"
echo Testing Webhook API to Telegram Connector connection...
echo Testing Webhook API to Telegram Connector connection... >> "%LOG_FILE%"
curl -s -X POST http://localhost:%WEBHOOK_API_PORT%/webhook ^
     -H "Content-Type: application/json" ^
     -d "{\"symbol\":\"EURUSD\",\"side\":\"BUY\",\"price\":1.1234,\"sl\":1.1200,\"tp1\":1.1300,\"strategy\":\"SoloTrend X Test\"}" -o "%TEMP%\webhook_test.json"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Connection test failed!
    echo ERROR: Connection test failed! >> "%LOG_FILE%"
) else (
    echo Connection test response:
    echo Connection test response: >> "%LOG_FILE%"
    type "%TEMP%\webhook_test.json" >> "%LOG_FILE%"
)
echo.

rem Wait a moment for logs to be updated
timeout /t 3 > nul

echo 5. Checking for new errors in logs after test...
echo 5. Checking for new errors in logs after test... >> "%LOG_FILE%"
if exist "%PROJECT_ROOT%data\logs\webhook_api_debug.log" (
    echo Latest Webhook API debug logs:
    echo Latest Webhook API debug logs: >> "%LOG_FILE%"
    powershell -Command "Get-Content -Tail 20 \"%PROJECT_ROOT%data\logs\webhook_api_debug.log\"" | findstr /i "error exception failed" >> "%LOG_FILE%"
)

if exist "%PROJECT_ROOT%data\logs\telegram_bot_debug.log" (
    echo Latest Telegram Bot debug logs:
    echo Latest Telegram Bot debug logs: >> "%LOG_FILE%"
    powershell -Command "Get-Content -Tail 20 \"%PROJECT_ROOT%data\logs\telegram_bot_debug.log\"" | findstr /i "error exception failed" >> "%LOG_FILE%"
)

echo 6. Service log file locations:
echo 6. Service log file locations: >> "%LOG_FILE%"
echo MT4 REST API log: %PROJECT_ROOT%data\logs\mt4_rest_api.log
echo MT4 REST API log: %PROJECT_ROOT%data\logs\mt4_rest_api.log >> "%LOG_FILE%"
echo MT4 REST API debug log: %PROJECT_ROOT%data\logs\mt4_rest_api_debug.log
echo MT4 REST API debug log: %PROJECT_ROOT%data\logs\mt4_rest_api_debug.log >> "%LOG_FILE%"
echo Webhook API log: %PROJECT_ROOT%data\logs\webhook_api.log
echo Webhook API log: %PROJECT_ROOT%data\logs\webhook_api.log >> "%LOG_FILE%"
echo Webhook API debug log: %PROJECT_ROOT%data\logs\webhook_api_debug.log
echo Webhook API debug log: %PROJECT_ROOT%data\logs\webhook_api_debug.log >> "%LOG_FILE%"
echo Telegram Connector log: %PROJECT_ROOT%data\logs\telegram_connector.log
echo Telegram Connector log: %PROJECT_ROOT%data\logs\telegram_connector.log >> "%LOG_FILE%"
echo Telegram Bot debug log: %PROJECT_ROOT%data\logs\telegram_bot_debug.log
echo Telegram Bot debug log: %PROJECT_ROOT%data\logs\telegram_bot_debug.log >> "%LOG_FILE%"
echo Health check log: %LOG_FILE%
echo Health check log: %LOG_FILE% >> "%LOG_FILE%"
echo.

echo Service check completed at %date% %time%.
echo Service check completed at %date% %time%. >> "%LOG_FILE%"
echo Results saved to %LOG_FILE%
echo.
pause