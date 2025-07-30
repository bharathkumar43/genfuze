# 📦 Complete Dependencies List for Genfuze.ai Project

## 🎯 Project Overview
This document contains all dependencies required for both frontend and backend of the Genfuze.ai project.

## 🔧 System Requirements
- **Node.js**: Version 16.0.0 or higher
- **npm**: Latest version
- **Git**: For version control

---

## 🖥️ Frontend Dependencies

### **Production Dependencies** (Frontend)

| Package | Version | Purpose | Installation |
|---------|---------|---------|--------------|
| `@azure/msal-browser` | `^3.7.0` | Microsoft Authentication Library for browser | `npm install @azure/msal-browser@^3.7.0` |
| `lucide-react` | `^0.344.0` | Beautiful & consistent icon toolkit | `npm install lucide-react@^0.344.0` |
| `react` | `^18.3.1` | React JavaScript library | `npm install react@^18.3.1` |
| `react-dom` | `^18.3.1` | React DOM rendering | `npm install react-dom@^18.3.1` |
| `react-router-dom` | `^7.6.3` | React Router for web applications | `npm install react-router-dom@^7.6.3` |

### **Development Dependencies** (Frontend)

| Package | Version | Purpose | Installation |
|---------|---------|---------|--------------|
| `@eslint/js` | `^9.9.1` | ESLint JavaScript rules | `npm install -D @eslint/js@^9.9.1` |
| `@types/react` | `^18.3.5` | TypeScript definitions for React | `npm install -D @types/react@^18.3.5` |
| `@types/react-dom` | `^18.3.0` | TypeScript definitions for React DOM | `npm install -D @types/react-dom@^18.3.0` |
| `@vitejs/plugin-react` | `^4.3.1` | Vite plugin for React | `npm install -D @vitejs/plugin-react@^4.3.1` |
| `autoprefixer` | `^10.4.18` | PostCSS plugin for vendor prefixes | `npm install -D autoprefixer@^10.4.18` |
| `eslint` | `^9.9.1` | JavaScript linting utility | `npm install -D eslint@^9.9.1` |
| `eslint-plugin-react-hooks` | `^5.1.0-rc.0` | ESLint rules for React Hooks | `npm install -D eslint-plugin-react-hooks@^5.1.0-rc.0` |
| `eslint-plugin-react-refresh` | `^0.4.11` | ESLint plugin for React Refresh | `npm install -D eslint-plugin-react-refresh@^0.4.11` |
| `globals` | `^15.9.0` | Global variables for ESLint | `npm install -D globals@^15.9.0` |
| `postcss` | `^8.4.35` | CSS transformation tool | `npm install -D postcss@^8.4.35` |
| `tailwindcss` | `^3.4.1` | Utility-first CSS framework | `npm install -D tailwindcss@^3.4.1` |
| `typescript` | `^5.5.3` | TypeScript compiler | `npm install -D typescript@^5.5.3` |
| `typescript-eslint` | `^8.3.0` | TypeScript ESLint rules | `npm install -D typescript-eslint@^8.3.0` |
| `vite` | `^7.0.0` | Build tool and dev server | `npm install -D vite@^7.0.0` |

---

## 🖥️ Backend Dependencies

### **Production Dependencies** (Backend)

| Package | Version | Purpose | Installation |
|---------|---------|---------|--------------|
| `@google/generative-ai` | `^0.2.1` | Google AI (Gemini) API client | `npm install @google/generative-ai@^0.2.1` |
| `@sendgrid/mail` | `^8.1.5` | SendGrid email service | `npm install @sendgrid/mail@^8.1.5` |
| `axios` | `^1.6.0` | HTTP client for requests | `npm install axios@^1.6.0` |
| `bcryptjs` | `^2.4.3` | Password hashing library | `npm install bcryptjs@^2.4.3` |
| `cheerio` | `^1.0.0-rc.12` | HTML parsing and manipulation | `npm install cheerio@^1.0.0-rc.12` |
| `cors` | `^2.8.5` | Cross-Origin Resource Sharing | `npm install cors@^2.8.5` |
| `dotenv` | `^16.3.1` | Environment variables loader | `npm install dotenv@^16.3.1` |
| `express` | `^4.18.2` | Web application framework | `npm install express@^4.18.2` |
| `google-auth-library` | `^10.2.0` | Google Auth Library | `npm install google-auth-library@^10.2.0` |
| `jsdom` | `^26.1.0` | JavaScript DOM implementation | `npm install jsdom@^26.1.0` |
| `jsonwebtoken` | `^9.0.2` | JWT token handling | `npm install jsonwebtoken@^9.0.2` |
| `jwks-rsa` | `^3.0.1` | RSA JSON Web Key Set | `npm install jwks-rsa@^3.0.1` |
| `multer` | `^1.4.5-lts.1` | File upload middleware | `npm install multer@^1.4.5-lts.1` |
| `nodemailer` | `^6.9.7` | Email sending library | `npm install nodemailer@^6.9.7` |
| `openai` | `^4.20.1` | OpenAI API client | `npm install openai@^4.20.1` |
| `puppeteer` | `^24.12.0` | Headless Chrome automation | `npm install puppeteer@^24.12.0` |
| `selenium-webdriver` | `^4.15.0` | Selenium WebDriver | `npm install selenium-webdriver@^4.15.0` |
| `sqlite3` | `^5.1.7` | SQLite database driver | `npm install sqlite3@^5.1.7` |
| `unfluff` | `^1.1.0` | Web page content extraction | `npm install unfluff@^1.1.0` |
| `uuid` | `^9.0.1` | UUID generation | `npm install uuid@^9.0.1` |

