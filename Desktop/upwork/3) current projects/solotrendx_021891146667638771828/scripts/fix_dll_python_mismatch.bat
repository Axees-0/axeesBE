@echo off
echo Fix DLL and Python Architecture Mismatch
echo =======================================
echo This script will help fix architecture mismatches between Python and the MT4 DLL

rem Detect Python architecture
call "%~dp0environment\python\venv\Scripts\activate.bat"
for /f "tokens=*" %%a in ('python -c "import struct; print(8 * struct.calcsize('P'))"') do set PYTHON_BITS=%%a
echo Detected Python Architecture: %PYTHON_BITS%-bit

rem Set paths
set "DLL_PATH=%~dp0src\backend\MT4RestfulAPIWrapper\mtmanapi.dll"
set "DLL64_PATH=%~dp0src\backend\MT4RestfulAPIWrapper\mtmanapi64.dll"
set "DLL_SOURCE=%~dp0src\backend\MT4ManagerAPI\mtmanapi.dll"
set "DLL64_SOURCE=%~dp0src\backend\MT4ManagerAPI\mtmanapi64.dll"

echo.
echo Available DLLs:
if exist "%DLL_SOURCE%" echo - 32-bit DLL: %DLL_SOURCE%
if exist "%DLL64_SOURCE%" echo - 64-bit DLL: %DLL64_SOURCE%
echo.

if "%PYTHON_BITS%"=="64" (
    echo You have 64-bit Python, so you should use mtmanapi64.dll
    
    if exist "%DLL64_SOURCE%" (
        echo Found 64-bit DLL. Copying to the correct location...
        copy /y "%DLL64_SOURCE%" "%DLL_PATH%"
        echo Copied 64-bit DLL to %DLL_PATH%
        echo This should fix the architecture mismatch!
    ) else (
        echo ERROR: 64-bit DLL (mtmanapi64.dll) not found!
        echo Please locate the 64-bit DLL and manually copy it to:
        echo %DLL_PATH%
    )
) else (
    echo You have 32-bit Python, so you should use mtmanapi.dll
    
    if exist "%DLL_SOURCE%" (
        echo Found 32-bit DLL. Copying to the correct location...
        copy /y "%DLL_SOURCE%" "%DLL_PATH%"
        echo Copied 32-bit DLL to %DLL_PATH%
        echo This should fix the architecture mismatch!
    ) else (
        echo ERROR: 32-bit DLL (mtmanapi.dll) not found!
        echo Please locate the 32-bit DLL and manually copy it to:
        echo %DLL_PATH%
    )
)

echo.
echo =======================================
echo Next steps:
echo 1. Restart all services: start_all_services.bat
echo 2. Test the connection with test_direct_order.bat
echo =======================================
pause