@echo off
setlocal enabledelayedexpansion

echo ===== MT4 64-bit DLL Setup =====
echo This script ensures the MT4 Manager API 64-bit DLL is properly installed
echo for the MT4 REST API to find it.
echo.

set PROJECT_ROOT=%~dp0
set DLL_SOURCE_64=%PROJECT_ROOT%src\backend\MT4ManagerAPI\mtmanapi64.dll
set DLL_DESTINATION=%PROJECT_ROOT%src\backend\MT4RestfulAPIWrapper
set ROOT_DESTINATION=%PROJECT_ROOT%

echo Checking for 64-bit source DLL...
if not exist "%DLL_SOURCE_64%" (
    echo ERROR: 64-bit source DLL not found at %DLL_SOURCE_64%
    echo Checking alternative locations...
    
    if exist "C:\Program Files (x86)\MetaTrader 4\mtmanapi64.dll" (
        echo Found 64-bit DLL in MT4 installation directory.
        set DLL_SOURCE_64=C:\Program Files (x86)\MetaTrader 4\mtmanapi64.dll
    ) else if exist "C:\Program Files\MetaTrader 4\mtmanapi64.dll" (
        echo Found 64-bit DLL in MT4 installation directory.
        set DLL_SOURCE_64=C:\Program Files\MetaTrader 4\mtmanapi64.dll
    ) else (
        echo 64-bit DLL not found in standard MT4 locations.
        echo Please locate mtmanapi64.dll manually and copy it to:
        echo %DLL_DESTINATION%
        exit /b 1
    )
)

echo Source 64-bit DLL found at %DLL_SOURCE_64%

echo Creating destination directory if needed...
if not exist "%DLL_DESTINATION%" (
    mkdir "%DLL_DESTINATION%"
    echo Created directory %DLL_DESTINATION%
)

echo Copying 64-bit DLL files...
copy /Y "%DLL_SOURCE_64%" "%DLL_DESTINATION%\"
copy /Y "%DLL_SOURCE_64%" "%ROOT_DESTINATION%\"

echo Verifying copied files...
if exist "%DLL_DESTINATION%\mtmanapi64.dll" (
    echo 64-bit DLL correctly installed at %DLL_DESTINATION%\mtmanapi64.dll
) else (
    echo ERROR: Failed to copy 64-bit DLL to %DLL_DESTINATION%
    exit /b 1
)

if exist "%ROOT_DESTINATION%\mtmanapi64.dll" (
    echo 64-bit DLL correctly installed at %ROOT_DESTINATION%\mtmanapi64.dll
) else (
    echo ERROR: Failed to copy 64-bit DLL to %ROOT_DESTINATION%
    exit /b 1
)

echo.
echo ===== 64-bit DLL setup completed successfully =====
echo The MT4 REST API should now be able to find the required 64-bit DLL
echo.

endlocal