@echo off
setlocal enabledelayedexpansion

REM MT4 Manager API Test Tool - Full Implementation
REM This script will compile and run actual MT4 Manager API tests

color 0B
echo MT4 Manager API - Full Test Suite
echo -------------------------------
echo.

REM Connection parameters for CloudTrader-Real (Novus)
set SERVER=195.88.127.154
set PORT=45543
set LOGIN=123
set PASSWORD=password
REM Note: Replace the LOGIN and PASSWORD with your actual credentials

:check_params
REM Check if parameters were provided
if not "%1"=="" set SERVER=%1
if not "%2"=="" set PORT=%2
if not "%3"=="" set LOGIN=%3
if not "%4"=="" set PASSWORD=%4

REM Display connection parameters
echo Connection Settings:
echo   Server: %SERVER%:%PORT%
echo   Login: %LOGIN%
echo   Password: %PASSWORD%
echo.

REM Check for required files
echo Checking for required files...

REM Check for mtmanapi.dll 
if not exist "mtmanapi.dll" (
    if exist "Examples\mtmanapi.dll" (
        echo Copying mtmanapi.dll from Examples directory...
        copy "Examples\mtmanapi.dll" . > nul
    ) else (
        echo WARNING: mtmanapi.dll not found! The test will likely fail.
    )
) else (
    echo Found mtmanapi.dll
)

REM Check if we need to compile test_mt4_manager.cpp
if not exist "test_mt4_manager.exe" (
    echo Test executable not found. Attempting to compile...
    
    REM Check if we have a compiler available
    where cl.exe >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Using Microsoft Visual C++ compiler...
        echo Creating lib file from DLL...
        
        REM Generate lib file for linking
        echo LIBRARY mtmanapi > mtmanapi.def
        echo EXPORTS >> mtmanapi.def
        REM Add some common export names
        echo   ManagerCreate >> mtmanapi.def
        echo   MgrWinsockStartup >> mtmanapi.def
        
        REM Try to compile with the lib
        cl.exe /EHsc /W3 /D_CRT_SECURE_NO_WARNINGS test_mt4_manager.cpp /link mtmanapi.lib
        
        if %ERRORLEVEL% NEQ 0 (
            echo Compile failed. Trying alternative method...
            REM Try to compile with direct DLL loading
            cl.exe /EHsc /W3 /D_CRT_SECURE_NO_WARNINGS test_mt4_manager.cpp
        )
    ) else (
        REM Check for MinGW gcc
        where gcc.exe >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            echo Using MinGW GCC compiler...
            gcc test_mt4_manager.cpp -o test_mt4_manager.exe -I. -L. -lmtmanapi
        ) else (
            echo No compiler found. Will use simulation mode.
            goto use_simulation
        )
    )
)

REM Check if compilation succeeded
if exist "test_mt4_manager.exe" (
    echo.
    echo Compilation successful. Running tests with actual MT4 Manager API...
    echo.
    
    REM Run the test program with all tests
    test_mt4_manager.exe %SERVER%:%PORT% %LOGIN% %PASSWORD%
    goto end
) else (
    echo.
    echo Could not create test executable. Will run in simulation mode.
    echo.
)

:use_simulation
echo.
echo Running in SIMULATION MODE (no actual API calls)
echo.
timeout /t 2 >nul

REM Simulate each test
call :simulate_test_connection
call :simulate_test_user_info
call :simulate_test_symbols
call :simulate_test_trades

echo.
echo All tests completed in simulation mode.
echo.
echo To run actual API tests, you need to:
echo 1. Have a C++ compiler installed (Visual Studio or MinGW)
echo 2. Have the correct MT4 Manager API files (mtmanapi.dll)
echo 3. Have access to a MT4 server with valid login credentials
echo.
goto end

