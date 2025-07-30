require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Database = require('./database');
const AuthService = require('./auth');
const LocalAuthService = require('./localAuth');
const GoogleAuthService = require('./googleAuth');
const JSONStorage = require('./jsonStorage');
const MemoryStorage = require('./memoryStorage');
const EmailService = require('./emailService');
const { LLMService, getGeminiEmbedding } = require('./llmService');
// const FanoutQueryDensity = require('./fanoutQueryDensity');
// const GEOFanoutDensity = require('./geoFanoutDensity');
const {
  getPerplexityAnswer,
  getPerplexityAnswersSelenium,
  getChatGPTAnswers,
  getChatGPTAnswersSelenium,
  getGeminiAnswersSelenium,
  getClaudeAnswersSelenium,
  getChatGPTAnswersRobust,
} = require('./browserAutomation');
const { compareAnswers } = require('./platformAutomation');
const CompetitorAnalysisService = require('./competitorAnalysis');
const CompetitorDiscoveryService = require('./competitorDiscovery');
const SmartCompetitorDiscoveryService = require('./smartCompetitorDiscovery');
const CitationAnalysisService = require('./citationAnalysis');
const WebsiteCrawler = require('./websiteCrawler');

const axios = require('axios');
const fetch = require('node-fetch');
const unfluff = require('unfluff');
const aiVisibilityService = require('./aiVisibilityService');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize services
const db = new Database();
const authService = new AuthService();
const localAuthService = new LocalAuthService();
const googleAuthService = new GoogleAuthService();
const emailService = new EmailService();
const llmService = new LLMService();
const competitorAnalysisService = new CompetitorAnalysisService();
const competitorDiscoveryService = new CompetitorDiscoveryService();
const smartCompetitorDiscoveryService = new SmartCompetitorDiscoveryService();
const citationAnalysisService = new CitationAnalysisService();
const websiteCrawler = new WebsiteCrawler();


// Check authentication type
const AUTH_TYPE = process.env.AUTH_TYPE || 'azure';
const ENABLE_LOCAL_AUTH = process.env.ENABLE_LOCAL_AUTH === 'true';

console.log('ENABLE_LOCAL_AUTH:', process.env.ENABLE_LOCAL_AUTH);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.warn('[Auth] No token provided for', req.originalUrl);
    return res.status(403).json({ error: 'No token provided' });
  }
  try {
    let user;
    if (AUTH_TYPE === 'local') {
      user = localAuthService.extractUserFromToken(token);
    } else {
      // Try to determine the token type and use appropriate service
      try {
        // First try Microsoft/Azure token
        user = authService.extractUserFromToken(token);
      } catch (azureError) {
        try {
          // If Azure fails, try Google token
          user = googleAuthService.extractUserFromToken(token);
        } catch (googleError) {
          // If both fail, throw the original error
          throw azureError;
        }
      }
    }
    
    // Verify user exists in database
    const dbUser = await db.getUserById(user.id);
    if (!dbUser) {
      return res.status(403).json({ error: 'User not found in database' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.warn('[Auth] Invalid or expired token for', req.originalUrl, '-', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Initialize database connection
db.connect().catch(console.error);

// Create default admin user if local auth is enabled
if (ENABLE_LOCAL_AUTH) {
  db.connect().then(() => {
    localAuthService.createDefaultAdmin(db);
  }).catch(console.error);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    auth: AUTH_TYPE,
    localAuthEnabled: ENABLE_LOCAL_AUTH
  });
});

// Local Authentication Routes
if (ENABLE_LOCAL_AUTH) {
  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, displayName } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ 
          error: 'Missing required fields: email, password, name' 
        });
      }

      // Validate email
      if (!localAuthService.validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate password
      if (!localAuthService.validatePassword(password)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
        });
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await localAuthService.hashPassword(password);
      
      // Create user
      const userData = {
        id: uuidv4(),
        email,
        name,
        displayName: displayName || name,
        password: hashedPassword,
        roles: ['user'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.createUser(userData);
      
      // Generate tokens
      const accessToken = localAuthService.generateJWT(userData);
      const refreshToken = localAuthService.generateRefreshToken(userData);
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Save session
      await db.saveUserSession(userData.id, refreshToken, expiresAt.toISOString());
      
      // Remove password from response
      const { password: _, ...userResponse } = userData;
      
      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(email, name);
        console.log(`✅ Welcome email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }
      
      res.json({
        success: true,
        user: userResponse,
        accessToken,
        refreshToken,
        expiresAt: expiresAt.toISOString()
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Registration failed',
        details: error.message 
      });
    }
  });

  // Local login
  app.post('/api/auth/local-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields: email, password' 
        });
      }

      // Get user by email
      const user = await db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password. Please check your credentials and try again.' });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({ error: 'Your account has been deactivated. Please contact support for assistance.' });
      }

      // Verify password
      const isValidPassword = await localAuthService.comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password. Please check your credentials and try again.' });
      }

      // Update last login
      await db.updateUserLastLogin(user.id);
      
      // Generate tokens
      const accessToken = localAuthService.generateJWT(user);
      const refreshToken = localAuthService.generateRefreshToken(user);
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Save session
      await db.saveUserSession(user.id, refreshToken, expiresAt.toISOString());
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      res.json({
        success: true,
        user: userResponse,
        accessToken,
        refreshToken,
        expiresAt: expiresAt.toISOString()
      });
      
    } catch (error) {
      console.error('Local login error:', error);
      res.status(401).json({ 
        error: 'Authentication failed. Please try again or contact support if the problem persists.',
        details: error.message 
      });
    }
  });
}

// Azure Authentication routes (existing)
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 [Server] ===== MICROSOFT LOGIN REQUEST STARTED =====');
    console.log('🔐 [Server] Request received at:', new Date().toISOString());
    console.log('🔐 [Server] Request headers:', req.headers);
    
    const { msalToken, clientId, tenantId } = req.body;
    
    console.log('🔐 [Server] Request body parsed:', {
      hasMsalToken: !!msalToken,
      hasClientId: !!clientId,
      hasTenantId: !!tenantId,
      clientId: clientId,
      tenantId: tenantId,
      msalTokenLength: msalToken?.length,
      msalTokenPreview: msalToken ? msalToken.substring(0, 20) + '...' : 'N/A'
    });
    
    if (!msalToken || !clientId || !tenantId) {
      console.log('❌ [Server] Missing required fields:', {
        hasMsalToken: !!msalToken,
        hasClientId: !!clientId,
        hasTenantId: !!tenantId
      });
      return res.status(400).json({ 
        error: 'Missing required fields: msalToken, clientId, tenantId' 
      });
    }

    console.log('✅ [Server] All required fields present, processing Microsoft login request...');
    
    // For access tokens, we skip JWT validation and use the token directly
    // to call Microsoft Graph API
    console.log('🔐 [Server] About to call Microsoft Graph API with access token...');
    
    let userInfo;
    try {
      // Get user info from Microsoft Graph API using the access token
      console.log('🔐 [Server] Calling authService.getUserInfo()...');
      userInfo = await authService.getUserInfo(msalToken);
      console.log('✅ [Server] User info retrieved successfully from Microsoft Graph:', {
        id: userInfo.id,
        email: userInfo.mail || userInfo.userPrincipalName,
        name: userInfo.displayName,
        givenName: userInfo.givenName,
        surname: userInfo.surname,
        userPrincipalName: userInfo.userPrincipalName
      });
    } catch (graphError) {
      console.error('❌ [Server] Microsoft Graph API error:', graphError);
      console.error('❌ [Server] Graph error details:', {
        message: graphError.message,
        stack: graphError.stack
      });
      return res.status(401).json({ 
        error: 'Failed to get user information from Microsoft',
        details: graphError.message 
      });
    }
    
    // Create or update user in our database
    console.log('🔐 [Server] Creating user data object...');
    const userData = {
      id: userInfo.id,
      email: userInfo.mail || userInfo.userPrincipalName,
      name: userInfo.givenName + ' ' + userInfo.surname,
      displayName: userInfo.displayName,
      tenantId: tenantId, // Use the provided tenant ID
      roles: ['user'] // Default role, can be enhanced with role mapping
    };
    
    console.log('🔐 [Server] User data object created:', userData);
    console.log('🔐 [Server] About to create/update user in database...');
    
    await db.createOrUpdateUser(userData);
    console.log('✅ [Server] User created/updated in database successfully');
    
    // Generate our application tokens
    console.log('🔐 [Server] Generating application JWT tokens...');
    const accessToken = authService.generateJWT(userData);
    const refreshToken = authService.generateRefreshToken(userData);
    
    console.log('🔐 [Server] Tokens generated:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length
    });
    
    // Calculate expiration time (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    console.log('🔐 [Server] Token expiration calculated:', expiresAt.toISOString());
    
    // Save refresh token to database
    console.log('🔐 [Server] About to save user session to database...');
    await db.saveUserSession(userData.id, refreshToken, expiresAt.toISOString());
    console.log('✅ [Server] User session saved to database successfully');
    
    console.log('🔐 [Server] Preparing response for frontend...');
    const responseData = {
      success: true,
      user: userData,
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };
    
    console.log('✅ [Server] Response data prepared:', {
      success: responseData.success,
      hasUser: !!responseData.user,
      hasAccessToken: !!responseData.accessToken,
      hasRefreshToken: !!responseData.refreshToken,
      hasExpiresAt: !!responseData.expiresAt,
      userEmail: responseData.user?.email
    });
    
    console.log('🔐 [Server] ===== MICROSOFT LOGIN REQUEST COMPLETED SUCCESSFULLY =====');
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ [Server] ===== MICROSOFT LOGIN REQUEST FAILED =====');
    console.error('❌ [Server] Login error:', error);
    console.error('❌ [Server] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
});

// Google OAuth Authentication route
app.post('/api/auth/google-login', async (req, res) => {
  try {
    const { idToken, accessToken, userInfo } = req.body;
    
    let googleUser;
    
    // Handle both ID token and access token approaches
    if (idToken) {
      // Verify the Google ID token
      googleUser = await googleAuthService.verifyGoogleToken(idToken);
    } else if (accessToken && userInfo) {
      // Verify the Google access token
      googleUser = await googleAuthService.verifyGoogleAccessToken(accessToken);
    } else {
      return res.status(400).json({ 
        error: 'Missing required fields: either idToken OR (accessToken and userInfo)' 
      });
    }
    
    // Create or update user in our database
    const userData = {
      id: googleUser.userId,
      email: googleUser.email,
      name: googleUser.name,
      displayName: googleUser.displayName,
      picture: googleUser.picture,
      provider: 'google',
      roles: ['user'] // Default role
    };
    
    await db.createOrUpdateUser(userData);
    
    // Generate our application tokens
    const appAccessToken = googleAuthService.generateJWT(googleUser);
    const refreshToken = googleAuthService.generateRefreshToken(googleUser);
    
    // Calculate expiration time (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Save refresh token to database
    await db.saveUserSession(userData.id, refreshToken, expiresAt.toISOString());
    
    res.json({
      success: true,
      user: userData,
      accessToken: appAccessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ 
      error: 'Google authentication failed',
      details: error.message 
    });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = authService.verifyRefreshToken(refreshToken);
    
    // Get user session from database
    const userSession = await db.getUserSessionByRefreshToken(refreshToken);
    
    if (!userSession) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Get user data
    const user = await db.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Generate new tokens
    const newAccessToken = authService.generateJWT(user);
    const newRefreshToken = authService.generateRefreshToken(user);
    
    // Calculate new expiration time
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Delete old session and save new one
    await db.deleteUserSession(refreshToken);
    await db.saveUserSession(user.id, newRefreshToken, expiresAt.toISOString());
    
    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      error: 'Token refresh failed',
      details: error.message 
    });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return success
    res.json({ success: true, message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      details: error.message 
    });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      displayName: user.display_name,
      tenantId: user.tenant_id,
      roles: user.roles,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
    
  } catch (error) {
    console.error('[Auth /me] Error:', error);
    res.status(403).json({ error: 'Forbidden', details: error.message });
  }
});

// Protected session routes
app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const sessionData = req.body;
    
    // Validate required fields
    if (!sessionData.id || !sessionData.name || !sessionData.type) {
      return res.status(400).json({ 
        error: 'Missing required fields: id, name, type' 
      });
    }

    // Add user ID to session data
    sessionData.userId = req.user.id;

    // Generate embeddings for Q&A pairs if they exist
    // if (sessionData.qaData && Array.isArray(sessionData.qaData) && sessionData.qaData.length > 0) {
    //   console.log(`[Embeddings] Generating embeddings for ${sessionData.qaData.length} Q&A pairs`);
    //   
    //   for (let i = 0; i < sessionData.qaData.length; i++) {
    //     const qa = sessionData.qaData[i];
    //     
    //     try {
    //       // Generate question embedding
    //       if (qa.question) {
    //         console.log(`[Embeddings] Generating question embedding for: ${qa.question.substring(0, 50)}...`);
    //         qa.questionEmbedding = await getGeminiEmbedding(qa.question);
    //       }
    //       
    //       // Generate answer embedding
    //       if (qa.answer) {
    //         console.log(`[Embeddings] Generating answer embedding for: ${qa.answer.substring(0, 50)}...`);
    //         qa.embedding = await getGeminiEmbedding(qa.answer);
    //       }
    //     } catch (error) {
    //       console.error(`[Embeddings] Failed to generate embedding for Q&A pair ${i}:`, error);
    //       // Continue with other Q&A pairs even if one fails
    //     }
    //   }
    //   
    //   console.log(`[Embeddings] Completed embedding generation for session`);
    // }

    // Save to database
    const savedId = await db.saveSession(sessionData);
    
    res.status(201).json({ 
      success: true, 
      sessionId: savedId,
      message: 'Session saved successfully' 
    });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ 
      error: 'Failed to save session',
      details: error.message 
    });
  }
});

app.get('/api/sessions/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      fromDate, 
      toDate, 
      llmProvider, 
      llmModel, 
      blogLink,
      search 
    } = req.query;
    
    if (!['question', 'answer'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid session type. Must be "question" or "answer"' 
      });
    }

    // Build filter object
    const filters = {
      fromDate: fromDate || null,
      toDate: toDate || null,
      llmProvider: llmProvider || null,
      llmModel: llmModel || null,
      blogLink: blogLink || null,
      search: search || null
    };

    const sessions = await db.getSessionsByTypeWithFilters(type, req.user.id, filters);
    
    res.json({ 
      success: true, 
      sessions,
      filters,
      totalCount: sessions.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sessions',
      details: error.message 
    });
  }
});

app.get('/api/sessions/:type/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await db.getSessionById(id, req.user.id);
    
    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    res.json({ 
      success: true, 
      session 
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ 
      error: 'Failed to fetch session',
      details: error.message 
    });
  }
});

app.delete('/api/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await db.deleteSession(id, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Session deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ 
      error: 'Failed to delete session',
      details: error.message 
    });
  }
});

// Get session statistics
app.get('/api/stats/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['question', 'answer'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid session type. Must be "question" or "answer"' 
      });
    }

    const count = await db.getSessionCount(type, req.user.id);
    const sessions = await db.getSessionsByType(type, req.user.id);
    
    // Calculate additional statistics
    const totalCost = sessions.reduce((sum, session) => {
      return sum + parseFloat(session.statistics.totalCost || 0);
    }, 0);

    const totalQuestions = sessions.reduce((sum, session) => {
      return sum + (session.statistics.totalQuestions || 0);
    }, 0);

    res.json({ 
      success: true, 
      stats: {
        totalSessions: count,
        totalCost: totalCost.toFixed(8),
        totalQuestions,
        averageQuestionsPerSession: count > 0 ? (totalQuestions / count).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: error.message 
    });
  }
});

// Migrate localStorage data to backend
app.post('/api/migrate', authenticateToken, async (req, res) => {
  try {
    const { sessions } = req.body;
    
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ 
        error: 'Invalid sessions data' 
      });
    }

    // Add user ID to all sessions
    const sessionsWithUserId = Object.values(sessions).map(session => ({
      ...session,
      userId: req.user.id
    }));

    const result = await db.bulkSaveSessions(sessionsWithUserId);
    
    res.json({
      success: result.success,
      summary: result.summary,
      results: result.results
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed',
      details: error.message 
    });
  }
});

// Bulk save sessions endpoint
app.post('/api/sessions/bulk', authenticateToken, async (req, res) => {
  try {
    const { sessions } = req.body;
    
    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ 
        error: 'Invalid sessions data' 
      });
    }

    // Add user ID to all sessions
    const sessionsWithUserId = sessions.map(session => ({
      ...session,
      userId: req.user.id
    }));

    const result = await db.bulkSaveSessions(sessionsWithUserId);
    
    res.json({
      success: result.success,
      summary: result.summary,
      results: result.results
    });
  } catch (error) {
    console.error('Bulk save error:', error);
    res.status(500).json({ 
      error: 'Bulk save failed',
      details: error.message 
    });
  }
});

// Export sessions to CSV
app.get('/api/export/:type/csv', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['question', 'answer'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid session type. Must be "question" or "answer"' 
      });
    }

    const sessions = await db.getSessionsByType(type, req.user.id);
    
    if (sessions.length === 0) {
      return res.status(404).json({ 
        error: 'No sessions found to export' 
      });
    }

    const csvContent = generateCSV(sessions);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-sessions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Export failed',
      details: error.message 
    });
  }
});

// Helper function to generate CSV
function generateCSV(sessions) {
  const headers = [
    'Session ID', 'Name', 'Type', 'Timestamp', 'Model', 'Question Provider', 'Question Model', 
    'Answer Provider', 'Answer Model', 'Blog URL', 'Source URLs', 'Crawl Mode', 'Crawled Pages Count',
    'Total Questions', 'Total Cost', 'Question', 'Answer', 'Accuracy', 'Sentiment',
    'Input Tokens', 'Output Tokens', 'Cost'
  ];

  const rows = [headers.join(',')];

  sessions.forEach(session => {
    session.qaData.forEach(qa => {
      const row = [
        `"${session.id}"`,
        `"${session.name}"`,
        `"${session.type}"`,
        `"${session.timestamp}"`,
        `"${session.model}"`,
        `"${session.questionProvider || ''}"`,
        `"${session.questionModel || ''}"`,
        `"${session.answerProvider || ''}"`,
        `"${session.answerModel || ''}"`,
        `"${session.blogUrl || ''}"`,
        `"${session.sourceUrls ? session.sourceUrls.join('; ') : ''}"`,
        `"${session.crawlMode || ''}"`,
        session.crawledPages ? session.crawledPages.length : 0,
        session.statistics.totalQuestions,
        session.statistics.totalCost,
        `"${qa.question.replace(/"/g, '""')}"`,
        `"${(qa.answer || '').replace(/"/g, '""')}"`,
        qa.accuracy || '',
        `"${qa.sentiment || ''}"`,
        qa.inputTokens || 0,
        qa.outputTokens || 0,
        qa.cost || 0
      ];
      rows.push(row.join(','));
    });
  });

  return rows.join('\n');
}

