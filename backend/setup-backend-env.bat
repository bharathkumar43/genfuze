@echo off
echo ========================================
echo    Backend Environment Setup
echo ========================================
echo.

echo Creating backend .env file with Azure configuration...

REM Create the .env file with Azure configuration
(
echo # Server Configuration
echo PORT=5000
echo NODE_ENV=development
echo.
echo # Authentication Configuration
echo AUTH_TYPE=azure
echo ENABLE_LOCAL_AUTH=true
echo.
echo # JWT Configuration
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
echo JWT_EXPIRES_IN=7d
echo JWT_REFRESH_EXPIRES_IN=30d
echo.
echo # Database Configuration
echo DB_PATH=./sessions.db
echo.
echo # Azure AD Configuration
echo AZURE_CLIENT_ID=your-azure-client-id-here
echo AZURE_TENANT_ID=your-azure-tenant-id-here
echo AZURE_CLIENT_SECRET=your-azure-client-secret-here
echo.
echo # Email Configuration - Gmail SMTP
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_SECURE=false
echo SMTP_USER=your-email@gmail.com
echo SMTP_PASS=YOUR_16_CHARACTER_APP_PASSWORD_HERE
echo SMTP_FROM=your-email@gmail.com
echo.
echo # LLM Configuration
echo GEMINI_API_KEY=your-gemini-api-key-here
echo OPENAI_API_KEY=your-openai-api-key-here
echo ANTHROPIC_API_KEY=your-anthropic-api-key-here
echo PERPLEXITY_API_KEY=your-perplexity-api-key-here
echo.
echo # Google Custom Search API Configuration
echo GOOGLE_API_KEY=your-google-api-key-here
echo GOOGLE_CSE_ID=your-google-cse-id-here
echo.
echo # SEMRush API Configuration
echo SEMRUSH_API_KEY=your-semrush-api-key-here
) > .env

echo ✅ Backend .env file created successfully!
echo.
echo 📋 Configuration details:
echo Azure Client ID: your-azure-client-id-here
echo Azure Tenant ID: your-azure-tenant-id-here
echo Auth Type: azure
echo.
echo 🔄 Please restart your backend server:
echo 1. Stop current backend server (Ctrl+C^)
echo 2. Run: node server.js
echo.
echo Then try Microsoft login again!
echo.
pause 