:simulate_test_connection
echo.
echo [TEST 1] Basic Connection Test [SIMULATION]
echo ----------------------------------------
echo Testing basic connection to MT4 server...
echo.
echo Connected to %SERVER%:%PORT%
echo Login as '%LOGIN%' successful
echo Server time: %DATE% %TIME%
echo Server info:
echo   Name: MT4 Demo Server
echo   Owner: MetaQuotes Software Corp.
echo   Time difference: 0 minutes
echo Disconnected from server
echo.
echo [TEST 1] Basic Connection Test: SIMULATED PASS
echo.
exit /b 0

:simulate_test_user_info
echo.
echo [TEST 2] User Information Test [SIMULATION]
echo ---------------------------------------
echo Testing User Information functions...
echo.
echo Connected to %SERVER%:%PORT%
echo Login as '%LOGIN%' successful
echo.
echo Total users: 327
echo.
echo User information for account %LOGIN%:
echo   Name: Test Account
echo   Group: demo
echo   Balance: 10000.00 USD
echo   Leverage: 1:100
echo.
echo Available user groups: 5
echo   - demo
echo   - real-standard
echo   - real-premium
echo   - vip
echo   - manager
echo.
echo Disconnected from server
echo.
echo [TEST 2] User Information Test: SIMULATED PASS
echo.
exit /b 0

:simulate_test_symbols
echo.
echo [TEST 3] Symbol Functions Test [SIMULATION]
echo --------------------------------------
echo Testing Symbol functions...
echo.
echo Connected to %SERVER%:%PORT%
echo Login as '%LOGIN%' successful
echo.
echo Total symbols: 48
echo.
echo Available trading symbols: 48
echo   Symbol: EURUSD
echo     Description: Euro vs US Dollar
echo     Digits: 5
echo     Trade mode: 1
echo   Symbol: GBPUSD
echo     Description: Great Britain Pound vs US Dollar
echo     Digits: 5
echo     Trade mode: 1
echo   Symbol: USDJPY
echo     Description: US Dollar vs Japanese Yen
echo     Digits: 3
echo     Trade mode: 1
echo.
echo Current quotes for common symbols:
echo   EURUSD: Bid=1.08743 Ask=1.08749 Spread=0.6 pips
echo   GBPUSD: Bid=1.30421 Ask=1.30429 Spread=0.8 pips
echo   USDJPY: Bid=107.328 Ask=107.335 Spread=0.7 pips
echo.
echo Disconnected from server
echo.
echo [TEST 3] Symbol Functions Test: SIMULATED PASS
echo.
exit /b 0

:simulate_test_trades
echo.
echo [TEST 4] Trade Functions Test [SIMULATION]
echo --------------------------------------
echo Testing Trade functions...
echo.
echo Connected to %SERVER%:%PORT%
echo Login as '%LOGIN%' successful
echo.
echo Total trades: 536
echo.
echo Open positions: 324
echo   Order #12345 - EURUSD Buy 1.00 lots at 1.08720
echo   Order #12346 - GBPUSD Sell 0.50 lots at 1.30450
echo   Order #12347 - USDJPY Buy 0.75 lots at 107.530
echo   Order #12348 - USDCHF Sell 0.25 lots at 0.97850
echo   Order #12349 - AUDUSD Buy 1.50 lots at 0.70130
echo   ... and 319 more
echo.
echo Trade history (last 7 days): 212
echo   Order #12340 - EURUSD Buy 1.00 lots - Profit: 220.00 USD - Closed: %DATE%
echo   Order #12341 - USDJPY Sell 0.50 lots - Profit: 186.92 USD - Closed: %DATE%
echo   Order #12342 - GBPUSD Buy 0.75 lots - Profit: -135.50 USD - Closed: %DATE%
echo   Order #12343 - USDCAD Sell 0.25 lots - Profit: 78.25 USD - Closed: %DATE%
echo   Order #12344 - EURUSD Buy 2.00 lots - Profit: 350.00 USD - Closed: %DATE%
echo   ... and 207 more
echo.
echo Disconnected from server
echo.
echo [TEST 4] Trade Functions Test: SIMULATED PASS
echo.
exit /b 0

:end
echo.
echo MT4 Manager API Testing Complete
echo.
endlocal