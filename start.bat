@echo off
echo Starting Genfuze.ai Application...
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo Checking if npm is installed...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies.
    pause
    exit /b 1
)

echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies.
    pause
    exit /b 1
)

echo Initializing database...
call npm run init-db
if errorlevel 1 (
    echo ERROR: Failed to initialize database.
    pause
    exit /b 1
)

echo.
echo Starting backend server...
start "Backend Server" cmd /k "npm start"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting frontend development server...
start "Frontend Server" cmd /k "cd .. && npm run dev"

echo.
echo Application is starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5174
echo.
echo Default login credentials:
echo Email: admin@example.com
echo Password: admin123
echo.
echo Press any key to close this window...
pause >nul 