# PowerShell script to update .env file with correct email configuration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Email Configuration Update" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if clean-env-template.txt exists
if (Test-Path "clean-env-template.txt") {
    Write-Host "✅ Found clean environment template" -ForegroundColor Green
} else {
    Write-Host "❌ clean-env-template.txt not found!" -ForegroundColor Red
    Write-Host "Please make sure the template file exists." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📧 Before proceeding, make sure you have:" -ForegroundColor Yellow
Write-Host "1. Enabled 2-Factor Authentication on your Gmail account" -ForegroundColor White
Write-Host "2. Generated an App Password from Google Account settings" -ForegroundColor White
Write-Host "3. Copied the 16-character App Password" -ForegroundColor White
Write-Host ""

$appPassword = Read-Host "Enter your 16-character Gmail App Password" -AsSecureString
$appPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($appPassword))

if ($appPasswordPlain.Length -ne 16) {
    Write-Host "❌ App Password should be exactly 16 characters!" -ForegroundColor Red
    Write-Host "Please generate a new App Password from Google Account settings." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔄 Updating .env file..." -ForegroundColor Yellow

# Read the template
$templateContent = Get-Content "clean-env-template.txt" -Raw

# Replace the placeholder with the actual app password
$updatedContent = $templateContent -replace "YOUR_16_CHARACTER_APP_PASSWORD_HERE", $appPasswordPlain

# Backup existing .env
if (Test-Path ".env") {
    Copy-Item ".env" ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Write-Host "✅ Backed up existing .env file" -ForegroundColor Green
}

# Write the updated content
$updatedContent | Out-File ".env" -Encoding UTF8

Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Testing email configuration..." -ForegroundColor Yellow

# Test the configuration
try {
    node test-email-config.js
} catch {
    Write-Host "❌ Error running test script" -ForegroundColor Red
    Write-Host "You can test manually by running: node test-email-config.js" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If the test was successful, restart your server:" -ForegroundColor White
Write-Host "1. Stop current server (Ctrl+C)" -ForegroundColor Gray
Write-Host "2. Run: node server.js" -ForegroundColor Gray
Write-Host ""
Write-Host "Then test the password reset functionality!" -ForegroundColor Green 