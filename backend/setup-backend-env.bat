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
echo AZURE_CLIENT_ID=8d042e34-5a5f-40f5-a019-ee56de49b64e
echo AZURE_TENANT_ID=c16b04b5-b78c-4cce-b3f8-93686f221d09
echo AZURE_CLIENT_SECRET=9b2990a3-ddb5-4d8c-99a4-9fde74527f2c
echo.
echo # Email Configuration - Gmail SMTP
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_SECURE=false
echo SMTP_USER=bharathkumartummaganti@gmail.com
echo SMTP_PASS=mjzzmqcdnmlmvkpu
echo SMTP_FROM=bharathkumartummaganti@gmail.com
echo.
echo # LLM Configuration
echo GEMINI_API_KEY=AIzaSyCMO28d7v8lI8W9VIOL-ENdMmlw9okPoJw
echo OPENAI_API_KEY=sk-proj-oTdt5VbswBQQ0QTOsDWiu-n4dM-jyAZaLV6o8HbGXLeJFza_AmLjv3wdeeqAFDtwgbhzm2XoZtT3BlbkFJ
echo ANTHROPIC_API_KEY=sk-ant-api03-a9URLvR57WsNBgGz75ApE_rQmV5CeKlT9J3_8fJEDHvpVbNKXlc8OQOheryUl1bZT21h-VLjEJ
echo PERPLEXITY_API_KEY=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
echo.
echo # Google Custom Search API Configuration
echo GOOGLE_API_KEY=AIzaSyAIcgHdsXXO1lbmVE1Pz7tX1CpcwFIlkJQ
echo GOOGLE_CSE_ID=14fbe1a7daee04f27
echo.
echo # SEMRush API Configuration
echo SEMRUSH_API_KEY=2973aea29571fe45909495a1dde09472
) > .env

echo ✅ Backend .env file created successfully!
echo.
echo 📋 Configuration details:
echo Azure Client ID: 8d042e34-5a5f-40f5-a019-ee56de49b64e
echo Azure Tenant ID: c16b04b5-b78c-4cce-b3f8-93686f221d09
echo Auth Type: azure
echo.
echo 🔄 Please restart your backend server:
echo 1. Stop current backend server (Ctrl+C^)
echo 2. Run: node server.js
echo.
echo Then try Microsoft login again!
echo.
pause 