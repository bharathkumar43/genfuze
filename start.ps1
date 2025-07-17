Write-Host "Starting Genfuze.ai Application..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking if Node.js is installed..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is installed
Write-Host "Checking if npm is installed..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed. Please install npm first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "Frontend dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install frontend dependencies." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
try {
    Set-Location backend
    npm install
    Write-Host "Backend dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install backend dependencies." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Initialize database
Write-Host "Initializing database..." -ForegroundColor Yellow
try {
    npm run init-db
    Write-Host "Database initialized successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to initialize database." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting frontend development server..." -ForegroundColor Yellow
Set-Location ..
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Application is starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5174" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default login credentials:" -ForegroundColor Yellow
Write-Host "Email: admin@example.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to close this window..." -ForegroundColor Gray
Read-Host 