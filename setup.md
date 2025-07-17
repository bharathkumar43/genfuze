# Setup Guide for Genfuze.ai

## Issues Fixed

1. ✅ **Missing SVG files** - Created `google.svg` and `microsoft.svg` in the `public` directory
2. ✅ **Smart Competitor Analysis fallback** - Added fallback competitors when Gemini API key is not configured
3. ✅ **Authentication middleware** - Enhanced to verify user exists in database
4. ✅ **Missing smart-analyses route** - Already exists in the server

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication Configuration
AUTH_TYPE=local
ENABLE_LOCAL_AUTH=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Database Configuration
DB_PATH=./data/users.json
SESSIONS_PATH=./data/sessions.json

# LLM Configuration (Optional - for full functionality)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=
```

### Frontend Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# API Configuration
VITE_REACT_APP_API_URL=http://localhost:5000/api

# Authentication Configuration
VITE_REACT_APP_AZURE_CLIENT_ID=
VITE_REACT_APP_AZURE_TENANT_ID=
VITE_REACT_APP_REDIRECT_URI=http://localhost:5174/auth/callback

# App Configuration
VITE_APP_NAME=Genfuze.ai
VITE_APP_VERSION=1.0.0
```

## Installation and Setup

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Initialize Database

```bash
cd backend
npm run init-db
```

### 3. Start the Application

```bash
# Terminal 1: Start backend server
cd backend
npm start

# Terminal 2: Start frontend development server
npm run dev
```

## Default Login Credentials

When you start the application for the first time, a default admin user will be created:

- **Email**: admin@example.com
- **Password**: admin123

## Features

### Working Features
- ✅ Local authentication (login/register)
- ✅ Session management
- ✅ Smart competitor analysis (with fallback competitors)
- ✅ Content analysis
- ✅ Question generation
- ✅ Answer generation
- ✅ History and statistics

### Features Requiring API Keys
- 🔧 Real competitor discovery (requires Gemini API key)
- 🔧 Advanced LLM features (requires respective API keys)

## Troubleshooting

### 403 Forbidden Error
- Make sure you're logged in
- Check that the JWT token is valid
- Verify the user exists in the database

### 500 Internal Server Error
- Check that the database is initialized
- Verify environment variables are set
- Check server logs for specific error messages

### 404 Not Found
- Ensure the backend server is running on port 5000
- Check that the frontend is making requests to the correct API URL

## API Endpoints

### Authentication
- `POST /api/auth/local-login` - Local login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Smart Competitor Analysis
- `POST /api/competitor/smart-analysis` - Create analysis
- `GET /api/competitor/smart-analyses` - Get all analyses
- `GET /api/competitor/smart-analysis/:id` - Get specific analysis
- `DELETE /api/competitor/smart-analysis/:id` - Delete analysis

### Health Check
- `GET /api/health` - Server health status 