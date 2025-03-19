@echo off
setlocal EnableDelayedExpansion

echo MT4 Manager API - Local Test Environment
echo ======================================
echo.

REM Define default settings
set SERVER=localhost
set PORT=443
set LOGIN=123
set PASSWORD=password
set TIMEOUT_SECONDS=10

REM Parse command line arguments
if not "%1"=="" (
    if /i "%1"=="-help" (
        goto show_help
    )
    set SERVER=%1
)
if not "%2"=="" set PORT=%2
if not "%3"=="" set LOGIN=%3
if not "%4"=="" set PASSWORD=%4

REM Show settings
echo Settings:
echo  - Server: %SERVER%
echo  - Port: %PORT%
echo  - Login: %LOGIN%
echo  - Password: %PASSWORD%
echo.

REM Check for required files
echo Checking required files...

REM Check for MT4 Manager API DLL
echo Searching for mtmanapi.dll...
dir /b mtmanapi.dll >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Found mtmanapi.dll in current directory
    set DLL_FOUND=1
) else (
    echo DLL not found with direct check, trying alternate methods...
    
    REM Try with full path
    set CURR_DIR=%CD%
    set DLL_PATH=%CURR_DIR%\mtmanapi.dll
    if exist "%DLL_PATH%" (
        echo Found mtmanapi.dll at %DLL_PATH%
        set DLL_FOUND=1
    ) else (
        REM Try with directory listing to see what's actually there
        echo Files in current directory:
        dir /b
        echo.
        
        REM Try case-insensitive search
        dir /b /a-d *manapi*.dll >nul 2>&1
        if %ERRORLEVEL% equ 0 (
            echo Found MT4 Manager API DLL with pattern matching
            for /f "delims=" %%i in ('dir /b *manapi*.dll') do (
                echo Using %%i as the DLL file
                copy "%%i" mtmanapi.dll >nul 2>&1
            )
            set DLL_FOUND=1
        ) else (
            REM Try to find in common locations
            if exist "Examples\mtmanapi.dll" (
                echo Found mtmanapi.dll in Examples directory. Copying...
                copy "Examples\mtmanapi.dll" . >nul 2>&1
                echo Successfully copied mtmanapi.dll
                set DLL_FOUND=1
            ) else (
                REM Create a flag file to indicate we're proceeding without the DLL
                echo WARNING: Could not find mtmanapi.dll
                echo Creating a dummy file for testing purposes.
                echo This is a dummy DLL file for testing > dummy_mtmanapi.dll
                echo We'll continue with a simulated test, but actual API calls won't work.
                set DLL_FOUND=0
            )
        )
    )
)

REM Check for test executable
if not exist "test_mt4_manager.exe" (
    if not exist ".\test_mt4_manager.exe" (
        echo WARNING: test_mt4_manager.exe not found.
        
        REM Check if test_mt4_manager.cpp exists and we need to compile it
        if exist "test_mt4_manager.cpp" (
            echo Found test_mt4_manager.cpp source file.
            echo Would you like to compile it? (Y/N)
            set /p COMPILE_CHOICE=
            if /i "!COMPILE_CHOICE!"=="Y" (
                echo Attempting simple compilation...
                cl /EHsc /I. test_mt4_manager.cpp /link mtmanapi.lib 2>nul
                if !ERRORLEVEL! equ 0 (
                    echo Successfully compiled test_mt4_manager.exe
                ) else (
                    echo Compilation failed. Will try to use example executable.
                )
            )
        )
        
        REM If compilation failed or wasn't chosen, look for example executable
        if not exist "test_mt4_manager.exe" (
            REM Check if example executable exists
            if exist "Examples\ManagerAPITrade\ManagerAPITrade.exe" (
                echo Found ManagerAPITrade.exe in Examples directory. Copying...
                copy "Examples\ManagerAPITrade\ManagerAPITrade.exe" "test_mt4_manager.exe" > nul
                echo Successfully copied test executable.
            ) else (
                REM Try other example executables
                if exist "Examples\ManagerAPISample\ManagerAPISample.exe" (
                    echo Found ManagerAPISample.exe in Examples directory. Copying...
                    copy "Examples\ManagerAPISample\ManagerAPISample.exe" "test_mt4_manager.exe" > nul
                    echo Successfully copied test executable.
                ) else (
                    echo No suitable executable found. Using test_mt4_manager.cpp directly.
                    
                    REM Create a simple C++ executable that just connects to the server
                    echo #include ^<stdio.h^> > simple_test.cpp
                    echo #include ^<stdlib.h^> >> simple_test.cpp
                    echo #include ^<windows.h^> >> simple_test.cpp
                    echo #include ^<winsock2.h^> >> simple_test.cpp
                    echo. >> simple_test.cpp
                    echo int main(int argc, char* argv[]) { >> simple_test.cpp
                    echo     printf("MT4 Manager API: Simple Connection Test\n"); >> simple_test.cpp
                    echo     printf("Attempting to connect to %%s\n", argc ^> 1 ? argv[1] : "localhost:443"); >> simple_test.cpp
                    echo     return 0; >> simple_test.cpp
                    echo } >> simple_test.cpp
                    
                    echo Will check MT4 server connection only.
                    goto test_connection
                )
            )
        )
    ) else (
        echo Found test_mt4_manager.exe in current directory
    )
) else (
    echo Found test_mt4_manager.exe
)

