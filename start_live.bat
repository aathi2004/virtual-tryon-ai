@echo off
echo ==============================================
echo   STARTING VIRTUAL OUTFIT BACKENDS FOR LIVE
echo ==============================================
echo.

echo Starting Node.js Backend (Port 8000)...
start "Node Backend" cmd /c "cd backend && node server.js"

echo Starting Python AI Service (Port 8001)...
start "Python AI" cmd /c "python main.py"

echo Starting Localtunnels for Public Access...
start "Localtunnel Node (Port 8000)" cmd /c "npx localtunnel --port 8000 --subdomain virtual-outfit-node-api-987"
start "Localtunnel Python (Port 8001)" cmd /c "npx localtunnel --port 8001 --subdomain virtual-outfit-python-api-987"

echo.
echo ==============================================
echo All services are starting in separate windows!
echo PLEASE LEAVE THOSE NEW BLACK WINDOWS OPEN.
echo If you close them, the live website will break.
echo ==============================================
pause
