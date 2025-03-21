@echo off
echo Setting up SoloTrend X virtual environment...
echo.

rem Get the current directory
set PROJECT_ROOT=%~dp0
echo Project root: %PROJECT_ROOT%

rem Define the virtual environment path
set VENV_DIR=%PROJECT_ROOT%environment\python\venv
echo Virtual environment: %VENV_DIR%

rem Check if the virtual environment exists
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo Virtual environment not found!
    echo Please create the virtual environment first using:
    echo python -m venv %VENV_DIR%
    exit /b 1
)

rem Activate the virtual environment
call %VENV_DIR%\Scripts\activate.bat

rem Install required dependencies
echo Installing required dependencies...
pip install -r %PROJECT_ROOT%requirements.txt
pip install flask-cors

echo.
echo Virtual environment setup complete!
echo.
echo Now you can run start_all_services.bat to start the system.
pause