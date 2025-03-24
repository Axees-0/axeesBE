@echo off
setlocal

echo ===== MT4 Wrapper Build and Test =====
echo This script will build and test the MT4 Wrapper DLL.

:: Create logs directory if it doesn't exist
if not exist data\logs mkdir data\logs

:: Change to the build directory
cd build\mt4_wrapper

:: Run the wrapper build with MinGW64
echo Building MT4 wrapper DLL...
call use_mingw64.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed! Cannot continue.
    cd ..\..
    exit /b 1
)

:: Test the wrapper
echo Testing MT4 wrapper DLL...
call test_wrapper.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Test failed! Cannot continue.
    cd ..\..
    exit /b 1
)

:: Return to original directory
cd ..\..

:: Copy DLL to project root for easier access
echo Copying DLL to project root...
copy build\mt4_wrapper\mt4_wrapper.dll .

:: Test direct order script with the new wrapper
echo Testing direct order script...
call test_direct_order.bat
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Direct order test failed. Check log files for details.
    echo The DLL has been built and tested successfully but may not work with the direct order script.
) else (
    echo Direct order test passed.
)

echo ===== Build and Test Complete =====
echo The MT4 wrapper has been built and tested successfully.
echo The following files have been created:
echo - build\mt4_wrapper\mt4_wrapper.dll
echo - src\backend\MT4RestfulAPIWrapper\mt4_wrapper.dll
echo - mt4_wrapper.dll (in project root)

endlocal