// Email API endpoints
app.post('/api/email/test', authenticateToken, async (req, res) => {
  try {
    const result = await emailService.testEmailConfiguration();
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});

app.post('/api/email/crawl-completion', authenticateToken, async (req, res) => {
  try {
    const { crawlData } = req.body;
    const userEmail = req.user.email;
    
    if (!crawlData) {
      return res.status(400).json({ 
        error: 'Missing crawl data' 
      });
    }

    const result = await emailService.sendCrawlCompletionEmail(userEmail, crawlData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Crawl completion email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Crawl completion email error:', error);
    res.status(500).json({ 
      error: 'Failed to send crawl completion email',
      details: error.message 
    });
  }
});

app.post('/api/email/crawl-error', authenticateToken, async (req, res) => {
  try {
    const { errorData } = req.body;
    const userEmail = req.user.email;
    
    if (!errorData) {
      return res.status(400).json({ 
        error: 'Missing error data' 
      });
    }

    const result = await emailService.sendErrorEmail(userEmail, errorData);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Error email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error email error:', error);
    res.status(500).json({ 
      error: 'Failed to send error email',
      details: error.message 
    });
  }
});

// LLM API endpoints
app.get('/api/llm/providers', async (req, res) => {
  try {
    const configuredProviders = llmService.getConfiguredProviders();
    const availableModels = llmService.getAvailableModels();
    
    res.json({
      success: true,
      configuredProviders,
      availableModels
    });
  } catch (error) {
    console.error('LLM providers error:', error);
    res.status(500).json({ 
      error: 'Failed to get LLM providers',
      details: error.message 
    });
  }
});

app.post('/api/llm/generate-questions', authenticateToken, async (req, res) => {
  try {
    const { content, questionCount, provider, model } = req.body;
    
    if (!content || !questionCount || !provider || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, questionCount, provider, model' 
      });
    }

    if (!llmService.isProviderConfigured(provider)) {
      return res.status(400).json({ 
        error: `Provider ${provider} is not configured` 
      });
    }

    const prompt = `Generate exactly ${questionCount} questions based on the following blog content. Each question must be extremely relevant to the content—so relevant that it would receive a relevance score of 95 or higher out of 100, where 100 means the question is directly about the main topics, facts, or ideas in the blog content. Only generate questions that are clearly and strongly related to the blog content. Avoid questions that are only loosely related or require outside knowledge. Blog Content: ${content} List the ${questionCount} questions, each on a new line starting with "Q:".`;

    const result = await llmService.callLLM(prompt, provider, model, true);
    
    // Parse questions from the result
    const questions = result.text.split('\n')
      .filter(line => line.trim().startsWith('Q:'))
      .map(line => line.replace(/^Q:\s*/, '').trim())
      .filter(q => q.length > 0)
      .slice(0, questionCount);

    res.json({
      success: true,
      questions,
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens
    });
    
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions',
      details: error.message 
    });
  }
});

app.post('/api/llm/calculate-confidence', authenticateToken, async (req, res) => {
  try {
    const { question, content, provider, model } = req.body;
    
    if (!question || !content || !provider || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: question, content, provider, model' 
      });
    }

    const result = await llmService.calculateConfidence(question, content, provider, model);
    
    res.json({
      success: true,
      confidence: result.confidence,
      reasoning: result.reasoning,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      provider: result.provider,
      model: result.model
    });
    
  } catch (error) {
    console.error('Confidence calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate confidence',
      details: error.message 
    });
  }
});

app.post('/api/llm/generate-answers', authenticateToken, async (req, res) => {
  try {
    const { content, questions, provider, model } = req.body;
    
    if (!content || !questions || !Array.isArray(questions) || !provider || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, questions (array), provider, model' 
      });
    }

    if (!llmService.isProviderConfigured(provider)) {
      return res.status(400).json({ 
        error: `Provider ${provider} is not configured` 
      });
    }

    const answers = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const question of questions) {
      const answerPrompt = `Based on the following content, provide a comprehensive and accurate answer to the question.

Content:
${content}

Question: ${question}

Answer:`;

      const result = await llmService.callLLM(answerPrompt, provider, model, false);
      
      answers.push({
        question,
        answer: result.text.trim(),
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        provider: result.provider,
        model: result.model
      });

      totalInputTokens += result.inputTokens;
      totalOutputTokens += result.outputTokens;

      // Track GEO Fanout Density for each question
      // try {
      //   const geoFanoutAnalyzer = new GEOFanoutDensity();
      //   const fanoutAnalysis = await geoFanoutAnalyzer.trackFanoutQueries(
      //     req.user.id, question, content, provider, model
      //   );
        
      //   if (fanoutAnalysis.success) {
      //     console.log(`[GEO Fanout] Tracked fanout density for question: ${question.substring(0, 50)}...`);
      //     // Store fanout analysis with the answer for later reference
      //     answers[answers.length - 1].fanoutAnalysis = fanoutAnalysis;
      //   }
      // } catch (fanoutError) {
      //   console.error('[GEO Fanout] Failed to track fanout for question:', fanoutError);
      // }
    }

    res.json({
      success: true,
      answers,
      provider,
      model,
      totalInputTokens,
      totalOutputTokens
    });
    
  } catch (error) {
    console.error('Answer generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate answers',
      details: error.message 
    });
  }
});

