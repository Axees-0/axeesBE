@echo off
echo Checking DLL Architecture (Simple Method)...
echo ===========================================

rem Set paths
set "DLL_PATH=%~dp0src\backend\MT4RestfulAPIWrapper\mtmanapi.dll"
set "DLL64_PATH=%~dp0src\backend\MT4RestfulAPIWrapper\mtmanapi64.dll"

echo Looking for:
echo - 32-bit DLL: %DLL_PATH%
echo - 64-bit DLL: %DLL64_PATH%
echo.

echo Physical file check:
if exist "%DLL_PATH%" (
    echo - 32-bit DLL (mtmanapi.dll) is PRESENT
) else (
    echo - 32-bit DLL (mtmanapi.dll) is MISSING
)

if exist "%DLL64_PATH%" (
    echo - 64-bit DLL (mtmanapi64.dll) is PRESENT
) else (
    echo - 64-bit DLL (mtmanapi64.dll) is MISSING
)

echo.
echo ===========================================
echo Since Python is 64-bit, you need to make sure:
echo 1. The 64-bit DLL (mtmanapi64.dll) is available
echo 2. It's correctly loaded by the code

echo.
echo Trying a simple fix (rename files to match architecture):
echo (This will copy mtmanapi64.dll to mtmanapi.dll if available)

if exist "%DLL64_PATH%" (
    echo Found 64-bit DLL. Copying to standard DLL name...
    copy /y "%DLL64_PATH%" "%DLL_PATH%"
    echo Done!
) else (
    echo 64-bit DLL not found. Please obtain the 64-bit version of mtmanapi64.dll
    echo or switch to 32-bit Python.
)

echo.
echo ===========================================
pause