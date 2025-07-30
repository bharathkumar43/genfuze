# LLM Q&A Backend with Microsoft Entra ID Authentication

This backend server provides authentication and session management for the LLM Q&A Automation Tool using Microsoft Entra ID (formerly Azure AD).

## Features

- 🔐 **Microsoft Entra ID Authentication** - Secure login with Microsoft accounts
- 👥 **User Management** - Multi-tenant user support with roles
- 💾 **Session Storage** - Persistent storage of Q&A sessions
- 🔄 **Token Management** - JWT access tokens with refresh tokens
- 📊 **Statistics** - User-specific analytics and reporting
- 🗄️ **SQLite Database** - Lightweight, file-based database

## Prerequisites

- Node.js 16.0.0 or higher
- Microsoft Entra ID (Azure AD) tenant
- Registered application in Azure AD

## Setup Instructions

### 1. Microsoft Entra ID Configuration

1. **Create an Azure AD Application:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to "Azure Active Directory" → "App registrations"
   - Click "New registration"
   - Name: `LLM Q&A Tool`
   - Supported account types: `Accounts in this organizational directory only`
   - Redirect URI: `http://localhost:3000/auth/callback` (Web)

2. **Configure Authentication:**
   - In your app registration, go to "Authentication"
   - Add platform: "Single-page application (SPA)"
   - Redirect URI: `http://localhost:3000/auth/callback`
   - Enable "Access tokens" and "ID tokens"

3. **Configure API Permissions:**
   - Go to "API permissions"
   - Add permission: "Microsoft Graph" → "User.Read"
   - Grant admin consent

4. **Get Application Credentials:**
   - Note down the "Application (client) ID"
   - Note down the "Directory (tenant) ID"

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Microsoft Entra ID Configuration
AZURE_CLIENT_ID=your-azure-client-id
AZURE_TENANT_ID=your-azure-tenant-id

# Database Configuration
DB_PATH=./sessions.db

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. Installation

```bash
# Install dependencies
npm install

# Initialize database
npm run init-db

# Start development server
npm run dev
```

### 4. Frontend Configuration

Update your frontend environment variables:

```env
REACT_APP_AZURE_CLIENT_ID=your-azure-client-id
REACT_APP_AZURE_TENANT_ID=your-azure-tenant-id
REACT_APP_REDIRECT_URI=http://localhost:3000/auth/callback
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with Microsoft Entra ID
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Sessions

- `POST /api/sessions` - Save session
- `GET /api/sessions/:type` - Get sessions by type (question/answer)
- `GET /api/sessions/:type/:id` - Get specific session
- `DELETE /api/sessions/:id` - Delete session

### Statistics

- `GET /api/stats/:type` - Get session statistics

### Migration

- `POST /api/migrate` - Migrate localStorage data to backend

### Export

- `GET /api/export/:type/csv` - Export sessions to CSV

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  roles TEXT DEFAULT '["user"]',
  is_active BOOLEAN DEFAULT 1,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### User Sessions Table
```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('question', 'answer')),
  timestamp TEXT NOT NULL,
  model TEXT NOT NULL,
  blog_content TEXT,
  blog_url TEXT,
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Security Features

- **JWT Token Validation** - Secure token-based authentication
- **Microsoft Entra ID Integration** - Enterprise-grade authentication
- **User Isolation** - Users can only access their own sessions
- **Token Refresh** - Automatic token renewal
- **Session Cleanup** - Automatic cleanup of expired sessions

## Development

### Running in Development Mode

```bash
npm run dev
```

### Database Management

```bash
# Initialize database
npm run init-db

# View database (if you have SQLite tools)
sqlite3 sessions.db
```

### Environment Variables

All configuration is done through environment variables. See the `.env.example` file for required variables.

## Production Deployment

### Security Considerations

1. **Change Default Secrets:**
   - Update `JWT_SECRET` to a strong, unique value
   - Use environment-specific Azure AD applications

2. **Database Security:**
   - Use a production database (PostgreSQL, MySQL)
   - Implement proper backup strategies

3. **HTTPS:**
   - Always use HTTPS in production
   - Update redirect URIs accordingly

4. **CORS Configuration:**
   - Restrict CORS origins to your domain
   - Remove development origins

### Deployment Options

- **Docker:** Create a Dockerfile for containerized deployment
- **Cloud Platforms:** Deploy to Azure, AWS, or Google Cloud
- **VPS:** Deploy to a virtual private server

## Troubleshooting

### Common Issues

1. **Authentication Errors:**
   - Verify Azure AD application configuration
   - Check redirect URIs match exactly
   - Ensure proper API permissions

2. **Database Errors:**
   - Run `npm run init-db` to recreate database
   - Check file permissions for database file

3. **CORS Errors:**
   - Verify CORS_ORIGIN environment variable
   - Check frontend URL configuration

### Logs

The server logs authentication events and errors. Check the console output for debugging information.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Azure AD documentation
3. Check server logs for error details

## License

MIT License - see LICENSE file for details. 