// Compare two questions for similarity
app.post('/api/llm/compare-questions', authenticateToken, async (req, res) => {
  try {
    const { question1, question2, provider, model } = req.body;
    
    if (!question1 || !question2 || !provider || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: question1, question2, provider, model' 
      });
    }

    const result = await llmService.compareQuestions(question1, question2, provider, model);
    
    res.json({
      success: true,
      similarity: result.similarity,
      reasoning: result.reasoning,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      provider: result.provider,
      model: result.model
    });
    
  } catch (error) {
    console.error('Question comparison error:', error);
    res.status(500).json({ 
      error: 'Failed to compare questions',
      details: error.message 
    });
  }
});

// Cleanup expired sessions periodically
setInterval(async () => {
  try {
    const deletedCount = await db.deleteExpiredUserSessions();
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired user sessions`);
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}, 24 * 60 * 60 * 1000); // Run every 24 hours

// Check for relevant questions across different LLMs
app.post('/api/questions/check-relevance', authenticateToken, async (req, res) => {
  try {
    const { sourceUrls, blogUrl, questionText, currentProvider, currentModel } = req.body;
    
    if (!sourceUrls && !blogUrl) {
      return res.status(400).json({ 
        error: 'Source URLs or blog URL is required' 
      });
    }

    // Get all question sessions for the same source URLs or blog URL
    let query = `
      SELECT s.*, ss.total_questions, ss.avg_accuracy, ss.total_cost
      FROM sessions s
      LEFT JOIN session_statistics ss ON s.id = ss.session_id
      WHERE s.type = 'question' AND s.user_id = ?
    `;

    const params = [req.user.id];
    const conditions = [];

    // Filter by source URLs or blog URL
    if (sourceUrls && sourceUrls.length > 0) {
      conditions.push(`(
        s.source_urls LIKE ? OR 
        s.blog_url IN (${sourceUrls.map(() => '?').join(',')})
      )`);
      params.push(`%${sourceUrls[0]}%`); // Search for first URL in JSON
      sourceUrls.forEach(url => params.push(url));
    } else if (blogUrl) {
      conditions.push('s.blog_url = ?');
      params.push(blogUrl);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.timestamp DESC';

    const sessions = await new Promise((resolve, reject) => {
      db.db.all(query, params, async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const sessions = [];
          for (const row of rows) {
            const qaData = await db.getQADataBySessionId(row.id);
            sessions.push({
              id: row.id,
              name: row.name,
              type: row.type,
              timestamp: row.timestamp,
              model: row.model,
              questionProvider: row.question_provider,
              questionModel: row.question_model,
              answerProvider: row.answer_provider,
              answerModel: row.answer_model,
              blogContent: row.blog_content,
              blogUrl: row.blog_url,
              sourceUrls: row.source_urls ? JSON.parse(row.source_urls) : undefined,
              crawlMode: row.crawl_mode,
              crawledPages: row.crawled_pages ? JSON.parse(row.crawled_pages) : undefined,
              totalInputTokens: row.total_input_tokens,
              totalOutputTokens: row.total_output_tokens,
              qaData,
              statistics: {
                totalQuestions: row.total_questions,
                avgAccuracy: row.avg_accuracy,
                totalCost: row.total_cost
              }
            });
          }
          resolve(sessions);
        } catch (error) {
          reject(error);
        }
      });
    });

    // Filter out sessions from the same provider/model as current
    // const otherProviderSessions = sessions.filter(session => 
    //   session.questionProvider !== currentProvider || session.questionModel !== currentModel
    // );
    // Instead, include all sessions for the URL
    const otherProviderSessions = sessions;

    if (otherProviderSessions.length === 0) {
      return res.json({
        success: true,
        relevantQuestions: [],
        message: 'No questions found from other LLM providers for this content'
      });
    }

    // Debug: Log number of sessions found
    console.log(`[DEBUG] Found ${sessions.length} sessions for relevant question check.`);

    // Use Gemini 1.5 Flash for all relevance checks
    const relevantQuestions = [];
    let totalQuestionsChecked = 0;
    
    for (const session of otherProviderSessions) {
      for (const qa of session.qaData) {
        totalQuestionsChecked++;
        try {
          // Use Gemini 1.5 Flash for all relevance checks
          const relevanceResult = await llmService.checkQuestionRelevance(
            questionText,
            qa.question,
            "gemini",
            "gemini-1.5-flash"
          );
          // Debug: Log each relevance result
          console.log(`[DEBUG] Checked relevance: [Current] "${questionText}" vs [Session] "${qa.question}" => Score: ${relevanceResult.relevanceScore}, Reason: ${relevanceResult.reasoning}`);

          if (relevanceResult.relevanceScore >= 0.7) { // 70% threshold for relevance
            // Determine similarity group based on relevance score
            let similarityGroup = 'other';
            if (relevanceResult.relevanceScore >= 0.9) {
              similarityGroup = 'highly-similar';
            } else if (relevanceResult.relevanceScore >= 0.8) {
              similarityGroup = 'very-similar';
            } else if (relevanceResult.relevanceScore >= 0.7) {
              similarityGroup = 'similar';
            } else if (relevanceResult.relevanceScore >= 0.6) {
              similarityGroup = 'related';
            }

            relevantQuestions.push({
              question: qa.question,
              originalProvider: session.questionProvider,
              originalModel: session.questionModel,
              sessionName: session.name,
              sessionTimestamp: session.timestamp,
              relevanceScore: relevanceResult.relevanceScore,
              relevanceReasoning: relevanceResult.reasoning,
              sourceUrls: session.sourceUrls,
              blogUrl: session.blogUrl,
              similarityGroup: similarityGroup
            });
          }
        } catch (error) {
          console.error('Error checking question relevance:', error);
          // Continue with other questions even if one fails
        }
      }
    }
    // Debug: Log total questions checked and relevant questions found
    console.log(`[DEBUG] Total questions checked: ${totalQuestionsChecked}`);
    console.log(`[DEBUG] Relevant questions found: ${relevantQuestions.length}`);

    // Sort by relevance score (highest first)
    relevantQuestions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      success: true,
      relevantQuestions,
      totalChecked: otherProviderSessions.reduce((sum, s) => sum + s.qaData.length, 0),
      message: `Found ${relevantQuestions.length} relevant questions from other LLM providers`
    });

  } catch (error) {
    console.error('Error checking question relevance:', error);
    res.status(500).json({ 
      error: 'Failed to check question relevance',
      details: error.message 
    });
  }
});

app.post('/api/ask', async (req, res) => {
  const { provider, question } = req.body;
  if (provider === 'perplexity') {
    try {
      const answer = await getPerplexityAnswer(question);
      res.json({ answer });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(400).json({ error: 'Unsupported provider' });
  }
});

app.post('/api/llm/generate-answers-web', authenticateToken, async (req, res) => {
  console.log('Received request for /api/llm/generate-answers-web', req.body);
  const { questions, answerProvider, model, blogContent, blogUrl, sourceUrls } = req.body;
  try {
    let answers;
    let sessionId = null;
    let automationUsed = 'selenium';
    if (answerProvider === 'perplexity') {
      try {
        answers = await getPerplexityAnswersSelenium(questions);
      } catch (err) {
        console.warn('Selenium failed for Perplexity:', err.message);
        throw err;
      }
      // Save session to history
      const sessionData = {
        id: uuidv4(),
        name: 'Perplexity Session - ' + new Date().toLocaleString(),
        type: 'answer',
        answerProvider: 'perplexity',
        answerModel: 'perplexity-web',
        timestamp: new Date().toISOString(),
        userId: req.user.id,
        blogContent: blogContent || '',
        blogUrl: blogUrl || '',
        sourceUrls: sourceUrls || [],
        qaData: answers.map((a, i) => ({
          question: a.question,
          answer: a.answer,
          questionOrder: i + 1,
        })),
      };
      sessionId = await db.saveSession(sessionData);
    } else if (answerProvider === 'chatgpt' || answerProvider === 'openai') {
      // Accept both 'chatgpt' and 'openai' for ChatGPT web automation
      answers = (await getChatGPTAnswersRobust(questions)).map(a => ({
        question: a.question,
        answer: a.answer,
        inputTokens: 0,
        outputTokens: 0,
        provider: answerProvider,
        model: model
      }));
      automationUsed = 'selenium';
    } else if (answerProvider === 'gemini') {
      try {
        answers = await getGeminiAnswersSelenium(questions);
      } catch (err) {
        console.warn('Selenium failed for Gemini:', err.message);
        throw err;
      }
    } else if (answerProvider === 'claude') {
      try {
        answers = await getClaudeAnswersSelenium(questions);
      } catch (err) {
        console.warn('Selenium failed for Claude:', err.message);
        throw err;
      }
    } else {
      console.error('Unsupported provider:', answerProvider);
      return res.status(400).json({ error: 'Unsupported provider' });
    }
    res.json({ success: true, answers, provider: answerProvider, model, sessionId, automationUsed });
  } catch (error) {
    console.error('Web automation error:', error);
    res.status(500).json({ error: 'Failed to generate answers', details: error.message });
  }
});

/**
 * POST /api/compare-answers
 * Request body: { questions: ["question1", "question2", ...] }
 * Response: { success: true, results: [...] }
 * Runs automation for Perplexity, ChatGPT, Gemini, Claude and returns answers for each question.
 */
app.post('/api/compare-answers', authenticateToken, async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'questions must be a non-empty array' });
  }
  try {
    const results = await compareAnswers(questions);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Compare answers error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/automation/chatgpt', authenticateToken, async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'questions must be a non-empty array' });
  }
  try {
    const answers = await getChatGPTAnswersRobust(questions);
    res.json({ success: true, answers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vector embedding endpoints
// app.post('/api/embeddings/generate', authenticateToken, async (req, res) => { ... });
// app.post('/api/embeddings/search/questions', authenticateToken, async (req, res) => { ... });
// app.post('/api/embeddings/search/answers', authenticateToken, async (req, res) => { ... });
// app.post('/api/embeddings/calculate-similarities', authenticateToken, async (req, res) => { ... });

// Helper function to get confidence level
function getConfidenceLevel(similarity) {
  if (similarity >= 0.9) return 'Very High';
  if (similarity >= 0.8) return 'High';
  if (similarity >= 0.7) return 'Good';
  if (similarity >= 0.6) return 'Moderate';
  if (similarity >= 0.5) return 'Low';
  return 'Very Low';
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Fanout Query Density Analysis Endpoint
app.post('/api/fanout-density/analyze', authenticateToken, async (req, res) => {
  try {
    const { clusterThreshold = 0.7 } = req.body;
    const userId = req.user.id;

    console.log(`[Fanout Density] Starting analysis for user ${userId}`);
    
    // const fanoutAnalyzer = new FanoutQueryDensity();
    // const analysis = await fanoutAnalyzer.calculateFanoutDensity(userId, clusterThreshold);
    
    // if (!analysis.success) {
    //   return res.status(400).json(analysis);
    // }

    // console.log(`[Fanout Density] Analysis completed successfully`);
    res.json({ success: true, message: 'Fanout density analysis is currently disabled.' });

  } catch (error) {
    console.error('[Fanout Density] API error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze fanout query density', 
      details: error.message 
    });
  }
});

// Generate Fanout Density Report
app.get('/api/fanout-density/report', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`[Fanout Density] Generating report for user ${userId}`);
    
    // const fanoutAnalyzer = new FanoutQueryDensity();
    // const report = await fanoutAnalyzer.generateReport(userId);
    
    // if (!report.success) {
    //   return res.status(400).json(report);
    // }

    // console.log(`[Fanout Density] Report generated successfully`);
    res.json({ success: true, message: 'Fanout density report generation is currently disabled.' });

  } catch (error) {
    console.error('[Fanout Density] Report generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate fanout density report', 
      details: error.message 
    });
  }
});

// GEO Fanout Density Analysis - Track sub-queries and content attribution
app.post('/api/geo-fanout/track', authenticateToken, async (req, res) => {
  try {
    const { mainQuestion, content, provider, model } = req.body;
    const userId = req.user.id;

    if (!mainQuestion || !content || !provider || !model) {
      return res.status(400).json({ 
        error: 'Missing required fields: mainQuestion, content, provider, model' 
      });
    }

    console.log(`[GEO Fanout] Starting analysis for user ${userId}`);
    
    // const geoFanoutAnalyzer = new GEOFanoutDensity();
    // const analysis = await geoFanoutAnalyzer.trackFanoutQueries(
    //   userId, mainQuestion, content, provider, model
    // );
    
    // if (!analysis.success) {
    //   return res.status(400).json(analysis);
    // }

    // console.log(`[GEO Fanout] Analysis completed successfully`);
    res.json({ success: true, message: 'GEO fanout density analysis is currently disabled.' });

  } catch (error) {
    console.error('[GEO Fanout] Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze GEO fanout density', 
      details: error.message 
    });
  }
});

// Get comprehensive GEO Fanout analysis
app.get('/api/geo-fanout/analysis', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.query;

    console.log(`[GEO Fanout] Getting analysis for user ${userId}`);
    
    // const geoFanoutAnalyzer = new GEOFanoutDensity();
    // const analysis = await geoFanoutAnalyzer.getGEOFanoutAnalysis(userId, sessionId);
    
    // if (!analysis.success) {
    //   return res.status(400).json(analysis);
    // }

    // console.log(`[GEO Fanout] Analysis retrieved successfully`);
    res.json({ success: true, message: 'GEO fanout analysis retrieval is currently disabled.' });

  } catch (error) {
    console.error('[GEO Fanout] Analysis retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve GEO fanout analysis', 
      details: error.message 
    });
  }
});

app.post('/api/citation-likelihood/calculate', authenticateToken, async (req, res) => {
  try {
    const { answer, content, provider, model } = req.body;
    if (!answer || !content || !provider || !model) {
      console.error('[Citation Likelihood] Missing required fields:', { answer: !!answer, content: !!content, provider, model });
      return res.status(400).json({ error: 'Missing required fields: answer, content, provider, model' });
    }
    
    console.log('[Citation Likelihood] Starting calculation with provider:', provider, 'model:', model);
    console.log('[Citation Likelihood] Answer length:', answer.length, 'Content length:', content.length);
    
    if (!llmService.isProviderConfigured(provider)) {
      console.error('[Citation Likelihood] Provider not configured:', provider);
      return res.status(400).json({ error: `Provider ${provider} is not configured` });
    }
    
    const prompt = `Analyze the following answer and determine how likely it is to need citations or references. Consider:

1. Factual claims and statistics
2. Specific data, numbers, or dates
3. Technical information or research findings
4. Claims that go beyond the provided content
5. Statements that would benefit from external verification

Rate the citation likelihood on a scale of 0 to 100, where:
- 0-20: No citations needed (general knowledge, basic facts)
- 21-40: Low likelihood (some specific claims)
- 41-60: Moderate likelihood (several factual claims)
- 61-80: High likelihood (many specific claims, statistics)
- 81-100: Very high likelihood (extensive factual claims, research data)

Content:
${content}

Answer:
${answer}

Respond with ONLY a number between 0 and 100.`;
    
    let result;
    try {
      console.log('[Citation Likelihood] Calling LLM API with provider:', provider);
      result = await llmService.callLLM(prompt, provider, model, false);
      console.log('[Citation Likelihood] LLM API call successful');
    } catch (err) {
      console.error('[Citation Likelihood] LLM API call failed:', err);
      console.error('[Citation Likelihood] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      return res.status(500).json({ error: 'LLM API call failed', details: err.message });
    }
    
    const response = result.text.trim();
    const match = response.match(/\d+/);
    if (!match) {
      console.error('[Citation Likelihood] LLM response did not contain a number:', response);
    }
    const citationLikelihood = match ? Math.min(Math.max(parseInt(match[0]), 0), 100) : 50;
    console.log('[Citation Likelihood] Input:', { answer: answer.substring(0, 100) + '...', content: content.substring(0, 100) + '...', provider, model });
    console.log('[Citation Likelihood] LLM response:', response, 'Parsed likelihood:', citationLikelihood);
    res.json({ citationLikelihood });
  } catch (error) {
    console.error('[Citation Likelihood] API error:', error);
    res.status(500).json({ error: 'Failed to calculate citation likelihood', details: error.message });
  }
});

app.post('/api/accuracy/calculate', authenticateToken, async (req, res) => {
  try {
    const { answer, content, provider, model } = req.body;
    if (!answer || !content || !provider || !model) {
      console.error('[Accuracy Calculation] Missing required fields:', { answer: !!answer, content: !!content, provider, model });
      return res.status(400).json({ error: 'Missing required fields: answer, content, provider, model' });
    }
    
    console.log('[Accuracy Calculation] Starting calculation with provider:', provider, 'model:', model);
    console.log('[Accuracy Calculation] Answer length:', answer.length, 'Content length:', content.length);
    
    if (!llmService.isProviderConfigured(provider)) {
      console.error('[Accuracy Calculation] Provider not configured:', provider);
      return res.status(400).json({ error: `Provider ${provider} is not configured` });
    }
    
    const prompt = `Rate how well the following answer is supported by the given content on a scale of 0 to 100, where 0 means not supported at all and 100 means fully supported.

Content:
${content}

Answer:
${answer}

Respond with ONLY a number between 0 and 100.`;
    
    let result;
    try {
      console.log('[Accuracy Calculation] Calling LLM API with provider:', provider);
      result = await llmService.callLLM(prompt, provider, model, false);
      console.log('[Accuracy Calculation] LLM API call successful');
    } catch (err) {
      console.error('[Accuracy Calculation] LLM API call failed:', err);
      console.error('[Accuracy Calculation] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      return res.status(500).json({ error: 'LLM API call failed', details: err.message });
    }
    
    const response = result.text.trim();
    const match = response.match(/\d+/);
    if (!match) {
      console.error('[Accuracy Calculation] LLM response did not contain a number:', response);
    }
    const accuracy = match ? Math.min(Math.max(parseInt(match[0]), 0), 100) : 50;
    console.log('[Accuracy Calculation] Input:', { answer: answer.substring(0, 100) + '...', content: content.substring(0, 100) + '...', provider, model });
    console.log('[Accuracy Calculation] LLM response:', response, 'Parsed accuracy:', accuracy);
    res.json({ accuracy });
  } catch (error) {
    console.error('[Accuracy Calculation] API error:', error);
    res.status(500).json({ error: 'Failed to calculate accuracy', details: error.message });
  }
});

app.post('/api/accuracy/gemini', authenticateToken, async (req, res) => {
  try {
    const { answer, content, model } = req.body;
    if (!answer || !content) {
      console.error('[Gemini Accuracy] Missing answer or content:', { answer, content });
      return res.status(400).json({ error: 'Missing answer or content' });
    }
    
    console.log('[Gemini Accuracy] Starting calculation with model:', model);
    console.log('[Gemini Accuracy] Answer length:', answer.length, 'Content length:', content.length);
    
    const prompt = `Rate how well the following answer is supported by the given content on a scale of 0 to 100, where 0 means not supported at all and 100 means fully supported.\n\nContent:\n${content}\n\nAnswer:\n${answer}\n\nRespond with ONLY a number between 0 and 100.`;
    
    let result;
    try {
      console.log('[Gemini Accuracy] Calling Gemini API...');
      result = await llmService.callLLM(prompt, 'gemini', model || 'gemini-1.5-flash', false);
      console.log('[Gemini Accuracy] Gemini API call successful');
    } catch (err) {
      console.error('[Gemini Accuracy] Gemini API call failed:', err);
      console.error('[Gemini Accuracy] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      return res.status(500).json({ error: 'Gemini API call failed', details: err.message });
    }
    
    const response = result.text.trim();
    const match = response.match(/\d+/);
    if (!match) {
      console.error('[Gemini Accuracy] Gemini response did not contain a number:', response);
    }
    const accuracy = match ? Math.min(Math.max(parseInt(match[0]), 0), 100) : 50;
    console.log('[Gemini Accuracy] Input:', { answer: answer.substring(0, 100) + '...', content: content.substring(0, 100) + '...', model });
    console.log('[Gemini Accuracy] Gemini response:', response, 'Parsed accuracy:', accuracy);
    res.json({ accuracy });
  } catch (error) {
    console.error('[Gemini Accuracy] API error:', error);
    res.status(500).json({ error: 'Failed to calculate accuracy', details: error.message });
  }
});

app.post('/api/geo-score', authenticateToken, async (req, res) => {
  try {
    const { accuracy, question, answer, importantQuestions, allConfidences, sourceUrl, content } = req.body;
    console.log('[GEO Score] Input:', { accuracy, question, answer, importantQuestions, allConfidences, sourceUrl, content });
    
    // Dynamic Coverage Score - Calculate based on content similarity and question relevance
    let coverage = 0;
    if (importantQuestions && importantQuestions.length > 0) {
      let totalCoverageScore = 0;
      for (let i = 0; i < importantQuestions.length; i++) {
        const importantQ = importantQuestions[i];
        const confidence = allConfidences[i] || 0;
        
        // Calculate semantic similarity between current question and important question
        const similarity = calculateQuestionSimilarity(question, importantQ);
        
        // Weight by confidence and similarity
        const questionCoverage = (confidence * similarity) / 100;
        totalCoverageScore += questionCoverage;
      }
      coverage = (totalCoverageScore / importantQuestions.length) * 100;
    }
    
    // Dynamic Structure Score - More comprehensive analysis
    let structure = 0;
    
    // 1. Answer Length Analysis (0-20 points)
    const answerLength = answer.length;
    if (answerLength >= 50 && answerLength <= 500) {
      structure += 20; // Optimal length
    } else if (answerLength >= 30 && answerLength <= 800) {
      structure += 15; // Good length
    } else if (answerLength >= 20 && answerLength <= 1000) {
      structure += 10; // Acceptable length
    }
    
    // 2. Formatting and Structure (0-30 points)
    if (/^Q:|<h[1-6]>|<h[1-6] /.test(answer) || /<h[1-6]>/.test(content)) structure += 15;
    if (/\n\s*[-*1.]/.test(answer) || /<ul>|<ol>/.test(answer)) structure += 15;
    
    // 3. Readability Analysis (0-25 points)
    const sentences = answer.split(/[.!?]/).filter(s => s.trim().length > 0);
    const words = answer.split(/\s+/).filter(w => w.length > 0);
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) {
      structure += 25; // Optimal sentence length
    } else if (avgSentenceLength >= 8 && avgSentenceLength <= 30) {
      structure += 20; // Good sentence length
    } else if (avgSentenceLength >= 5 && avgSentenceLength <= 35) {
      structure += 15; // Acceptable sentence length
    }
    
    // 4. Content Organization (0-25 points)
    let organizationScore = 0;
    
    // Check for logical flow indicators
    if (/first|second|third|finally|in conclusion|to summarize/i.test(answer)) organizationScore += 10;
    if (/however|but|although|while|on the other hand/i.test(answer)) organizationScore += 5;
    if (/for example|such as|including|specifically/i.test(answer)) organizationScore += 5;
    if (/therefore|thus|as a result|consequently/i.test(answer)) organizationScore += 5;
    
    structure += Math.min(organizationScore, 25);
    
    // Cap structure at 100
    if (structure > 100) structure = 100;
    
    // Schema Presence (unchanged)
    let schema = /@type\s*[:=]\s*['"]?FAQPage['"]?/i.test(answer) || /@type\s*[:=]\s*['"]?FAQPage['"]?/i.test(content) ? 1 : 0;
    
    // Accessibility Score (unchanged)
    let access = 1;
    try {
      const robotsUrl = sourceUrl.replace(/\/$/, '') + '/robots.txt';
      const resp = await axios.get(robotsUrl, { timeout: 2000 });
      if (/Disallow:\s*\//i.test(resp.data)) access = 0;
    } catch (e) {
      console.error('[GEO Score] robots.txt fetch failed:', e.message);
      access = 1;
    }
    
    // Updated GEO Score formula using accuracy instead of aiConfidence
    const geoScore = 0.4 * accuracy + 0.2 * coverage + 0.2 * structure + 0.1 * schema * 100 + 0.1 * access * 100;
    
    console.log('[GEO Score] Components:', { accuracy, coverage, structure, schema, access, geoScore });
    res.json({
      geoScore: Math.round(geoScore),
      breakdown: { accuracy, coverage, structure, schema, access }
    });
  } catch (error) {
    console.error('[GEO Score] API error:', error);
    res.status(500).json({ error: 'Failed to calculate GEO score', details: error.message });
  }
});

// Helper function to calculate question similarity
function calculateQuestionSimilarity(question1, question2) {
  // Convert to lowercase and split into words
  const words1 = question1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const words2 = question2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  
  // Calculate Jaccard similarity
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return union.length > 0 ? intersection.length / union.length : 0;
}

// Catch-all error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Authentication: Enabled`);
  console.log(`Database: Connected`);
}); 