### **Development Dependencies** (Backend)

| Package | Version | Purpose | Installation |
|---------|---------|---------|--------------|
| `nodemon` | `^3.0.1` | Development server with auto-restart | `npm install -D nodemon@^3.0.1` |

---

## 🚀 Quick Installation Commands

### **Frontend Installation:**
```bash
# Navigate to project root
cd project.webapp

# Install all frontend dependencies
npm install
```

### **Backend Installation:**
```bash
# Navigate to backend directory
cd backend

# Install all backend dependencies
npm install
```

### **Complete Project Installation:**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

---

## 📊 Dependency Categories

### **Frontend Categories:**
- **Core Framework**: React, React DOM, React Router
- **UI/UX**: Lucide React (icons), Tailwind CSS
- **Authentication**: Azure MSAL Browser
- **Build Tools**: Vite, TypeScript, PostCSS
- **Development**: ESLint, TypeScript ESLint

### **Backend Categories:**
- **Web Framework**: Express.js
- **Authentication**: JWT, bcryptjs, jwks-rsa, Google Auth
- **Database**: SQLite3
- **Email Services**: Nodemailer, SendGrid
- **AI/LLM APIs**: OpenAI, Google AI, Anthropic
- **Web Scraping**: Puppeteer, Selenium, Cheerio, jsdom, unfluff
- **Utilities**: Axios, UUID, Multer, CORS, dotenv
- **Development**: Nodemon

---

## 🔧 Global Dependencies (Optional)

### **Process Management:**
```bash
# Install PM2 globally for production process management
npm install -g pm2
```

### **Development Tools:**
```bash
# Install nodemon globally (alternative to local installation)
npm install -g nodemon
```

---

## 📋 Installation Checklist

### **Before Installation:**
- [ ] Node.js 16+ installed
- [ ] npm installed
- [ ] Git repository cloned
- [ ] Project directory structure verified

### **Frontend Installation:**
- [ ] `npm install` completed
- [ ] All frontend dependencies installed
- [ ] TypeScript configuration verified
- [ ] Vite configuration verified

### **Backend Installation:**
- [ ] `cd backend && npm install` completed
- [ ] All backend dependencies installed
- [ ] Database initialization ready
- [ ] Environment variables configured

### **Post-Installation:**
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend starts successfully (`npm start`)
- [ ] All API endpoints accessible
- [ ] Authentication working
- [ ] Database connections established

---

## 🆘 Troubleshooting

### **Common Issues:**

1. **Node.js Version Issues:**
   ```bash
   # Check Node.js version
   node --version
   
   # Update Node.js if needed
   # Download from: https://nodejs.org/
   ```

2. **Permission Issues:**
   ```bash
   # Fix npm permissions
   sudo chown -R $USER:$USER ~/.npm
   sudo chown -R $USER:$USER ~/.config
   ```

3. **Package Lock Issues:**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Backend Database Issues:**
   ```bash
   # Initialize database
   cd backend
   node init-database.js
   ```

---

## 📈 Dependency Statistics

- **Total Frontend Dependencies**: 5 production + 13 development = 18 packages
- **Total Backend Dependencies**: 20 production + 1 development = 21 packages
- **Total Project Dependencies**: 39 packages
- **Estimated Installation Time**: 2-5 minutes (depending on internet speed)
- **Estimated Disk Space**: ~500MB (including node_modules)

---

## 🔄 Update Commands

### **Update All Dependencies:**
```bash
# Frontend
npm update

# Backend
cd backend && npm update && cd ..
```

### **Check for Outdated Packages:**
```bash
# Frontend
npm outdated

# Backend
cd backend && npm outdated && cd ..
```

### **Update Specific Package:**
```bash
# Frontend
npm update package-name

# Backend
cd backend && npm update package-name && cd ..
``` 