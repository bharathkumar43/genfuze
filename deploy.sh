#!/bin/bash

# 🚀 Genfuze.ai Deployment Script
# This script automates the deployment process for the live server

echo "🚀 Starting Genfuze.ai Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root. Use a regular user with sudo privileges."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_status "Node.js not found. Installing Node.js 18.x..."
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    if ! command -v node &> /dev/null; then
        print_error "Failed to install Node.js"
        exit 1
    fi
    print_success "Node.js installed successfully"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js already installed: $NODE_VERSION"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install npm."
    exit 1
else
    NPM_VERSION=$(npm --version)
    print_success "npm already installed: $NPM_VERSION"
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 globally..."
    sudo npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_success "PM2 already installed"
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    print_status "Installing Git..."
    sudo apt update
    sudo apt install git -y
    print_success "Git installed successfully"
else
    print_success "Git already installed"
fi

# Check if we're in the project directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory (where package.json is located)"
    exit 1
fi

print_status "Installing frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_status "Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

print_status "Building frontend for production..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
else
    print_error "Failed to build frontend"
    exit 1
fi

# Create backup directory
mkdir -p backend/backup

print_status "Setting up PM2 ecosystem file..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'genfuze-backend',
    script: './backend/server.js',
    cwd: './backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Create logs directory
mkdir -p backend/logs

print_status "Starting backend with PM2..."
cd backend
pm2 start ecosystem.config.js
if [ $? -eq 0 ]; then
    print_success "Backend started successfully with PM2"
else
    print_error "Failed to start backend with PM2"
    exit 1
fi

# Save PM2 configuration
pm2 save
print_success "PM2 configuration saved"

# Setup PM2 to start on system boot
pm2 startup
print_warning "Please run the command shown above to setup PM2 startup"

cd ..

print_status "Creating deployment summary..."
cat > DEPLOYMENT_SUMMARY.md << EOF
# 🚀 Deployment Summary

## ✅ Installation Complete

### Installed Components:
- Node.js $(node --version)
- npm $(npm --version)
- PM2 (Process Manager)
- All frontend dependencies
- All backend dependencies
- Production build created

### Next Steps:

1. **Configure Environment Variables:**
   - Update \`backend/.env\` with your production settings
   - Update \`.env\` with your production frontend settings

2. **Setup Nginx (Optional):**
   - Install Nginx: \`sudo apt install nginx -y\`
   - Configure reverse proxy for your domain

3. **Setup SSL Certificate:**
   - Install Certbot: \`sudo apt install certbot python3-certbot-nginx -y\`
   - Get SSL certificate: \`sudo certbot --nginx -d your-domain.com\`

4. **Configure Firewall:**
   - \`sudo ufw allow ssh\`
   - \`sudo ufw allow 80\`
   - \`sudo ufw allow 443\`
   - \`sudo ufw enable\`

5. **Update Azure AD Configuration:**
   - Add your production domain to Azure AD app registration
   - Update redirect URIs to your production domain

### PM2 Commands:
- Check status: \`pm2 status\`
- View logs: \`pm2 logs genfuze-backend\`
- Restart: \`pm2 restart genfuze-backend\`
- Stop: \`pm2 stop genfuze-backend\`

### Important Files:
- Frontend build: \`dist/\` folder
- Backend: \`backend/server.js\`
- Environment: \`backend/.env\` and \`.env\`
- Database: \`backend/sessions.db\`

EOF

print_success "Deployment script completed successfully!"
print_status "Please check DEPLOYMENT_SUMMARY.md for next steps"
print_warning "Don't forget to configure your environment variables before starting the application!" 