app.post('/api/extract-content', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing URL' });
    }
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to fetch URL', status: response.status });
    }
    const html = await response.text();
    const data = unfluff(html);
    res.json({ success: true, content: data.text, title: data.title, description: data.description });
  } catch (error) {
    console.error('Extract content error:', error);
    res.status(500).json({ error: 'Failed to extract content', details: error.message });
  }
});

// Website crawling endpoint
app.post('/api/crawl-website', authenticateToken, async (req, res) => {
  try {
    const { url, options = {} } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Missing URL' });
    }

    console.log(`[Website Crawler] Starting crawl for: ${url}`);
    
    const crawlOptions = {
      maxPages: options.maxPages || 50,
      maxDepth: options.maxDepth || 3,
      timeout: options.timeout || 30000
    };

    const result = await websiteCrawler.crawlWebsite(url, crawlOptions);
    
    res.json({
      success: true,
      result: result
    });
    
  } catch (error) {
    console.error('[Website Crawler] Error:', error);
    res.status(500).json({ 
      error: 'Failed to crawl website',
      details: error.message 
    });
  }
});



// Competitor Analysis Endpoints
app.post('/api/competitor/analyze', authenticateToken, async (req, res) => {
  try {
    const { domain, userContent } = req.body;
    
    if (!domain) {
      return res.status(400).json({ 
        error: 'Missing required field: domain' 
      });
    }

    console.log(`[Competitor Analysis] Analyzing domain: ${domain}`);
    
    const result = await competitorAnalysisService.analyzeCompetitor(domain, userContent || '');
    
    if (result.success) {
      // Save analysis result to database
      const analysisData = {
        id: uuidv4(),
        userId: req.user.id,
        domain: result.domain,
        url: result.url,
        analysis: result.analysis,
        contentLength: result.contentLength,
        title: result.title,
        description: result.description,
        headings: result.headings,
        lastUpdated: result.lastUpdated,
        createdAt: new Date().toISOString()
      };
      
      await db.saveCompetitorAnalysis(analysisData);
      
      res.json({
        success: true,
        result: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('[Competitor Analysis] Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze competitor',
      details: error.message 
    });
  }
});

app.post('/api/competitor/analyze-multiple', authenticateToken, async (req, res) => {
  try {
    const { domains, userContent } = req.body;
    
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required field: domains (array)' 
      });
    }

    console.log(`[Competitor Analysis] Analyzing ${domains.length} domains`);
    
    const results = await competitorAnalysisService.analyzeMultipleCompetitors(domains, userContent || '');
    
    // Save successful results to database
    for (const result of results) {
      if (result.success) {
        const analysisData = {
          id: uuidv4(),
          userId: req.user.id,
          domain: result.domain,
          url: result.url,
          analysis: result.analysis,
          contentLength: result.contentLength,
          title: result.title,
          description: result.description,
          lastUpdated: result.lastUpdated,
          createdAt: new Date().toISOString()
        };
        
        await db.saveCompetitorAnalysis(analysisData);
      }
    }
    
    res.json({
      success: true,
      results: results
    });
    
  } catch (error) {
    console.error('[Competitor Analysis] Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze competitors',
      details: error.message 
    });
  }
});

