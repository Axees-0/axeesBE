@echo off
echo Setting up Python Virtual Environment with Dependencies...
echo.

rem Get the current directory and fix path issues
set "PROJECT_ROOT=%~dp0"
echo Project root: %PROJECT_ROOT%

rem Check Python installation
echo Checking Python installation...
python --version > nul 2>&1
if ERRORLEVEL 1 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python and make sure it's in your PATH.
    goto END
)

rem Create or activate virtual environment
if exist "%PROJECT_ROOT%venv\Scripts\activate.bat" (
    echo Virtual environment already exists, activating it...
    call "%PROJECT_ROOT%venv\Scripts\activate.bat"
) else (
    echo Creating new virtual environment...
    python -m venv "%PROJECT_ROOT%venv"
    if ERRORLEVEL 1 (
        echo ERROR: Failed to create virtual environment.
        goto END
    )
    call "%PROJECT_ROOT%venv\Scripts\activate.bat"
)

echo.
echo Upgrading pip...
python -m pip install --upgrade pip

echo.
echo Installing required dependencies from requirements.txt...
pip install -r "%PROJECT_ROOT%requirements.txt"

echo.
echo Installing additional necessary packages...
pip install flask-cors pyjwt

echo.
echo Checking installed packages...
pip list

echo.
echo Virtual environment setup complete!
echo You can now run the services using the start_all_services.bat script.
echo.

:END
pause