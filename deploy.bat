@echo off
echo 🚀 Starting Genfuze.ai Deployment for Windows...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18.x or higher.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ npm is installed:
npm --version

REM Check if we're in the project directory
if not exist "package.json" (
    echo ❌ Please run this script from the project root directory (where package.json is located)
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Backend directory not found. Please ensure you're in the correct project directory.
    pause
    exit /b 1
)

echo 📦 Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed successfully

echo 📦 Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..
echo ✅ Backend dependencies installed successfully

echo 🔨 Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)
echo ✅ Frontend built successfully

REM Create backup directory
if not exist "backend\backup" mkdir backend\backup

REM Create logs directory
if not exist "backend\logs" mkdir backend\logs

echo 📋 Creating PM2 ecosystem file...
(
echo module.exports = {
echo   apps: [{
echo     name: 'genfuze-backend',
echo     script: './backend/server.js',
echo     cwd: './backend',
echo     instances: 1,
echo     autorestart: true,
echo     watch: false,
echo     max_memory_restart: '1G',
echo     env: {
echo       NODE_ENV: 'production',
echo       PORT: 5000
echo     },
echo     error_file: './logs/err.log',
echo     out_file: './logs/out.log',
echo     log_file: './logs/combined.log',
echo     time: true
echo   }]
echo }
) > ecosystem.config.js

echo 🚀 Starting backend with PM2...
cd backend
call pm2 start ecosystem.config.js
if %errorlevel% neq 0 (
    echo ❌ Failed to start backend with PM2
    echo Please install PM2 first: npm install -g pm2
    pause
    exit /b 1
)
cd ..

echo 💾 Saving PM2 configuration...
call pm2 save

echo 📋 Creating deployment summary...
(
echo # 🚀 Deployment Summary
echo.
echo ## ✅ Installation Complete
echo.
echo ### Installed Components:
echo - Node.js: 
node --version
echo - npm: 
npm --version
echo - PM2 ^(Process Manager^)
echo - All frontend dependencies
echo - All backend dependencies
echo - Production build created
echo.
echo ### Next Steps:
echo.
echo 1. **Configure Environment Variables:**
echo    - Update `backend/.env` with your production settings
echo    - Update `.env` with your production frontend settings
echo.
echo 2. **Setup IIS or Nginx ^(Optional^):**
echo    - Configure reverse proxy for your domain
echo.
echo 3. **Setup SSL Certificate:**
echo    - Install SSL certificate for your domain
echo.
echo 4. **Configure Windows Firewall:**
echo    - Allow ports 80, 443, and 5000
echo.
echo 5. **Update Azure AD Configuration:**
echo    - Add your production domain to Azure AD app registration
echo    - Update redirect URIs to your production domain
echo.
echo ### PM2 Commands:
echo - Check status: `pm2 status`
echo - View logs: `pm2 logs genfuze-backend`
echo - Restart: `pm2 restart genfuze-backend`
echo - Stop: `pm2 stop genfuze-backend`
echo.
echo ### Important Files:
echo - Frontend build: `dist/` folder
echo - Backend: `backend/server.js`
echo - Environment: `backend/.env` and `.env`
echo - Database: `backend/sessions.db`
) > DEPLOYMENT_SUMMARY.md

echo ✅ Deployment script completed successfully!
echo 📖 Please check DEPLOYMENT_SUMMARY.md for next steps
echo ⚠️ Don't forget to configure your environment variables before starting the application!
pause 