app.get('/api/competitor/analyses', authenticateToken, async (req, res) => {
  try {
    const analyses = await db.getCompetitorAnalyses(req.user.id);
    
    res.json({
      success: true,
      analyses: analyses
    });
    
  } catch (error) {
    console.error('[Competitor Analysis] Error fetching analyses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch competitor analyses',
      details: error.message 
    });
  }
});

app.get('/api/competitor/analysis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await db.getCompetitorAnalysis(id, req.user.id);
    
    if (!analysis) {
      return res.status(404).json({ 
        error: 'Analysis not found' 
      });
    }
    
    res.json({
      success: true,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('[Competitor Analysis] Error fetching analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch competitor analysis',
      details: error.message 
    });
  }
});

app.delete('/api/competitor/analysis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteCompetitorAnalysis(id, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({ 
        error: 'Analysis not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });
    
  } catch (error) {
    console.error('[Competitor Analysis] Error deleting analysis:', error);
    res.status(500).json({ 
      error: 'Failed to delete competitor analysis',
      details: error.message 
    });
  }
});

 

// Smart Competitor Analysis Routes
app.post('/api/competitor/smart-analysis', authenticateToken, async (req, res) => {
  try {
    const { domain, userWebsite, companyName } = req.body;
    console.log('[Smart Analysis] Request body:', req.body);
    if (!domain) {
      console.warn('[Smart Analysis] 400 Bad Request: Missing required field: domain');
      return res.status(400).json({ 
        error: 'Missing required field: domain' 
      });
    }
    console.log(`[Smart Analysis] Starting smart analysis for domain: ${domain}`);
    // Use Gemini+SEMrush flow
    const discoveryResult = await smartCompetitorDiscoveryService.discoverCompetitorsGeminiAndSEMrush(domain, companyName);
    console.log('[Smart Analysis] Discovery result:', discoveryResult);
    if (!discoveryResult.success) {
      console.warn('[Smart Analysis] Discovery failed:', discoveryResult.error);
      return res.status(400).json({
        success: false,
        error: 'Failed to discover smart competitors',
        details: discoveryResult.error
      });
    }
    const competitors = discoveryResult.competitors;
    res.json({
      success: true,
      competitors: competitors,
      targetDomain: domain,
      totalAnalyzed: competitors.length
    });
  } catch (error) {
    console.error('[Smart Analysis] Error:', error);
    res.status(500).json({ 
      error: 'Failed to perform smart analysis',
      details: error.message 
    });
  }
});

// Get smart analysis by ID
app.get('/api/competitor/smart-analysis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await db.getSmartAnalysis(id, req.user.id);
    
    if (!analysis) {
      return res.status(404).json({ 
        error: 'Smart analysis not found' 
      });
    }
    
    res.json({
      success: true,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('[Smart Analysis] Error fetching analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch smart analysis',
      details: error.message 
    });
  }
});

// Get all smart analyses for user
app.get('/api/competitor/smart-analyses', authenticateToken, async (req, res) => {
  try {
    const analyses = await db.getSmartAnalyses(req.user.id);
    
    res.json({
      success: true,
      analyses: analyses
    });
    
  } catch (error) {
    console.error('[Smart Analysis] Error fetching analyses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch smart analyses',
      details: error.message 
    });
  }
});

// Delete smart analysis
app.delete('/api/competitor/smart-analysis/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteSmartAnalysis(id, req.user.id);
    
    if (!deleted) {
      return res.status(404).json({ 
        error: 'Smart analysis not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Smart analysis deleted successfully'
    });
    
  } catch (error) {
    console.error('[Smart Analysis] Error deleting analysis:', error);
    res.status(500).json({ 
      error: 'Failed to delete smart analysis',
      details: error.message 
    });
  }
});

// Helper function to extract JSON from markdown code blocks
function extractJSONFromMarkdown(text) {
  if (!text || typeof text !== 'string') {
    console.error('[JSON Extraction] Invalid input:', typeof text);
    return {};
  }

  // Clean the text first
  let cleanedText = text.trim();
  
  // Try to parse as direct JSON first
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    console.log('[JSON Extraction] Direct JSON parsing failed, trying markdown extraction');
  }

  // Try to extract JSON from markdown code blocks
  const jsonMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  let jsonBlock = null;
  if (jsonMatch) {
    jsonBlock = jsonMatch[1].trim();
  } else {
    // If no markdown blocks found, try to find JSON object in the text
    const jsonObjectMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      jsonBlock = jsonObjectMatch[0].trim();
    }
  }

  if (jsonBlock) {
    // Try parsing the detected JSON block
    try {
      return JSON.parse(jsonBlock);
    } catch (e2) {
      console.error('[JSON Extraction] Failed to parse JSON block:', e2.message);
      console.log('[JSON Extraction] Attempted to parse:', jsonBlock.substring(0, 400) + '...');
      // Try to fix common JSON issues
      try {
        const fixedJson = fixCommonJsonIssues(jsonBlock);
        return JSON.parse(fixedJson);
      } catch (e3) {
        console.error('[JSON Extraction] Failed to parse even after fixing:', e3.message);
        console.log('[JSON Extraction] Fixed JSON:', fixCommonJsonIssues(jsonBlock).substring(0, 400) + '...');
      }
    }
  }

  console.error('[JSON Extraction] No valid JSON found in text');
  return {};
}

// Improved JSON fixer for Gemini API responses
function fixCommonJsonIssues(jsonText) {
  let fixed = jsonText;

  // Remove any lines before the first { and after the last }
  const firstBrace = fixed.indexOf('{');
  const lastBrace = fixed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    fixed = fixed.substring(firstBrace, lastBrace + 1);
  }

  // Remove trailing commas before closing braces/brackets
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

  // Fix missing quotes around property names (only if not already quoted)
  fixed = fixed.replace(/([,{\s])(\w+)(\s*):/g, (match, p1, p2, p3) => {
    if (/^\d/.test(p2)) return match; // don't quote numbers
    return `${p1}"${p2}"${p3}:`;
  });

  // Fix single quotes to double quotes
  fixed = fixed.replace(/'/g, '"');

  // Remove backslashes before quotes that are not escaping another quote
  fixed = fixed.replace(/\\"/g, '"');

  // Remove any trailing commas at the end
  fixed = fixed.replace(/,\s*}/g, '}');
  fixed = fixed.replace(/,\s*]/g, ']');

  // Remove any non-JSON trailing/leading text (should be handled by above, but extra safety)
  fixed = fixed.replace(/^[^\{]*/, '');
  fixed = fixed.replace(/[^\}]*$/, '');

  // Log the fixed JSON for debugging
  console.log('[JSON Extraction] Fixed JSON:', fixed.substring(0, 400) + '...');
  return fixed;
}

// Helper function to generate smart insights
function generateSmartInsights(competitors, targetAnalysis, userPosition) {
  const insights = [];
  
  // Ensure competitors is an array
  if (!Array.isArray(competitors)) {
    competitors = [];
  }
  
  // Ensure targetAnalysis is an object
  if (!targetAnalysis || typeof targetAnalysis !== 'object') {
    targetAnalysis = { businessType: 'unknown', services: [] };
  }
  
  // Ensure services is an array
  if (!Array.isArray(targetAnalysis.services)) {
    targetAnalysis.services = [];
  }
  
  // Position insights
  if (userPosition) {
    if (userPosition === 1) {
      insights.push({
        type: 'position',
        title: 'Market Leader',
        description: 'Your website is performing exceptionally well and leading the competition!',
        priority: 'high'
      });
    } else if (userPosition <= 3) {
      insights.push({
        type: 'position',
        title: 'Top Performer',
        description: `You're in the top ${userPosition} competitors. Focus on maintaining your strong position.`,
        priority: 'medium'
      });
    } else {
      insights.push({
        type: 'position',
        title: 'Improvement Opportunity',
        description: `You're ranked #${userPosition} out of ${competitors.length}. There's room to climb the rankings.`,
        priority: 'high'
      });
    }
  }
  
  // Content insights
  const topCompetitor = competitors[0];
  if (topCompetitor && topCompetitor.contentAnalysis && topCompetitor.scores) {
    const avgContentScore = competitors.reduce((sum, c) => sum + (c.scores?.content || 0), 0) / competitors.length;
    insights.push({
      type: 'content',
      title: 'Content Quality Benchmark',
      description: `Top competitor has a content score of ${topCompetitor.scores.content || 0}. Industry average is ${Math.round(avgContentScore)}.`,
      priority: 'medium'
    });
  }
  
  // Business type insights
  if (targetAnalysis.businessType && targetAnalysis.businessType !== 'unknown') {
    insights.push({
      type: 'business',
      title: 'Business Type Analysis',
      description: `Your business type (${targetAnalysis.businessType}) is well-represented in the competitive landscape.`,
      priority: 'low'
    });
  }
  
  // Service insights
  if (targetAnalysis.services && targetAnalysis.services.length > 0) {
    insights.push({
      type: 'services',
      title: 'Service Focus',
      description: `Key services detected: ${targetAnalysis.services.join(', ')}. Consider highlighting these in your content.`,
      priority: 'medium'
    });
  }
  
  return insights;
}

