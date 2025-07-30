@echo off
echo ========================================
echo    Updating Frontend Environment
echo ========================================
echo.

echo Updating .env file with Azure configuration...

REM Create a temporary file with the updated content
(
echo # API Configuration
echo VITE_REACT_APP_API_URL=http://localhost:5000/api
echo.
echo # Authentication Configuration
echo VITE_REACT_APP_AZURE_CLIENT_ID=your-azure-client-id-here
echo VITE_REACT_APP_AZURE_TENANT_ID=your-azure-tenant-id-here
echo VITE_REACT_APP_REDIRECT_URI=http://localhost:5173/auth/callback
echo.
echo # Google OAuth Configuration
echo VITE_REACT_APP_GOOGLE_CLIENT_ID=
echo.
echo # App Configuration
echo VITE_APP_NAME=Genfuze.ai
echo VITE_APP_VERSION=1.0.0
) > .env

echo ✅ .env file updated successfully!
echo.
echo 📋 Updated configuration:
echo Azure Client ID: your-azure-client-id-here
echo Azure Tenant ID: your-azure-tenant-id-here
echo.
echo 🔄 Please restart your frontend development server:
echo 1. Stop current frontend server (Ctrl+C^)
echo 2. Run: npm run dev
echo.
echo Then try Microsoft login again!
echo.
pause 