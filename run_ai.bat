@echo off
REM Start the VirtualFit AI service on port 8001.
REM Activates the existing venv if present.

cd /d "%~dp0"

if exist "venv\Scripts\activate.bat" (
    call "venv\Scripts\activate.bat"
)

pip install -q -r requirements.txt

echo.
echo ============================================================
echo   VirtualFit AI ready
echo   Health:    http://localhost:8001/health
echo   Try-On:    POST http://localhost:8001/tryon
echo   In the app modal, paste:  http://localhost:8001
echo ============================================================
echo.

uvicorn main:app --host 0.0.0.0 --port 8001 --reload
