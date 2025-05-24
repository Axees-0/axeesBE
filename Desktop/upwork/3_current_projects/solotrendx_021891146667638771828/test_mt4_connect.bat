@echo off
setlocal enabledelayedexpansion

:: Setup paths
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOGDIR=data\logs
if not exist %LOGDIR% mkdir %LOGDIR%
set LOGFILE=%LOGDIR%\test_mt4_connect_%TIMESTAMP%.log

echo ===== MT4 Connection Test ===== > %LOGFILE%
echo Start time: %date% %time% >> %LOGFILE%

echo ===== MT4 Connection Test =====
echo Start time: %date% %time%

:: Check for the latest MT4 wrapper DLL
echo Checking for MT4 wrapper DLL... >> %LOGFILE%
echo Checking for MT4 wrapper DLL...

set WRAPPER_DLL_PATH=
set WRAPPER_FOUND=0

:: Check possible locations for wrapper DLL
if exist "mt4_wrapper.dll" (
    set WRAPPER_DLL_PATH=%CD%\mt4_wrapper.dll
    set WRAPPER_FOUND=1
) else if exist "build\mt4_wrapper\mt4_wrapper.dll" (
    set WRAPPER_DLL_PATH=%CD%\build\mt4_wrapper\mt4_wrapper.dll
    set WRAPPER_FOUND=1
) else if exist "src\backend\MT4RestfulAPIWrapper\mt4_wrapper.dll" (
    set WRAPPER_DLL_PATH=%CD%\src\backend\MT4RestfulAPIWrapper\mt4_wrapper.dll
    set WRAPPER_FOUND=1
)

:: Use the DLL if found
if %WRAPPER_FOUND% == 1 (
    echo Found wrapper DLL at: %WRAPPER_DLL_PATH% >> %LOGFILE%
    echo Found wrapper DLL at: %WRAPPER_DLL_PATH%
    
    :: Set environment variable for Python script
    set MT4_DLL_PATH=%WRAPPER_DLL_PATH%
    echo Setting MT4_DLL_PATH=%MT4_DLL_PATH% >> %LOGFILE%
) else (
    echo WARNING: Wrapper DLL not found, will try to use direct MT4 DLL... >> %LOGFILE%
    echo WARNING: Wrapper DLL not found, will try to use direct MT4 DLL...
    
    :: Try to find MT4 DLL
    if exist "mtmanapi64.dll" (
        set MT4_DLL_PATH=%CD%\mtmanapi64.dll
        echo Found MT4 DLL at: %MT4_DLL_PATH% >> %LOGFILE%
    ) else if exist "src\backend\MT4ManagerAPI\mtmanapi64.dll" (
        set MT4_DLL_PATH=%CD%\src\backend\MT4ManagerAPI\mtmanapi64.dll
        echo Found MT4 DLL at: %MT4_DLL_PATH% >> %LOGFILE%
    ) else (
        echo ERROR: No MT4 DLL found! The test will likely fail. >> %LOGFILE%
        echo ERROR: No MT4 DLL found! The test will likely fail.
    )
)

:: Load environment variables from .env file if it exists
if exist ".env" (
    echo Loading environment variables from .env file... >> %LOGFILE%
    echo Loading environment variables from .env file...
    
    :: Parse .env file and set variables
    for /f "tokens=*" %%a in (.env) do (
        set %%a
    )
)

:: Run the MT4 connection test
echo. >> %LOGFILE%
echo Running MT4 connection test... >> %LOGFILE%
echo.
echo Running MT4 connection test...

python test_mt4_connect.py >> %LOGFILE% 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo TEST FAILED: MT4 connection test failed. >> %LOGFILE%
    echo TEST FAILED: MT4 connection test failed.
    echo Check log files for details:
    echo - %LOGFILE%
    echo - See data\logs directory for additional logs
    exit /b 1
)

echo TEST PASSED: MT4 connection test passed. >> %LOGFILE%
echo TEST PASSED: MT4 connection test passed.

echo End time: %date% %time% >> %LOGFILE%
echo End time: %date% %time%
echo Log file: %LOGFILE%

endlocal