@echo off
echo MT4 Wrapper DLL Setup
echo ====================
echo.
echo This script will build and set up the MT4 wrapper DLL for 64-bit Python.
echo.

rem Create logs directory if it doesn't exist
if not exist data\logs mkdir data\logs

rem Set log file path with timestamp
set LOG_FILE=data\logs\wrapper_setup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%.log
rem Fix log file name for times with leading space
set LOG_FILE=%LOG_FILE: =0%

echo Log will be saved to: %LOG_FILE%

echo Setup started at %date% %time% > %LOG_FILE%
echo System information: >> %LOG_FILE%
systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type" >> %LOG_FILE%
echo. >> %LOG_FILE%

rem Log Python version and architecture
echo Python information: >> %LOG_FILE%
python --version >> %LOG_FILE% 2>&1
python -c "import platform; import struct; print('Architecture:', platform.architecture()); print('64-bit Python:', struct.calcsize('P') * 8 == 64)" >> %LOG_FILE% 2>&1
echo. >> %LOG_FILE%

rem Check for MinGW (g++)
echo Checking for MinGW... >> %LOG_FILE%
where g++ > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo g++ not found, checking for MinGW in standard locations... >> %LOG_FILE%
    
    if exist "C:\MinGW\bin\g++.exe" (
        echo Found MinGW at C:\MinGW\bin >> %LOG_FILE%
        set PATH=C:\MinGW\bin;%PATH%
    ) else if exist "C:\msys64\mingw64\bin\g++.exe" (
        echo Found MinGW at C:\msys64\mingw64\bin >> %LOG_FILE%
        set PATH=C:\msys64\mingw64\bin;%PATH%
    ) else (
        echo MinGW not found, attempting to download and install MSYS2... >> %LOG_FILE%
        echo MinGW not found, attempting to download and install MSYS2...
        
        rem Create download directory if it doesn't exist
        if not exist "downloads" mkdir downloads
        
        rem Download MSYS2 installer
        echo Downloading MSYS2 installer... >> %LOG_FILE%
        echo Downloading MSYS2 installer...
        powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/msys2/msys2-installer/releases/download/2023-05-26/msys2-x86_64-20230526.exe' -OutFile 'downloads\msys2-installer.exe' }" >> %LOG_FILE% 2>&1
        
        if not exist "downloads\msys2-installer.exe" (
            echo ERROR: Failed to download MSYS2 installer. >> %LOG_FILE%
            echo ERROR: Failed to download MSYS2 installer.
            echo Please download and install MSYS2 manually from https://www.msys2.org/
            goto end
        )
        
        echo Running MSYS2 installer... >> %LOG_FILE%
        echo Running MSYS2 installer...
        echo This will take a few minutes. Please complete the installation with default options.
        echo IMPORTANT: When the installer finishes and asks if you want to run MSYS2 now, select YES.
        echo.
        echo After MSYS2 is running, exit that terminal and return here to continue.
        echo.
        downloads\msys2-installer.exe
        
        echo Checking if MSYS2 was installed... >> %LOG_FILE%
        if exist "C:\msys64\mingw64\bin" (
            echo MSYS2 installed successfully >> %LOG_FILE%
            echo.
            echo MSYS2 appears to be installed.
            echo Installing required packages...
            
            rem Install required packages
            echo Installing MinGW-w64 and required tools... >> %LOG_FILE%
            C:\msys64\usr\bin\bash.exe -lc "pacman -Sy --noconfirm mingw-w64-x86_64-toolchain make" >> %LOG_FILE% 2>&1
            
            echo Adding C:\msys64\mingw64\bin to PATH... >> %LOG_FILE%
            set PATH=C:\msys64\mingw64\bin;%PATH%
            echo PATH updated >> %LOG_FILE%
            
            echo MinGW-w64 installation completed.
        ) else (
            echo ERROR: MSYS2 installation failed or was not completed. >> %LOG_FILE%
            echo ERROR: MSYS2 installation failed or was not completed.
            echo Please install MinGW-w64 manually or try again.
            goto end
        )
    )
)

echo Using g++: >> %LOG_FILE%
where g++ >> %LOG_FILE% 2>&1
g++ --version >> %LOG_FILE% 2>&1
echo. >> %LOG_FILE%

rem Ensure the mtmanapi64.dll is available
echo Checking for mtmanapi64.dll... >> %LOG_FILE%
if not exist "mtmanapi64.dll" (
    echo WARNING: mtmanapi64.dll not found in current directory. >> %LOG_FILE%
    
    if exist "src\backend\MT4ManagerAPI\mtmanapi64.dll" (
        echo Found in src\backend\MT4ManagerAPI, copying... >> %LOG_FILE%
        copy "src\backend\MT4ManagerAPI\mtmanapi64.dll" . >> %LOG_FILE% 2>&1
    ) else if exist "C:\Program Files\MetaTrader 4\mtmanapi64.dll" (
        echo Found in MT4 installation, copying... >> %LOG_FILE%
        copy "C:\Program Files\MetaTrader 4\mtmanapi64.dll" . >> %LOG_FILE% 2>&1
    ) else if exist "C:\Program Files (x86)\MetaTrader 4\mtmanapi64.dll" (
        echo Found in MT4 installation (x86), copying... >> %LOG_FILE%
        copy "C:\Program Files (x86)\MetaTrader 4\mtmanapi64.dll" . >> %LOG_FILE% 2>&1
    ) else (
        echo ERROR: Could not find mtmanapi64.dll! >> %LOG_FILE%
        echo ERROR: Could not find mtmanapi64.dll!
        echo Please copy it from your MT4 installation directory.
        goto end
    )
)

