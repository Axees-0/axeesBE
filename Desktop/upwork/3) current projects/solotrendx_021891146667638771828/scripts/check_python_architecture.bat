@echo off
echo Checking Python Architecture...
echo ==============================

rem Activate the virtual environment
call "%~dp0environment\python\venv\Scripts\activate.bat"

rem Run Python to check its architecture
python -c "import platform; import struct; print('Python Version: ' + platform.python_version()); print('Python Architecture: ' + str(8 * struct.calcsize('P')) + ' bit')"

echo ==============================
pause