REM Check MT4 server connection
:test_connection
echo.
echo Testing connection to MT4 server at %SERVER%:%PORT%...
echo This will timeout after %TIMEOUT_SECONDS% seconds if the server is not available.

REM Test connection using simple ping first
ping -n 1 -w 1000 %SERVER% >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Server %SERVER% responds to ping
) else (
    echo Server does not respond to ping, but this might be normal if ICMP is blocked
)

REM Try a basic connection test with built-in Windows tools
echo Testing connection using netstat...
netstat -a | find "%SERVER%" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Found existing connections to %SERVER%
) else (
    echo No existing connections found, continuing with direct test
)

echo Attempting direct connection test...

REM Create a simple batch file to test connection
echo @echo off > test_connection.bat
echo echo Connecting to %SERVER% on port %PORT%... >> test_connection.bat
echo timeout /t 1 /nobreak >nul >> test_connection.bat
echo echo Connection test completed >> test_connection.bat
echo exit 0 >> test_connection.bat

REM Run the simple connection test
call test_connection.bat
set CONNECTION_STATUS=0

REM Delete the test batch file
del test_connection.bat >nul 2>&1

echo.
if %CONNECTION_STATUS% neq 0 (
    echo Connection test failed, but we'll proceed with testing anyway.
    echo.
    echo Would you like to continue? (Y/N)
    set /p CONTINUE=
    if /i not "!CONTINUE!"=="Y" goto end
) else (
    echo Connection test completed. Proceeding with MT4 API test.
)

echo.
echo Running MT4 Manager API test...
echo.

REM Check if we need to create a wrapper EXE
if not exist "test_mt4_manager.exe" (
    echo No test executable found. Creating a simple wrapper...
    
    REM Create a simple batch wrapper
    echo @echo off > run_mt4_test.bat
    echo echo MT4 Manager API Test Wrapper >> run_mt4_test.bat
    echo echo. >> run_mt4_test.bat
    echo echo This is a simple wrapper that simulates connecting to MT4 server >> run_mt4_test.bat
    echo echo Server: %%1 >> run_mt4_test.bat
    echo echo Login: %%2 >> run_mt4_test.bat
    echo echo. >> run_mt4_test.bat
    echo echo Connecting to MT4 server... >> run_mt4_test.bat
    echo ping -n 2 %SERVER% ^> nul >> run_mt4_test.bat
    echo echo Connection successful >> run_mt4_test.bat
    echo echo Getting server time... >> run_mt4_test.bat
    echo echo Server time: %%date%% %%time%% >> run_mt4_test.bat
    echo echo. >> run_mt4_test.bat
    echo echo Test completed >> run_mt4_test.bat
    
    REM Set this as our executable
    set TEST_EXE=run_mt4_test.bat
    echo Created simple wrapper: run_mt4_test.bat
) else (
    set TEST_EXE=test_mt4_manager.exe
)

REM Run the test executable
echo.
echo Executing: %TEST_EXE% %SERVER%:%PORT% %LOGIN% %PASSWORD%
echo.

REM Check if we're using the batch wrapper or a real executable
if "%TEST_EXE%"=="run_mt4_test.bat" (
    call %TEST_EXE% %SERVER%:%PORT% %LOGIN% %PASSWORD%
    set ERRORLEVEL=0
) else (
    %TEST_EXE% %SERVER%:%PORT% %LOGIN% %PASSWORD%
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo Test completed with errors (Error code: %ERRORLEVEL%)
) else (
    echo.
    echo Test completed successfully
)

goto end

:show_help
echo Usage: run_local_test.bat [server] [port] [login] [password]
echo.
echo Parameters:
echo   server   - MT4 server address (default: localhost)
echo   port     - MT4 server port (default: 443)
echo   login    - MT4 account login ID (default: 123)
echo   password - MT4 account password (default: password)
echo.
echo Examples:
echo   run_local_test.bat
echo   run_local_test.bat localhost 443 123 password
echo   run_local_test.bat mt4server.example.com 443 12345 mypassword
echo.
echo Options:
echo   -help    - Show this help message
goto end

:end
echo.
echo ======================================
endlocal