# 🌐 Localhost Configuration Analysis

## 📋 Overview
This document lists all files and line numbers where your application is configured to run on localhost, including ports, URLs, and server configurations.

---

## 🖥️ Frontend Configuration

### **1. Vite Configuration (Main Frontend Server)**
**File**: `vite.config.ts`
- **Line 8**: `port: 5173` - Frontend development server port
- **Line 12**: `target: 'http://localhost:5000'` - Backend API proxy target

```typescript
server: {
  port: 5173,
  host: "::",
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

### **2. Frontend Environment Configuration**
**File**: `env.example`
- **Line 2**: `VITE_REACT_APP_API_URL=http://localhost:5000/api` - Backend API URL
- **Line 6**: `VITE_REACT_APP_REDIRECT_URI=http://localhost:5173/auth/callback` - Auth callback URL

### **3. API Service Configuration**
**File**: `src/services/apiService.ts`
- **Line 4**: `const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;` - API base URL from environment

### **4. Authentication Service Configuration**
**File**: `src/services/authService.ts`
- **Line 2**: `const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000/api';` - Fallback API URL

---

## 🖥️ Backend Configuration

### **1. Main Server Configuration**
**File**: `backend/server.js`
- **Line 38**: `const PORT = process.env.PORT || 5000;` - Backend server port
- **Line 1976**: `app.listen(PORT, () => {` - Server startup
- **Line 3583**: `const resetLink = \`${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}\`;` - Password reset link
- **Line 3647**: `frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'` - Frontend URL for email
- **Line 3664**: `const resetLink = \`${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${testToken}\`;` - Test reset link

### **2. Backend Environment Configuration**
**File**: `backend/env.example`
- **Line 2**: `PORT=5000` - Backend server port

### **3. Email Service Configuration**
**File**: `backend/emailService.js`
- **Line 538**: `<a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}"` - Email template frontend link
- **Line 578**: `Get started now: ${process.env.FRONTEND_URL || 'http://localhost:5173'}` - Email text frontend link

---

## 🧪 Test Files Configuration

### **1. Microsoft Auth Test**
**File**: `backend/test-microsoft-auth.js`
- **Line 21**: `const response = await axios.post('http://localhost:5000/api/auth/login', testData, {` - Test API endpoint

### **2. Enhanced API Test**
**File**: `backend/test-enhanced-api.js`
- **Line 59**: `app.listen(PORT, () => {` - Test server startup
- **Line 61**: `console.log(\`📡 Health check: http://localhost:${PORT}/api/health\`);` - Health check URL
- **Line 62**: `console.log(\`🔍 Test endpoint: http://localhost:${PORT}/api/enhanced-competitors/OpenAI?industry=AI\`);` - Test endpoint URL

### **3. Comprehensive Test**
**File**: `backend/test-comprehensive.js`
- **Line 8**: `const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {` - Login test
- **Line 18**: `const analysisResponse = await axios.post('http://localhost:5000/api/competitor/comprehensive-analysis', {` - Analysis test
- **Line 46**: `const loadResponse = await axios.get('http://localhost:5000/api/competitor/comprehensive-analyses', {` - Load test

### **4. Competitor API Test**
**File**: `backend/test-competitor-api.js`
- **Line 66**: `app.listen(PORT, () => {` - Test server startup
- **Line 68**: `console.log(\`📡 Health check: http://localhost:${PORT}/api/health\`);` - Health check URL
- **Line 69**: `console.log(\`🔍 Test endpoint: http://localhost:${PORT}/api/test-competitors/Cloudfuze?industry=Cloud\`);` - Test endpoint URL

### **5. Auth Logs Test**
**File**: `backend/test-auth-logs.js`
- **Line 8**: `const healthResponse = await axios.get('http://localhost:5000/api/health');` - Health check
- **Line 16**: `const authResponse = await axios.post('http://localhost:5000/api/auth/login', {` - Auth test
- **Line 31**: `const authResponse2 = await axios.post('http://localhost:5000/api/auth/login', {` - Auth test 2
- **Line 44**: `const localAuthResponse = await axios.post('http://localhost:5000/api/auth/local-login', {` - Local auth test
- **Line 57**: `console.log('- Server should be running on port 5000');` - Port info

---

## 📦 Package Configuration

### **1. Frontend Package Scripts**
**File**: `package.json`
- **Line 7**: `"dev": "vite"` - Development server command
- **Line 8**: `"build": "vite build"` - Build command
- **Line 10**: `"preview": "vite preview"` - Preview command

### **2. Backend Package Scripts**
**File**: `backend/package.json`
- **Line 6**: `"start": "node server.js"` - Production server command
- **Line 7**: `"dev": "nodemon server.js"` - Development server command

---

## 🔧 Port Configuration Summary

| Component | Port | File | Line | Purpose |
|-----------|------|------|------|---------|
| **Frontend Dev Server** | 5173 | `vite.config.ts` | 8 | React development server |
| **Backend API Server** | 5000 | `backend/server.js` | 38 | Express.js API server |
| **Frontend Proxy** | 5173 → 5000 | `vite.config.ts` | 12 | API proxy configuration |
| **Auth Callback** | 5173 | `env.example` | 6 | OAuth redirect URI |
| **Email Links** | 5173 | `backend/emailService.js` | 538, 578 | Email template URLs |

---

## 🌐 URL Configuration Summary

| URL | Purpose | File | Line |
|-----|---------|------|------|
| `http://localhost:5173` | Frontend development server | `vite.config.ts` | 8 |
| `http://localhost:5000` | Backend API server | `backend/server.js` | 38 |
| `http://localhost:5000/api` | Backend API endpoints | `env.example` | 2 |
| `http://localhost:5173/auth/callback` | OAuth callback URL | `env.example` | 6 |
| `http://localhost:5173/reset-password` | Password reset page | `backend/server.js` | 3583 |

---

## 🚀 Startup Commands

### **Frontend Development:**
```bash
npm run dev
# Starts on: http://localhost:5173
```

### **Backend Development:**
```bash
cd backend
npm run dev
# Starts on: http://localhost:5000
```

### **Backend Production:**
```bash
cd backend
npm start
# Starts on: http://localhost:5000
```

### **Frontend Build Preview:**
```bash
npm run build
npm run preview
# Starts on: http://localhost:4173 (default Vite preview port)
```

---

## ⚙️ Environment Variables

### **Frontend (.env):**
```env
VITE_REACT_APP_API_URL=http://localhost:5000/api
VITE_REACT_APP_REDIRECT_URI=http://localhost:5173/auth/callback
```

### **Backend (.env):**
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
```

---

## 🔍 Verification Checklist

- [ ] Frontend runs on `http://localhost:5173`
- [ ] Backend runs on `http://localhost:5000`
- [ ] API proxy works from frontend to backend
- [ ] Authentication callbacks redirect correctly
- [ ] Email links point to correct frontend URLs
- [ ] All test files use correct localhost URLs
- [ ] Environment variables are properly configured

---

## 🆘 Troubleshooting

### **Port Already in Use:**
```bash
# Check what's using the port
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# Kill process using the port
taskkill /PID <PID> /F
```

### **Proxy Issues:**
- Verify Vite proxy configuration in `vite.config.ts`
- Check that backend is running on port 5000
- Ensure CORS is properly configured in backend

### **Environment Variables:**
- Copy `env.example` to `.env` in both frontend and backend
- Update URLs for your specific setup
- Restart servers after changing environment variables 