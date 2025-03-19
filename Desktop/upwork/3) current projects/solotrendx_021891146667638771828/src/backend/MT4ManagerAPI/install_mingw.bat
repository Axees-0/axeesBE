@echo off
setlocal enabledelayedexpansion

echo MinGW-w64 Installer Script
echo =========================
echo.
echo This script will download and install MinGW-w64, a more reliable version of MinGW
echo.

REM Create download directory
if not exist "downloads" mkdir downloads
cd downloads

echo Step 1: Downloading MinGW-w64 installer...
echo.
echo Downloading MSYS2 installer (more reliable than MinGW)...
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/msys2/msys2-installer/releases/download/2023-05-26/msys2-x86_64-20230526.exe' -OutFile 'msys2-installer.exe'}"

if not exist "msys2-installer.exe" (
    echo Download failed. Please download MSYS2 manually from:
    echo https://www.msys2.org/
    goto error
)

echo.
echo Step 2: Running MSYS2 installer...
echo.
echo IMPORTANT INSTRUCTIONS:
echo 1. When the installer opens, follow the installation steps
echo 2. Install to the default location (C:\msys64)
echo 3. After installation completes, check "Run MSYS2 now"
echo 4. In the MSYS2 terminal that opens, type these commands:
echo.
echo    pacman -Syu --noconfirm
echo    pacman -S --noconfirm mingw-w64-x86_64-gcc
echo    pacman -S --noconfirm mingw-w64-x86_64-make
echo.
echo Press any key to start the installer...
pause > nul

start msys2-installer.exe
echo.
echo Step 3: Waiting for installation to complete...
echo (Please follow the instructions above in the MSYS2 terminal)
echo.
echo Once installation is complete, press any key to continue...
pause > nul

echo.
echo Step 4: Adding MinGW-w64 to your system PATH
echo.

REM Check if MinGW is already in the PATH
set MINGW_PATH=C:\msys64\mingw64\bin
set FOUND_IN_PATH=0

echo Checking if MinGW-w64 is already in your PATH...
for /f "tokens=*" %%a in ('path') do (
    echo %%a | findstr /C:"%MINGW_PATH%" > nul
    if not errorlevel 1 set FOUND_IN_PATH=1
)

if %FOUND_IN_PATH% equ 1 (
    echo MinGW-w64 is already in your PATH
) else (
    echo Adding MinGW-w64 to your PATH
    setx PATH "%PATH%;%MINGW_PATH%"
    echo Added MinGW-w64 to PATH
)

echo.
echo Step 5: Creating a simple test script
echo.

REM Return to the original directory
cd ..

REM Create a small test file
echo #include ^<stdio.h^> > test.c
echo int main() { >> test.c
echo     printf("MinGW-w64 is working!\\n"); >> test.c
echo     return 0; >> test.c
echo } >> test.c

echo.
echo Created test.c file. To verify your installation works:
echo.
echo 1. Open a NEW command prompt (important!)
echo 2. Navigate to this directory
echo 3. Run these commands:
echo.
echo    gcc test.c -o test.exe
echo    test.exe
echo.
echo If "MinGW-w64 is working!" appears, your installation is successful
echo.
echo You can now run api_test.bat to compile and test the MT4 Manager API

goto end

:error
echo.
echo Installation could not be completed automatically.
echo.
echo Alternative method:
echo 1. Download and install MSYS2 from https://www.msys2.org/
echo 2. Run MSYS2 and enter: pacman -S --noconfirm mingw-w64-x86_64-gcc
echo 3. Add C:\msys64\mingw64\bin to your system PATH
echo.

:end
endlocal