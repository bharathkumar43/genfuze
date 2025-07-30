# PowerShell script to update frontend .env file with Azure configuration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Frontend Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ Found .env file" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Creating from env.example..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
}

Write-Host ""
Write-Host "🔄 Updating .env file with Azure configuration..." -ForegroundColor Yellow

# Read the current .env content
$envContent = Get-Content ".env" -Raw

# Azure configuration values from backend
$azureClientId = "your-azure-client-id-here"
$azureTenantId = "your-azure-tenant-id-here"

# Update the Azure configuration lines
$updatedContent = $envContent -replace "VITE_REACT_APP_AZURE_CLIENT_ID=", "VITE_REACT_APP_AZURE_CLIENT_ID=$azureClientId"
$updatedContent = $updatedContent -replace "VITE_REACT_APP_AZURE_TENANT_ID=", "VITE_REACT_APP_AZURE_TENANT_ID=$azureTenantId"

# Write the updated content
$updatedContent | Out-File ".env" -Encoding UTF8

Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Updated configuration:" -ForegroundColor White
Write-Host "Azure Client ID: $azureClientId" -ForegroundColor Gray
Write-Host "Azure Tenant ID: $azureTenantId" -ForegroundColor Gray
Write-Host ""
Write-Host "🔄 Please restart your frontend development server:" -ForegroundColor Yellow
Write-Host "1. Stop current frontend server (Ctrl+C)" -ForegroundColor Gray
Write-Host "2. Run: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Then try Microsoft login again!" -ForegroundColor Green 