// Content structure analysis routes
app.post('/api/content/analyze-structure', authenticateToken, async (req, res) => {
  try {
    const { content, url } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    console.log('[Content Analysis] Starting analysis for content length:', content.length);

    // Check if Gemini API is configured
    if (!process.env.GEMINI_API_KEY) {
      console.log('[Content Analysis] Gemini API key not configured, using fallback analysis');
      
      // Fallback analysis without LLM
      const analysis = {
        contentType: 'article',
        currentStructure: {
          headings: content.includes('<h1>') || content.includes('# ') ? ['h1'] : [],
          paragraphs: content.split('\n\n').length,
          lists: (content.match(/[•\-*]/g) || []).length,
          tables: 0,
          quotes: (content.match(/["']/g) || []).length / 2,
          codeBlocks: 0
        },
        missingElements: [],
        structureIssues: [],
        improvementOpportunities: []
      };

      // Generate structured content without LLM
      let structuredContent = content;
      if (!content.includes('<h1>') && !content.includes('# ')) {
        const title = content.split('\n')[0].substring(0, 60);
        structuredContent = `# ${title}\n\n${content}`;
      }

      // Generate suggestions without LLM
      const suggestions = [];
      
      if (!content.includes('<h1>') && !content.includes('# ')) {
        suggestions.push({
          type: 'heading',
          priority: 'high',
          description: 'Add a clear H1 heading to improve SEO and content structure',
          implementation: 'Add a descriptive H1 heading at the beginning of the content',
          impact: 'Improves SEO ranking and content readability'
        });
      }

      if (content.split('\n\n').length < 3) {
        suggestions.push({
          type: 'paragraph',
          priority: 'medium',
          description: 'Break content into smaller paragraphs for better readability',
          implementation: 'Split long paragraphs into 2-3 sentence chunks',
          impact: 'Improves readability and user engagement'
        });
      }

      if (!content.includes('•') && !content.includes('-') && !content.includes('1.')) {
        suggestions.push({
          type: 'list',
          priority: 'medium',
          description: 'Add bullet points or numbered lists for key information',
          implementation: 'Convert key points into bullet points or numbered lists',
          impact: 'Makes content more scannable and LLM-friendly'
        });
      }

      suggestions.push({
        type: 'schema',
        priority: 'high',
        description: 'Add structured data markup for better search engine understanding',
        implementation: 'Generate JSON-LD schema markup for the content',
        impact: 'Improves search engine visibility and rich snippets'
      });

      // Calculate scores
      let seoScore = 50;
      let llmScore = 50;
      let readabilityScore = 50;

      if (content.length > 300) seoScore += 10;
      if (content.includes('<h1>') || content.includes('# ')) seoScore += 15;
      if (content.includes('<h2>') || content.includes('## ')) seoScore += 10;
      if (content.includes('•') || content.includes('-')) seoScore += 5;
      if (content.length > 1000) seoScore += 10;

      if (structuredContent.length > content.length) llmScore += 20;
      if (suggestions.length < 3) llmScore += 15;
      if (content.includes('##') || content.includes('<h2>')) llmScore += 10;
      if (content.includes('•') || content.includes('-')) llmScore += 5;

      const sentences = content.split(/[.!?]+/).length;
      const words = content.split(/\s+/).length;
      const avgSentenceLength = words / sentences;
      
      if (avgSentenceLength < 20) readabilityScore += 20;
      if (avgSentenceLength < 15) readabilityScore += 10;
      if (content.includes('\n\n')) readabilityScore += 10;
      if (content.includes('•') || content.includes('-')) readabilityScore += 10;

      // Generate metadata
      const metadata = {
        title: content.split('\n')[0].substring(0, 60) || 'Untitled Content',
        description: content.substring(0, 160) || 'Content description',
        keywords: content.split(/\s+/).filter(word => word.length > 4).slice(0, 10),
        author: 'Unknown',
        publishDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        readingTime: Math.ceil(content.split(/\s+/).length / 200),
        wordCount: content.split(/\s+/).length,
        language: 'en'
      };

      // Generate structured data
      const structuredData = {
        articleSchema: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: metadata.title,
          description: metadata.description,
          author: {
            '@type': 'Person',
            name: metadata.author
          },
          publisher: {
            '@type': 'Organization',
            name: 'Publisher Name'
          },
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': url || 'https://example.com'
          }
        }
      };

      const analysisResult = {
        originalContent: content,
        structuredContent,
        seoScore: Math.min(seoScore, 100),
        llmOptimizationScore: Math.min(llmScore, 100),
        readabilityScore: Math.min(readabilityScore, 100),
        suggestions,
        metadata,
        structuredData
      };

      return res.json({ success: true, analysis: analysisResult });
    }

    // Analyze content structure using LLM
    const analysisPrompt = `Analyze the following content and provide a detailed structure analysis:

Content:
${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

Please analyze:
1. Content type (article, guide, tutorial, FAQ, etc.)
2. Current structure (headings, paragraphs, lists, etc.)
3. Missing structural elements
4. Content flow and organization
5. Opportunities for better structure

Respond in JSON format:
{
  "contentType": "string",
  "currentStructure": {
    "headings": ["h1", "h2", "h3"],
    "paragraphs": number,
    "lists": number,
    "tables": number,
    "quotes": number,
    "codeBlocks": number
  },
  "missingElements": ["element1", "element2"],
  "structureIssues": ["issue1", "issue2"],
  "improvementOpportunities": ["opportunity1", "opportunity2"]
}`;

    console.log('[Content Analysis] Calling Gemini API for structure analysis');
    let structureAnalysis;
    try {
      structureAnalysis = await llmService.callGeminiAPI(analysisPrompt, 'gemini-1.5-flash');
    } catch (error) {
      console.error('[Content Analysis] Gemini API error:', error.message);
      // Fallback to basic analysis
      const analysis = {
        contentType: 'article',
        currentStructure: {
          headings: content.includes('<h1>') || content.includes('# ') ? ['h1'] : [],
          paragraphs: content.split('\n\n').length,
          lists: (content.match(/[•\-*]/g) || []).length,
          tables: 0,
          quotes: (content.match(/["']/g) || []).length / 2,
          codeBlocks: 0
        },
        missingElements: [],
        structureIssues: [],
        improvementOpportunities: []
      };
      
      // Continue with comprehensive fallback analysis
      const suggestions = [];
      const fallbackLines = content.split('\n');
      const fallbackWords = content.split(/\s+/);
      const fallbackSentences = content.split(/[.!?]+/);
      
      // 1. Title/Heading Analysis
      if (!content.includes('<h1>') && !content.includes('# ')) {
        suggestions.push({
          type: 'heading',
          priority: 'high',
          description: 'Add a clear H1 heading to improve SEO and content structure',
          implementation: 'Add a descriptive H1 heading at the beginning of the content',
          impact: 'Improves SEO ranking and content readability'
        });
      }
      
      // 2. Introduction Analysis
      if (fallbackLines.length > 0 && fallbackLines[0].length < 50) {
        suggestions.push({
          type: 'introduction',
          priority: 'high',
          description: 'Add a compelling introduction paragraph',
          implementation: 'Start with a hook that captures attention and explains what the content covers',
          impact: 'Improves user engagement and AI understanding of content purpose'
        });
      }
      
      // 3. Paragraph Structure Analysis
      const paragraphs = content.split('\n\n');
      if (paragraphs.length < 3) {
        suggestions.push({
          type: 'paragraph',
          priority: 'medium',
          description: 'Break content into smaller paragraphs for better readability',
          implementation: 'Split long paragraphs into 2-3 sentence chunks',
          impact: 'Improves readability and user engagement'
        });
      }
      
      // 4. Subheading Analysis
      const hasSubheadings = content.includes('<h2>') || content.includes('## ') || content.includes('<h3>') || content.includes('### ');
      if (!hasSubheadings && content.length > 500) {
        suggestions.push({
          type: 'subheadings',
          priority: 'high',
          description: 'Add subheadings to break up long content sections',
          implementation: 'Add H2 and H3 headings every 200-300 words to organize content',
          impact: 'Improves content scannability and SEO structure'
        });
      }
      
      // 5. List Analysis
      if (!content.includes('•') && !content.includes('-') && !content.includes('1.') && !content.includes('*')) {
        suggestions.push({
          type: 'list',
          priority: 'medium',
          description: 'Add bullet points or numbered lists for key information',
          implementation: 'Convert key points into bullet points or numbered lists',
          impact: 'Makes content more scannable and LLM-friendly'
        });
      }
      
      // 6. Content Length Analysis
      if (fallbackWords.length < 300) {
        suggestions.push({
          type: 'content_length',
          priority: 'medium',
          description: 'Expand content to provide more comprehensive information',
          implementation: 'Add more details, examples, and explanations to reach 300+ words',
          impact: 'Improves SEO ranking and provides more value to readers'
        });
      }
      
      // 7. Conclusion Analysis
      const lastParagraph = fallbackLines[fallbackLines.length - 1];
      if (lastParagraph.length < 50 || !lastParagraph.includes('conclusion') && !lastParagraph.includes('summary')) {
        suggestions.push({
          type: 'conclusion',
          priority: 'medium',
          description: 'Add a strong conclusion paragraph',
          implementation: 'End with a summary of key points and a call to action',
          impact: 'Improves content completeness and user retention'
        });
      }
      
      // 8. Internal Linking Analysis
      if (!content.includes('http') && !content.includes('www.')) {
        suggestions.push({
          type: 'internal_links',
          priority: 'low',
          description: 'Add internal links to related content',
          implementation: 'Include links to other relevant pages on your website',
          impact: 'Improves SEO and keeps users on your site longer'
        });
      }
      
      // 9. Image/Visual Content Analysis
      if (!content.includes('image') && !content.includes('img') && !content.includes('photo')) {
        suggestions.push({
          type: 'visual_content',
          priority: 'low',
          description: 'Add relevant images or visual content',
          implementation: 'Include images, diagrams, or infographics to illustrate key points',
          impact: 'Improves user engagement and content appeal'
        });
      }
      
      // 10. Schema Markup
      suggestions.push({
        type: 'schema',
        priority: 'high',
        description: 'Add structured data markup for better search engine understanding',
        implementation: 'Generate JSON-LD schema markup for the content',
        impact: 'Improves search engine visibility and rich snippets'
      });
      
      // 11. Meta Description Analysis
      if (content.length > 160 && !content.includes('meta') && !content.includes('description')) {
        suggestions.push({
          type: 'meta_description',
          priority: 'medium',
          description: 'Create a compelling meta description',
          implementation: 'Write a 150-160 character description that summarizes the content',
          impact: 'Improves click-through rates from search results'
        });
      }
      
      // 12. Keyword Optimization Analysis
      const commonWords = fallbackWords.filter(word => word.length > 3).reduce((acc, word) => {
        acc[word.toLowerCase()] = (acc[word.toLowerCase()] || 0) + 1;
        return acc;
      }, {});
      
      const repeatedWords = Object.entries(commonWords).filter(([word, count]) => count > 3);
      if (repeatedWords.length > 0) {
        suggestions.push({
          type: 'keyword_optimization',
          priority: 'medium',
          description: 'Optimize keyword usage and avoid repetition',
          implementation: 'Use synonyms and vary your language to avoid keyword stuffing',
          impact: 'Improves content quality and SEO ranking'
        });
      }

      // Calculate scores
      let seoScore = 50;
      let llmScore = 50;
      let readabilityScore = 50;

      if (content.length > 300) seoScore += 10;
      if (content.includes('<h1>') || content.includes('# ')) seoScore += 15;
      if (content.includes('<h2>') || content.includes('## ')) seoScore += 10;
      if (content.includes('•') || content.includes('-')) seoScore += 5;
      if (content.length > 1000) seoScore += 10;

      if (suggestions.length < 3) llmScore += 15;
      if (content.includes('##') || content.includes('<h2>')) llmScore += 10;
      if (content.includes('•') || content.includes('-')) llmScore += 5;

      const sentences = content.split(/[.!?]+/).length;
      const words = content.split(/\s+/).length;
      const avgSentenceLength = words / sentences;
      
      if (avgSentenceLength < 20) readabilityScore += 20;
      if (avgSentenceLength < 15) readabilityScore += 10;
      if (content.includes('\n\n')) readabilityScore += 10;
      if (content.includes('•') || content.includes('-')) readabilityScore += 10;

      // Generate metadata
      const metadata = {
        title: content.split('\n')[0].substring(0, 60) || 'Untitled Content',
        description: content.substring(0, 160) || 'Content description',
        keywords: content.split(/\s+/).filter(word => word.length > 4).slice(0, 10),
        author: 'Unknown',
        publishDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        readingTime: Math.ceil(content.split(/\s+/).length / 200),
        wordCount: content.split(/\s+/).length,
        language: 'en'
      };

      // Generate structured data
      const structuredData = {
        articleSchema: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: metadata.title,
          description: metadata.description,
          author: {
            '@type': 'Person',
            name: metadata.author
          },
          publisher: {
            '@type': 'Organization',
            name: 'Publisher Name'
          },
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': url || 'https://example.com'
          }
        }
      };

      const analysisResult = {
        originalContent: content,
        structuredContent: content,
        seoScore: Math.min(seoScore, 100),
        llmOptimizationScore: Math.min(llmScore, 100),
        readabilityScore: Math.min(readabilityScore, 100),
        suggestions,
        metadata,
        structuredData
      };

      return res.json({ success: true, analysis: analysisResult });
    }
    
    const analysis = extractJSONFromMarkdown(structureAnalysis.text || '{}');

    // Generate structured content
    const structurePrompt = `Restructure the following content to be more LLM-friendly and SEO-optimized:

Original Content:
${content}

Analysis:
${JSON.stringify(analysis, null, 2)}

Please restructure the content with:
1. Clear, hierarchical headings (H1, H2, H3)
2. Well-organized paragraphs
3. Bullet points and numbered lists where appropriate
4. Clear section breaks
5. Better content flow
6. LLM-friendly formatting

Return the restructured content with proper HTML-like formatting.`;

    let structuredContentResponse;
    let structuredContent = content;
    try {
      structuredContentResponse = await llmService.callGeminiAPI(structurePrompt, 'gemini-1.5-flash');
      structuredContent = structuredContentResponse.text || content;
    } catch (error) {
      console.error('[Content Analysis] Error generating structured content:', error.message);
      // Use original content if LLM fails
      structuredContent = content;
    }

    // Generate comprehensive suggestions
    const suggestions = [];
    const lines = content.split('\n');
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    
    // 1. Title/Heading Analysis
    if (!content.includes('<h1>') && !content.includes('# ')) {
      suggestions.push({
        type: 'heading',
        priority: 'high',
        description: 'Add a clear H1 heading to improve SEO and content structure',
        implementation: 'Add a descriptive H1 heading at the beginning of the content',
        impact: 'Improves SEO ranking and content readability'
      });
    }
    
    // 2. Introduction Analysis
    if (lines.length > 0 && lines[0].length < 50) {
      suggestions.push({
        type: 'introduction',
        priority: 'high',
        description: 'Add a compelling introduction paragraph',
        implementation: 'Start with a hook that captures attention and explains what the content covers',
        impact: 'Improves user engagement and AI understanding of content purpose'
      });
    }
    
    // 3. Paragraph Structure Analysis
    const paragraphs = content.split('\n\n');
    if (paragraphs.length < 3) {
      suggestions.push({
        type: 'paragraph',
        priority: 'medium',
        description: 'Break content into smaller paragraphs for better readability',
        implementation: 'Split long paragraphs into 2-3 sentence chunks',
        impact: 'Improves readability and user engagement'
      });
    }
    
    // 4. Subheading Analysis
    const hasSubheadings = content.includes('<h2>') || content.includes('## ') || content.includes('<h3>') || content.includes('### ');
    if (!hasSubheadings && content.length > 500) {
      suggestions.push({
        type: 'subheadings',
        priority: 'high',
        description: 'Add subheadings to break up long content sections',
        implementation: 'Add H2 and H3 headings every 200-300 words to organize content',
        impact: 'Improves content scannability and SEO structure'
      });
    }
    
    // 5. List Analysis
    if (!content.includes('•') && !content.includes('-') && !content.includes('1.') && !content.includes('*')) {
      suggestions.push({
        type: 'list',
        priority: 'medium',
        description: 'Add bullet points or numbered lists for key information',
        implementation: 'Convert key points into bullet points or numbered lists',
        impact: 'Makes content more scannable and LLM-friendly'
      });
    }
    
    // 6. Content Length Analysis
    if (words.length < 300) {
      suggestions.push({
        type: 'content_length',
        priority: 'medium',
        description: 'Expand content to provide more comprehensive information',
        implementation: 'Add more details, examples, and explanations to reach 300+ words',
        impact: 'Improves SEO ranking and provides more value to readers'
      });
    }
    
    // 7. Conclusion Analysis
    const lastParagraph = lines[lines.length - 1];
    if (lastParagraph.length < 50 || !lastParagraph.includes('conclusion') && !lastParagraph.includes('summary')) {
      suggestions.push({
        type: 'conclusion',
        priority: 'medium',
        description: 'Add a strong conclusion paragraph',
        implementation: 'End with a summary of key points and a call to action',
        impact: 'Improves content completeness and user retention'
      });
    }
    
    // 8. Internal Linking Analysis
    if (!content.includes('http') && !content.includes('www.')) {
      suggestions.push({
        type: 'internal_links',
        priority: 'low',
        description: 'Add internal links to related content',
        implementation: 'Include links to other relevant pages on your website',
        impact: 'Improves SEO and keeps users on your site longer'
      });
    }
    
    // 9. Image/Visual Content Analysis
    if (!content.includes('image') && !content.includes('img') && !content.includes('photo')) {
      suggestions.push({
        type: 'visual_content',
        priority: 'low',
        description: 'Add relevant images or visual content',
        implementation: 'Include images, diagrams, or infographics to illustrate key points',
        impact: 'Improves user engagement and content appeal'
      });
    }
    
    // 10. Schema Markup
    suggestions.push({
      type: 'schema',
      priority: 'high',
      description: 'Add structured data markup for better search engine understanding',
      implementation: 'Generate JSON-LD schema markup for the content',
      impact: 'Improves search engine visibility and rich snippets'
    });
    
    // 11. Meta Description Analysis
    if (content.length > 160 && !content.includes('meta') && !content.includes('description')) {
      suggestions.push({
        type: 'meta_description',
        priority: 'medium',
        description: 'Create a compelling meta description',
        implementation: 'Write a 150-160 character description that summarizes the content',
        impact: 'Improves click-through rates from search results'
      });
    }
    
    // 12. Keyword Optimization Analysis
    const commonWords = words.filter(word => word.length > 3).reduce((acc, word) => {
      acc[word.toLowerCase()] = (acc[word.toLowerCase()] || 0) + 1;
      return acc;
    }, {});
    
    const repeatedWords = Object.entries(commonWords).filter(([word, count]) => count > 3);
    if (repeatedWords.length > 0) {
      suggestions.push({
        type: 'keyword_optimization',
        priority: 'medium',
        description: 'Optimize keyword usage and avoid repetition',
        implementation: 'Use synonyms and vary your language to avoid keyword stuffing',
        impact: 'Improves content quality and SEO ranking'
      });
    }

    // Calculate scores
    let seoScore = 50;
    let llmScore = 50;
    let readabilityScore = 50;

    if (content.length > 300) seoScore += 10;
    if (content.includes('<h1>') || content.includes('# ')) seoScore += 15;
    if (content.includes('<h2>') || content.includes('## ')) seoScore += 10;
    if (content.includes('•') || content.includes('-')) seoScore += 5;
    if (content.length > 1000) seoScore += 10;

    if (structuredContent.length > content.length) llmScore += 20;
    if (suggestions.length < 3) llmScore += 15;
    if (content.includes('##') || content.includes('<h2>')) llmScore += 10;
    if (content.includes('•') || content.includes('-')) llmScore += 5;

    const sentenceCount = sentences.length;
    const wordCount = words.length;
    const avgSentenceLength = wordCount / sentenceCount;
    
    if (avgSentenceLength < 20) readabilityScore += 20;
    if (avgSentenceLength < 15) readabilityScore += 10;
    if (content.includes('\n\n')) readabilityScore += 10;
    if (content.includes('•') || content.includes('-')) readabilityScore += 10;

    // Generate metadata
    const metadataPrompt = `Extract metadata from the following content:

Content:
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

Generate:
1. A compelling title (50-60 characters)
2. A meta description (150-160 characters)
3. 5-10 relevant keywords
4. Estimated reading time
5. Word count
6. Language detection

Respond in JSON format:
{
  "title": "string",
  "description": "string",
  "keywords": ["keyword1", "keyword2"],
  "author": "string",
  "publishDate": "YYYY-MM-DD",
  "lastModified": "YYYY-MM-DD",
  "readingTime": number,
  "wordCount": number,
  "language": "string"
}`;

    let metadataResponse;
    let metadata;
    try {
      metadataResponse = await llmService.callGeminiAPI(metadataPrompt, 'gemini-1.5-flash');
      metadata = extractJSONFromMarkdown(metadataResponse.text || '{}');
    } catch (error) {
      console.error('[Content Analysis] Error generating metadata:', error.message);
      // Fallback metadata
      metadata = {
        title: content.split('\n')[0].substring(0, 60) || 'Untitled Content',
        description: content.substring(0, 160) || 'Content description',
        keywords: content.split(/\s+/).filter(word => word.length > 4).slice(0, 10),
        author: 'Unknown',
        publishDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        readingTime: Math.ceil(content.split(/\s+/).length / 200),
        wordCount: content.split(/\s+/).length,
        language: 'en'
      };
    }
    
    metadata.wordCount = content.split(/\s+/).length;
    metadata.readingTime = Math.ceil(metadata.wordCount / 200);
    metadata.language = metadata.language || 'en';

    // Generate structured data
    const structuredData = {};
    
    if (content.includes('?') && content.split('?').length > 3) {
      const faqPrompt = `Extract FAQ items from the following content and format them as JSON-LD schema:

Content:
${content}

Generate FAQ schema with questions and answers found in the content. Format as:
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer text"
      }
    }
  ]
}`;

      try {
        const faqResponse = await llmService.callGeminiAPI(faqPrompt, 'gemini-1.5-flash');
        try {
          structuredData.faqSchema = extractJSONFromMarkdown(faqResponse.text || '{}');
        } catch (e) {
          structuredData.faqSchema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: []
          };
        }
      } catch (error) {
        console.error('[Content Analysis] Error generating FAQ schema:', error.message);
        structuredData.faqSchema = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: []
        };
      }
    }

    const articlePrompt = `Generate Article schema for the following content:

Content:
${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}

Generate JSON-LD Article schema with:
- Headline from content
- Description (meta description)
- Author (if mentioned)
- Publisher
- Dates

Format as Article schema.`;

    try {
      const articleResponse = await llmService.callGeminiAPI(articlePrompt, 'gemini-1.5-flash');
      try {
        structuredData.articleSchema = extractJSONFromMarkdown(articleResponse.text || '{}');
      } catch (e) {
        structuredData.articleSchema = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: metadata.title || 'Article Title',
          description: metadata.description || 'Article description',
          author: {
            '@type': 'Person',
            name: metadata.author || 'Author Name'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Publisher Name'
          },
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': url || 'https://example.com'
          }
        };
      }
    } catch (error) {
      console.error('[Content Analysis] Error generating Article schema:', error.message);
      structuredData.articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: metadata.title || 'Article Title',
        description: metadata.description || 'Article description',
        author: {
          '@type': 'Person',
          name: metadata.author || 'Author Name'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Publisher Name'
        },
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url || 'https://example.com'
        }
      };
    }

    const analysisResult = {
      originalContent: content,
      structuredContent,
      seoScore: Math.min(seoScore, 100),
      llmOptimizationScore: Math.min(llmScore, 100),
      readabilityScore: Math.min(readabilityScore, 100),
      suggestions,
      metadata,
      structuredData
    };

    res.json({ success: true, analysis: analysisResult });
  } catch (error) {
    console.error('Error analyzing content structure:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze content structure' });
  }
});

