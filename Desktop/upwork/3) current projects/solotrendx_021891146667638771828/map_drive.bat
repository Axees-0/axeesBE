@echo off
echo SoloTrend X - Network Drive Mapping Tool
echo.
echo This tool will help you map your UNC path to a drive letter
echo to avoid UNC path issues with the application.
echo.

rem Get the current directory
set "CURRENT_PATH=%~dp0"
echo Current path: %CURRENT_PATH%

rem Check if we're already on a mapped drive
echo %CURRENT_PATH% | findstr /B "\\\\" > nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Good news! You are already running from a mapped drive.
    echo No action is needed.
    echo.
    pause
    exit /b 0
)

echo.
echo Your current path is a UNC path, which may cause issues.
echo.
set /p DRIVE_LETTER="Enter a drive letter to use (e.g., Z): "

rem Remove colon if provided
set DRIVE_LETTER=%DRIVE_LETTER::=%

rem Create full drive letter
set DRIVE_LETTER=%DRIVE_LETTER%:

rem Try to map the drive
echo.
echo Mapping %CURRENT_PATH% to %DRIVE_LETTER%...
net use %DRIVE_LETTER% %CURRENT_PATH% /persistent:yes

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Drive mapping successful!
    echo.
    echo Please run start_all_services.bat from %DRIVE_LETTER%\
    echo instead of from the UNC path.
) else (
    echo.
    echo Drive mapping failed. Please try a different drive letter
    echo or map the drive manually using:
    echo.
    echo     net use %DRIVE_LETTER% %CURRENT_PATH% /persistent:yes
    echo.
)

pause