@echo off
echo Updating DLL Detection for 64-bit Support
echo ========================================

rem Detect Python architecture
call "%~dp0environment\python\venv\Scripts\activate.bat"
for /f "tokens=*" %%a in ('python -c "import struct; print(8 * struct.calcsize('P'))"') do set PYTHON_BITS=%%a
echo Detected Python Architecture: %PYTHON_BITS%-bit

rem Set paths
set "WRAPPER_DIR=%~dp0src\backend\MT4RestfulAPIWrapper"
set "MT4_API_FILE=%WRAPPER_DIR%\mt4_api.py"
set "DLL_PATH=%WRAPPER_DIR%\mtmanapi.dll"
set "DLL64_PATH=%WRAPPER_DIR%\mtmanapi64.dll"

echo.
echo Checking for DLL files:
if exist "%DLL_PATH%" echo - Found 32-bit DLL: %DLL_PATH%
if exist "%DLL64_PATH%" echo - Found 64-bit DLL: %DLL64_PATH%

echo.
if "%PYTHON_BITS%"=="64" (
    if exist "%DLL64_PATH%" (
        echo Applying 64-bit fix: Copying mtmanapi64.dll to mtmanapi.dll
        copy /y "%DLL64_PATH%" "%DLL_PATH%"
        echo Copied successfully!
    ) else (
        echo WARNING: 64-bit DLL not found. You need to obtain mtmanapi64.dll.
    )
) else (
    echo Using 32-bit Python with standard mtmanapi.dll (no change needed)
)

echo.
echo ========================================
echo Next steps:
echo 1. Restart all services: start_all_services.bat  
echo 2. Test the connection again
echo ========================================
pause