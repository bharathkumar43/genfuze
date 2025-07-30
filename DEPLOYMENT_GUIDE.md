# 🚀 Live Server Deployment Guide

## 📋 Prerequisites

### **System Requirements:**
- **Node.js**: Version 16.0.0 or higher
- **npm**: Latest version
- **Git**: For cloning the repository
- **PM2** (recommended): For process management
- **Nginx** (recommended): For reverse proxy

### **Server Specifications:**
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 10GB
- **CPU**: 2 cores minimum
- **OS**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+

## 🔧 Installation Steps

### **Step 1: Server Setup**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

### **Step 2: Clone and Setup Project**

```bash
# Clone your repository
git clone <your-repository-url>
cd project.webapp

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

## 📦 Dependencies Installation

### **Frontend Dependencies (package.json):**

```bash
# Core React dependencies
npm install react@^18.3.1 react-dom@^18.3.1
npm install react-router-dom@^7.6.3

# UI and Icons
npm install lucide-react@^0.344.0

# Microsoft Authentication
npm install @azure/msal-browser@^3.7.0

# Development dependencies
npm install -D @vitejs/plugin-react@^4.3.1
npm install -D vite@^7.0.0
npm install -D typescript@^5.5.3
npm install -D tailwindcss@^3.4.1
npm install -D postcss@^8.4.35
npm install -D autoprefixer@^10.4.18
npm install -D eslint@^9.9.1
```

### **Backend Dependencies (backend/package.json):**

```bash
cd backend

# Core server dependencies
npm install express@^4.18.2
npm install cors@^2.8.5
npm install dotenv@^16.3.1

# Authentication
npm install jsonwebtoken@^9.0.2
npm install jwks-rsa@^3.0.1
npm install bcryptjs@^2.4.3
npm install google-auth-library@^10.2.0

# Database
npm install sqlite3@^5.1.7

# Email services
npm install nodemailer@^6.9.7
npm install @sendgrid/mail@^8.1.5

# LLM APIs
npm install openai@^4.20.1
npm install @google/generative-ai@^0.2.1

# Web scraping and automation
npm install puppeteer@^24.12.0
npm install selenium-webdriver@^4.15.0
npm install cheerio@^1.0.0-rc.12
npm install jsdom@^26.1.0
npm install unfluff@^1.1.0

# Utilities
npm install axios@^1.6.0
npm install uuid@^9.0.1
npm install multer@^1.4.5-lts.1

# Development
npm install -D nodemon@^3.0.1
```

## ⚙️ Environment Configuration

### **Frontend Environment (.env):**

```env
# API Configuration
VITE_REACT_APP_API_URL=https://your-domain.com/api

# Authentication Configuration
VITE_REACT_APP_AZURE_CLIENT_ID=your-azure-client-id
VITE_REACT_APP_AZURE_TENANT_ID=your-azure-tenant-id
VITE_REACT_APP_REDIRECT_URI=https://your-domain.com/auth/callback

# Google OAuth Configuration
VITE_REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id

# App Configuration
VITE_APP_NAME=Genfuze.ai
VITE_APP_VERSION=1.0.0
```

### **Backend Environment (backend/.env):**

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Authentication Configuration
AUTH_TYPE=azure
ENABLE_LOCAL_AUTH=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Database Configuration
DB_PATH=./sessions.db

# Azure AD Configuration
AZURE_CLIENT_ID=your-azure-client-id
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_CLIENT_SECRET=your-azure-client-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# LLM Configuration
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key

# Google Custom Search API Configuration
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CSE_ID=your-google-custom-search-engine-id

# SEMRush API Configuration
SEMRUSH_API_KEY=your-semrush-api-key
```

## 🚀 Deployment Commands

### **Step 1: Build Frontend**

```bash
# Build the frontend for production
npm run build

# The build output will be in the 'dist' folder
```

### **Step 2: Start Backend with PM2**

```bash
cd backend

# Start the backend server with PM2
pm2 start server.js --name "genfuze-backend"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### **Step 3: Configure Nginx (Optional)**

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/genfuze

# Add the following configuration:
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (React app)
    location / {
        root /path/to/your/project/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/genfuze /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Security Considerations

### **SSL/HTTPS Setup:**

```bash
# Install Certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Firewall Configuration:**

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 📊 Monitoring and Maintenance

### **PM2 Commands:**

```bash
# Check status
pm2 status

# View logs
pm2 logs genfuze-backend

# Restart application
pm2 restart genfuze-backend

# Stop application
pm2 stop genfuze-backend

# Delete application
pm2 delete genfuze-backend
```

### **Database Backup:**

```bash
# Create backup script
nano backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp backend/sessions.db backend/backup/sessions_$DATE.db
echo "Database backed up: sessions_$DATE.db"
```

## 🔧 Troubleshooting

### **Common Issues:**

1. **Port already in use:**
   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

2. **Permission issues:**
   ```bash
   sudo chown -R $USER:$USER /path/to/your/project
   ```

3. **Node modules issues:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Database issues:**
   ```bash
   cd backend
   node init-database.js
   ```

## 📋 Deployment Checklist

- [ ] Node.js 16+ installed
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Frontend built (`npm run build`)
- [ ] Backend started with PM2
- [ ] Nginx configured (if using)
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Database initialized
- [ ] Email service configured
- [ ] Azure AD app registration updated with production URLs
- [ ] All API keys configured
- [ ] Monitoring setup

## 🆘 Support

If you encounter issues during deployment:

1. Check PM2 logs: `pm2 logs genfuze-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables are set correctly
4. Ensure all API keys are valid and have proper permissions
5. Check firewall and port configurations 