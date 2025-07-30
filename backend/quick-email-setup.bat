@echo off
echo ========================================
echo    Email Setup for Genfuze.ai
echo ========================================
echo.
echo This will help you set up email for password reset functionality.
echo.
echo Before running this script, make sure you have:
echo 1. Enabled 2-Factor Authentication on your Gmail account
echo 2. Generated an App Password from Google Account settings
echo.
echo To generate an App Password:
echo 1. Go to: https://myaccount.google.com/security
echo 2. Click "2-Step Verification"
echo 3. Scroll down and click "App passwords"
echo 4. Select "Mail" and generate a password
echo.
pause

echo.
echo ========================================
echo    Testing Current Email Configuration
echo ========================================
echo.
node test-email-config.js

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo If you see "Test email sent successfully!" above, your email is working!
echo.
echo If you see errors, please:
echo 1. Check your Gmail App Password
echo 2. Make sure 2-Factor Authentication is enabled
echo 3. Update your .env file with correct credentials
echo.
echo Files created for you:
echo - EMAIL_SETUP_GUIDE.md (detailed instructions)
echo - QUICK_EMAIL_SETUP.md (quick reference)
echo - test-email-config.js (test your setup)
echo.
pause 