echo Found mtmanapi64.dll: >> %LOG_FILE%
dir mtmanapi64.dll >> %LOG_FILE% 2>&1
echo. >> %LOG_FILE%

rem Ensure MT4 API headers are available
echo Checking MT4 API headers... >> %LOG_FILE%
if not exist "src\backend\MT4ManagerAPI\MT4Manager.h" (
    echo ERROR: MT4Manager.h not found! >> %LOG_FILE%
    echo ERROR: MT4Manager.h not found!
    echo Please make sure the MT4ManagerAPI directory is properly set up.
    goto end
)

echo Found MT4 API headers: >> %LOG_FILE%
dir "src\backend\MT4ManagerAPI\MT4Manager.h" >> %LOG_FILE% 2>&1
echo. >> %LOG_FILE%

rem Check the build directory
echo Checking build directory... >> %LOG_FILE%
if not exist "build\mt4_wrapper" (
    echo Creating build\mt4_wrapper directory... >> %LOG_FILE%
    mkdir "build\mt4_wrapper" >> %LOG_FILE% 2>&1
)

rem Ensure wrapper source files
echo Checking wrapper source files... >> %LOG_FILE%
if not exist "build\mt4_wrapper\mt4_wrapper.cpp" (
    echo ERROR: mt4_wrapper.cpp not found! >> %LOG_FILE%
    echo ERROR: mt4_wrapper.cpp not found!
    echo Please ensure the build\mt4_wrapper directory is properly set up.
    goto end
)

if not exist "build\mt4_wrapper\mt4_wrapper.h" (
    echo ERROR: mt4_wrapper.h not found! >> %LOG_FILE%
    echo ERROR: mt4_wrapper.h not found!
    echo Please ensure the build\mt4_wrapper directory is properly set up.
    goto end
)

echo Found wrapper source files: >> %LOG_FILE%
dir "build\mt4_wrapper\mt4_wrapper.cpp" "build\mt4_wrapper\mt4_wrapper.h" >> %LOG_FILE% 2>&1
echo. >> %LOG_FILE%

rem Build the wrapper
echo Building MT4 wrapper DLL... >> %LOG_FILE%
cd build\mt4_wrapper
echo Current directory: %CD% >> ..\..\%LOG_FILE%

rem Copy the mtmanapi64.dll to the build directory
echo Copying mtmanapi64.dll to build directory... >> ..\..\%LOG_FILE%
copy ..\..\mtmanapi64.dll . >> ..\..\%LOG_FILE% 2>&1

rem Build using g++
echo Running g++ to build wrapper... >> ..\..\%LOG_FILE%
g++ -std=c++11 -Wall -O2 -shared -fPIC -I. -I../../src/backend/MT4ManagerAPI -o mt4_wrapper.dll mt4_wrapper.cpp -static-libgcc -static-libstdc++ -L. -lmtmanapi64 >> ..\..\%LOG_FILE% 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed! See log for details. >> ..\..\%LOG_FILE%
    echo ERROR: Build failed! See log for details.
    cd ..\..
    goto end
)

echo Build successful! >> ..\..\%LOG_FILE%
echo Build successful!

rem Check if DLL was created
if not exist mt4_wrapper.dll (
    echo ERROR: mt4_wrapper.dll was not created despite successful build command! >> ..\..\%LOG_FILE%
    echo ERROR: mt4_wrapper.dll was not created despite successful build command!
    cd ..\..
    goto end
)

echo Checking built DLL: >> ..\..\%LOG_FILE%
dir mt4_wrapper.dll >> ..\..\%LOG_FILE% 2>&1
echo. >> ..\..\%LOG_FILE%

rem Copy the wrapper to the project root
echo Copying mt4_wrapper.dll to project root... >> ..\..\%LOG_FILE%
copy mt4_wrapper.dll ..\.. >> ..\..\%LOG_FILE% 2>&1

rem Copy to MT4RestfulAPIWrapper directory
echo Copying mt4_wrapper.dll to MT4RestfulAPIWrapper directory... >> ..\..\%LOG_FILE%
if not exist "..\..\src\backend\MT4RestfulAPIWrapper" (
    mkdir "..\..\src\backend\MT4RestfulAPIWrapper" >> ..\..\%LOG_FILE% 2>&1
)
copy mt4_wrapper.dll ..\..\src\backend\MT4RestfulAPIWrapper >> ..\..\%LOG_FILE% 2>&1

rem Return to the project root
cd ..\..

rem Update environment
echo Setting environment variables... >> %LOG_FILE%
set MT4_DLL_PATH=%CD%\mt4_wrapper.dll
set MT4_WRAPPER_BUILT=true
setx MT4_DLL_PATH "%CD%\mt4_wrapper.dll" >> %LOG_FILE% 2>&1

echo Current environment: >> %LOG_FILE%
echo MT4_DLL_PATH=%MT4_DLL_PATH% >> %LOG_FILE%
echo MT4_WRAPPER_BUILT=%MT4_WRAPPER_BUILT% >> %LOG_FILE%

echo.
echo MT4 wrapper DLL has been successfully built and installed:
echo  - Wrapper DLL: %CD%\mt4_wrapper.dll
echo  - Environment variable MT4_DLL_PATH has been set
echo.
echo Setup completed successfully!
echo.
echo You can now run test_dll_load.bat and test_mt4_connect.bat to test the wrapper.

:end
echo Setup completed at %date% %time% >> %LOG_FILE%
echo See log file for details: %LOG_FILE%
echo.
pause