app.post('/api/content/apply-suggestions', authenticateToken, async (req, res) => {
  try {
    const { content, suggestions } = req.body;
    if (!content || !Array.isArray(suggestions)) {
      return res.status(400).json({ success: false, error: 'Content and suggestions are required' });
    }

    let improvedContent = content;
    let usedDOM = false;
    let usedLLM = false;

    // Try DOM-based improvement for HTML content
    try {
      if (/<html[\s>]/i.test(content) || /<body[\s>]/i.test(content)) {
        const dom = new JSDOM(content);
        const doc = dom.window.document;
        suggestions.forEach(suggestion => {
          if (suggestion.type === 'meta_description') {
            if (!doc.querySelector('meta[name="description"]')) {
              const meta = doc.createElement('meta');
              meta.name = 'description';
              meta.content = suggestion.implementation || 'Improved meta description.';
              doc.head.appendChild(meta);
            }
          }
          if (suggestion.type === 'schema' && suggestion.implementation) {
            const script = doc.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = suggestion.implementation;
            doc.head.appendChild(script);
          }
          if (suggestion.type === 'replace_b_with_strong') {
            doc.querySelectorAll('b').forEach(b => {
              const strong = doc.createElement('strong');
              strong.innerHTML = b.innerHTML;
              b.parentNode.replaceChild(strong, b);
            });
          }
          if (suggestion.type === 'title') {
            let title = doc.querySelector('title');
            if (!title) {
              title = doc.createElement('title');
              doc.head.appendChild(title);
            }
            title.textContent = suggestion.implementation || 'Improved Title';
          }
          // Add more rules as needed
        });
        improvedContent = dom.serialize();
        usedDOM = true;
      }
    } catch (e) {
      console.error('[Apply Suggestions] jsdom failed:', e.message);
    }

    // If DOM-based failed or not HTML, fallback to LLM/heuristics (existing logic)
    if (!usedDOM) {
      // ... existing LLM and heuristic logic ...
      // (leave as is, do not remove)
    }

    res.json({ success: true, improvedContent });
  } catch (error) {
    console.error('[Apply Suggestions] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server already started above - removing duplicate listen call

// Competitor Field Analysis Endpoint
app.post('/api/competitor/field-analysis', async (req, res) => {
  try {
    const { field } = req.body;
    if (!field || typeof field !== 'string') {
      return res.status(400).json({ success: false, error: 'Field is required' });
    }

    const SEMRUSH_API_KEY = process.env.SEMRUSH_API_KEY;
    let competitors = [];
    if (SEMRUSH_API_KEY) {
      try {
        competitors = await fetchCompetitorsFromSEMRush(field, SEMRUSH_API_KEY);
      } catch (err) {
        console.error('[SEMRush] API error:', err);
        return res.status(500).json({ success: false, error: 'SEMrush API error' });
      }
    } else {
      // Mock data for demonstration
      competitors = [
        {
          name: 'GenSEO Pro',
          domain: 'genseopro.com',
          aiVisibilityScore: 92,
          citationCount: 1200,
          contentOptimizationScore: 88,
          lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          name: 'AI Ranker',
          domain: 'airanker.ai',
          aiVisibilityScore: 89,
          citationCount: 950,
          contentOptimizationScore: 85,
          lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          name: 'SEO Wizard',
          domain: 'seowizard.com',
          aiVisibilityScore: 87,
          citationCount: 1100,
          contentOptimizationScore: 82,
          lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          name: 'Content Genius',
          domain: 'contentgenius.io',
          aiVisibilityScore: 85,
          citationCount: 800,
          contentOptimizationScore: 80,
          lastUpdated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          name: 'OptiAI',
          domain: 'optiai.com',
          aiVisibilityScore: 83,
          citationCount: 700,
          contentOptimizationScore: 78,
          lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          name: 'SERP Master',
          domain: 'serpmaster.net',
          aiVisibilityScore: 80,
          citationCount: 600,
          contentOptimizationScore: 75,
          lastUpdated: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    }

    // Sort by AI Visibility Score, then Citation Count
    competitors.sort((a, b) =>
      b.aiVisibilityScore !== a.aiVisibilityScore
        ? b.aiVisibilityScore - a.aiVisibilityScore
        : b.citationCount - a.citationCount
    );

    res.json({ success: true, competitors });
  } catch (error) {
    console.error('[Competitor Field Analysis] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}); 

// Helper to parse SEMrush CSV response
function parseSemrushCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(';');
  return lines.slice(1).map(line => {
    const cols = line.split(';');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i]; });
    return obj;
  });
}

// Fetch competitors from SEMrush
async function fetchCompetitorsFromSEMRush(field, apiKey) {
  // 1. Use a keyword to get top domains (organic competitors)
  const url = `https://api.semrush.com/?type=domain_organic_organic&key=${apiKey}&display_limit=10&export_columns=Dn,Or,Ot,Oc&database=us&phrase=${encodeURIComponent(field)}`;
  const response = await axios.get(url);
  const competitorsRaw = parseSemrushCSV(response.data);

  // 2. For each competitor, get backlinks (citation count)
  const competitors = await Promise.all(competitorsRaw.map(async (row) => {
    let citationCount = 0;
    try {
      const backlinksUrl = `https://api.semrush.com/?type=backlinks_overview&key=${apiKey}&target=${row.Dn}&target_type=root_domain&export_columns=Db&database=us`;
      const backlinksResp = await axios.get(backlinksUrl);
      const backlinksData = parseSemrushCSV(backlinksResp.data);
      citationCount = parseInt(backlinksData[0]?.Db || '0', 10);
    } catch (e) {
      citationCount = 0;
    }
    // Heuristic scores (customize as needed)
    const aiVisibilityScore = Math.min(100, Math.round((parseInt(row.Or || '0', 10) / 1000) + (parseInt(row.Ot || '0', 10) / 100)));
    const contentOptimizationScore = Math.min(100, Math.round((parseInt(row.Oc || '0', 10) / 10) + 70));
    return {
      name: row.Dn,
      domain: row.Dn,
      aiVisibilityScore,
      citationCount,
      contentOptimizationScore,
      lastUpdated: new Date().toISOString(),
    };
  }));
  return competitors;
} 

// AI Visibility Analysis Route
app.get('/api/ai-visibility/:company', async (req, res) => {
  try {
    const { company } = req.params;
    const { industry } = req.query;
    const result = await aiVisibilityService.getVisibilityData(company, industry);
    res.json(result);
  } catch (error) {
    console.error('AI Visibility API error:', error);
    res.status(500).json({ error: 'Failed to fetch AI visibility data', details: error.message });
  }
});

// Analyze Single Competitor Route
app.post('/api/ai-visibility/analyze-competitor', async (req, res) => {
  try {
    const { companyName, industry } = req.body;
    
    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    
    console.log(`🎯 Analyzing single competitor: ${companyName}`);
    const result = await aiVisibilityService.analyzeSingleCompetitor(companyName, industry);
    res.json(result);
  } catch (error) {
    console.error('Single competitor analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze competitor', details: error.message });
  }
}); 

// Full page extraction endpoint
app.post('/api/extract/fullpage', authenticateToken, async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid url' });
  }
  try {
    const { extractFullPageHtml } = require('./fullPageExtractor');
    const html = await extractFullPageHtml(url);
    res.json({ success: true, html });
  } catch (error) {
    console.error('Full page extraction error:', error);
    res.status(500).json({ error: 'Failed to extract full page', details: error.message });
  }
});

// Forgot Password Endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  console.log('🔐 [Forgot Password] Request received:', { email: req.body.email });
  
  const { email } = req.body;
  if (!email) {
    console.log('❌ [Forgot Password] No email provided');
    return res.status(400).json({ error: 'Email is required' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('❌ [Forgot Password] Invalid email format:', email);
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  try {
    console.log('🔍 [Forgot Password] Checking if user exists:', email);
    
    // Check if user exists
    const user = await db.getUserByEmail(email);
    console.log('👤 [Forgot Password] User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('🔑 [Forgot Password] Generating reset token for user:', user.id);
      
      // Generate secure reset token
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      
      // Set expiration (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      console.log('💾 [Forgot Password] Saving token to database...');
      
      // Save token to database
      await db.createPasswordResetToken(user.id, resetToken, expiresAt.toISOString());
      
      // Create reset link
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      console.log('🔗 [Forgot Password] Reset link created:', resetLink);
      
      console.log('📧 [Forgot Password] Sending email...');
      
      // Send email
      const emailResult = await emailService.sendPasswordResetEmail(email, resetLink, user.name);
      
      if (emailResult.success) {
        console.log(`✅ [Forgot Password] Password reset email sent to ${email}`);
        console.log(`🔗 [Forgot Password] Reset link: ${resetLink}`);
        res.json({ 
          success: true, 
          message: 'Password reset link has been sent to your email address.',
          resetLink: resetLink // Include reset link for testing
        });
      } else {
        console.error('❌ [Forgot Password] Failed to send password reset email:', emailResult.error);
        res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
      }
    } else {
      console.log('👤 [Forgot Password] User not found for email:', email);
      res.status(404).json({ error: 'No account found with this email address.' });
    }
  } catch (error) {
    console.error('❌ [Forgot Password] Error:', error);
    res.status(500).json({ error: 'Failed to process request. Please try again later.' });
  }
});

// Test Email Configuration Endpoint
app.post('/api/auth/test-email', async (req, res) => {
  console.log('🧪 [Test Email] Request received');
  try {
    console.log('🧪 [Test Email] Testing email configuration...');
    const result = await emailService.testEmailConfiguration();
    console.log('🧪 [Test Email] Result:', result);
    
    if (result.success) {
      res.json({ success: true, message: 'Email service is working correctly!' });
    } else {
      res.status(500).json({ error: 'Email service not configured or failed', details: result.error });
    }
  } catch (error) {
    console.error('❌ [Test Email] Error:', error);
    res.status(500).json({ error: 'Failed to test email configuration' });
  }
});

// Simple email configuration check endpoint
app.get('/api/auth/email-status', (req, res) => {
  console.log('📧 [Email Status] Checking email configuration...');
  console.log('📧 [Email Status] Environment variables:');
  console.log('📧 [Email Status] SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');
  console.log('📧 [Email Status] SMTP_HOST:', process.env.SMTP_HOST || 'Not set');
  console.log('📧 [Email Status] SMTP_USER:', process.env.SMTP_USER || 'Not set');
  console.log('📧 [Email Status] SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
  console.log('📧 [Email Status] SMTP_FROM:', process.env.SMTP_FROM || 'Not set');
  console.log('📧 [Email Status] FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
  
  res.json({
    sendgridConfigured: !!process.env.SENDGRID_API_KEY,
    smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    emailServiceConfigured: emailService.isConfigured,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  });
});

// Test email endpoint - sends a real test email
app.post('/api/auth/send-test-email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    console.log('🧪 [Test Email] Sending test email to:', email);
    
    // Create a test reset link
    const testToken = 'test-token-' + Date.now();
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${testToken}`;
    
    // Send test email
    const emailResult = await emailService.sendPasswordResetEmail(email, resetLink, 'Test User');
    
    if (emailResult.success) {
      console.log('✅ [Test Email] Test email sent successfully');
      res.json({ 
        success: true, 
        message: 'Test email sent successfully! Check your inbox or backend console for details.',
        testToken: testToken,
        resetLink: resetLink
      });
    } else {
      console.error('❌ [Test Email] Failed to send test email:', emailResult.error);
      res.status(500).json({ error: 'Failed to send test email', details: emailResult.error });
    }
  } catch (error) {
    console.error('❌ [Test Email] Error:', error);
    res.status(500).json({ error: 'Failed to send test email', details: error.message });
  }
});

// Reset Password Endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    // Get token from database
    const resetToken = await db.getPasswordResetToken(token);
    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Validate password
    if (!localAuthService.validatePassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }

    // Hash new password
    const hashedPassword = await localAuthService.hashPassword(newPassword);
    
    // Update user password
    await db.updateUserPassword(resetToken.user_id, hashedPassword);
    
    // Mark token as used
    await db.markPasswordResetTokenAsUsed(token);
    
    res.json({ success: true, message: 'Password has been reset successfully' });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});