const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class JSONStorage {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.sessionsFile = path.join(this.dataDir, 'sessions.json');
    this.userSessionsFile = path.join(this.dataDir, 'user-sessions.json');
    this.qaDataFile = path.join(this.dataDir, 'qa-data.json');
    this.sessionStatsFile = path.join(this.dataDir, 'session-stats.json');
    
    this.users = new Map();
    this.sessions = new Map();
    this.userSessions = new Map();
    this.qaData = new Map();
    this.sessionStats = new Map();
    
    this.initialize();
  }

  async initialize() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Load existing data or create default
      await this.loadData();
      
      // Create default admin user if no users exist
      if (this.users.size === 0) {
        await this.createDefaultAdmin();
      }
      
      console.log('✅ JSON storage initialized');
    } catch (error) {
      console.error('Error initializing JSON storage:', error);
    }
  }

  async loadData() {
    try {
      // Load users
      try {
        const usersData = await fs.readFile(this.usersFile, 'utf8');
        const usersArray = JSON.parse(usersData);
        this.users.clear();
        usersArray.forEach(user => {
          this.users.set(user.id, user);
          this.users.set(user.email, user);
        });
      } catch (error) {
        // File doesn't exist, start with empty users
      }

      // Load sessions
      try {
        const sessionsData = await fs.readFile(this.sessionsFile, 'utf8');
        const sessionsArray = JSON.parse(sessionsData);
        this.sessions.clear();
        sessionsArray.forEach(session => {
          this.sessions.set(session.id, session);
        });
      } catch (error) {
        // File doesn't exist, start with empty sessions
      }

      // Load user sessions
      try {
        const userSessionsData = await fs.readFile(this.userSessionsFile, 'utf8');
        const userSessionsArray = JSON.parse(userSessionsData);
        this.userSessions.clear();
        userSessionsArray.forEach(session => {
          this.userSessions.set(session.id, session);
          this.userSessions.set(session.refreshToken, session);
        });
      } catch (error) {
        // File doesn't exist, start with empty user sessions
      }

      // Load QA data
      try {
        const qaDataData = await fs.readFile(this.qaDataFile, 'utf8');
        const qaDataArray = JSON.parse(qaDataData);
        this.qaData.clear();
        qaDataArray.forEach(qa => {
          this.qaData.set(qa.id, qa);
        });
      } catch (error) {
        // File doesn't exist, start with empty QA data
      }

      // Load session stats
      try {
        const statsData = await fs.readFile(this.sessionStatsFile, 'utf8');
        const statsArray = JSON.parse(statsData);
        this.sessionStats.clear();
        statsArray.forEach(stat => {
          this.sessionStats.set(stat.sessionId, stat);
        });
      } catch (error) {
        // File doesn't exist, start with empty stats
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async saveData() {
    try {
      // Save users
      const usersArray = Array.from(this.users.values()).filter(user => user.id);
      await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2));

      // Save sessions
      const sessionsArray = Array.from(this.sessions.values());
      await fs.writeFile(this.sessionsFile, JSON.stringify(sessionsArray, null, 2));

      // Save user sessions
      const userSessionsArray = Array.from(this.userSessions.values()).filter(session => session.id);
      await fs.writeFile(this.userSessionsFile, JSON.stringify(userSessionsArray, null, 2));

      // Save QA data
      const qaDataArray = Array.from(this.qaData.values());
      await fs.writeFile(this.qaDataFile, JSON.stringify(qaDataArray, null, 2));

      // Save session stats
      const statsArray = Array.from(this.sessionStats.values());
      await fs.writeFile(this.sessionStatsFile, JSON.stringify(statsArray, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Create default admin user
  async createDefaultAdmin() {
    const adminUser = {
      id: 'admin-001',
      email: 'admin@example.com',
      name: 'Admin User',
      displayName: 'Administrator',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', // admin123
      roles: ['admin', 'user'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.createUser(adminUser);
    console.log('✅ Default admin user created');
  }

  // User Management
  async createUser(userData) {
    const user = {
      ...userData,
      id: userData.id || uuidv4(),
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString()
    };
    
    this.users.set(user.id, user);
    this.users.set(user.email, user);
    await this.saveData();
    return user.id;
  }

  async getUserById(userId) {
    return this.users.get(userId) || null;
  }

  async getUserByEmail(email) {
    return this.users.get(email) || null;
  }

  async updateUserLastLogin(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      user.updatedAt = new Date().toISOString();
      this.users.set(userId, user);
      this.users.set(user.email, user);
      await this.saveData();
    }
    return true;
  }

  // Session Management
  async saveUserSession(userId, refreshToken, expiresAt) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId,
      refreshToken,
      expiresAt,
      createdAt: new Date().toISOString()
    };
    
    this.userSessions.set(sessionId, session);
    this.userSessions.set(refreshToken, session);
    await this.saveData();
    return sessionId;
  }

  async getUserSessionByRefreshToken(refreshToken) {
    return this.userSessions.get(refreshToken) || null;
  }

  async deleteUserSession(refreshToken) {
    const session = this.userSessions.get(refreshToken);
    if (session) {
      this.userSessions.delete(session.id);
      this.userSessions.delete(refreshToken);
      await this.saveData();
      return true;
    }
    return false;
  }

  async deleteExpiredUserSessions() {
    const now = new Date();
    let deletedCount = 0;
    
    for (const [key, session] of this.userSessions.entries()) {
      if (new Date(session.expiresAt) < now) {
        this.userSessions.delete(session.id);
        this.userSessions.delete(session.refreshToken);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      await this.saveData();
    }
    return deletedCount;
  }

  // Application Sessions
  async saveSession(sessionData) {
    const session = {
      ...sessionData,
      id: sessionData.id || uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.sessions.set(session.id, session);
    
    // Save QA data if provided
    if (sessionData.qaData && sessionData.qaData.length > 0) {
      for (const qa of sessionData.qaData) {
        await this.saveQAData({
          ...qa,
          sessionId: session.id
        });
      }
    }
    
    await this.saveData();
    return session.id;
  }

  async getSessionsByType(type, userId) {
    const userSessions = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.type === type) {
        userSessions.push(session);
      }
    }
    return userSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getSessionById(sessionId, userId) {
    const session = this.sessions.get(sessionId);
    if (session && session.userId === userId) {
      const qaData = await this.getQADataBySessionId(sessionId);
      const stats = this.sessionStats.get(sessionId);
      
      return {
        ...session,
        qaData,
        statistics: stats || {
          totalQuestions: qaData.length,
          avgAccuracy: '',
          totalCost: '0'
        }
      };
    }
    return null;
  }

  async deleteSession(sessionId, userId) {
    const session = this.sessions.get(sessionId);
    if (session && session.userId === userId) {
      this.sessions.delete(sessionId);
      
      // Delete related QA data
      for (const [key, qa] of this.qaData.entries()) {
        if (qa.sessionId === sessionId) {
          this.qaData.delete(key);
        }
      }
      
      // Delete statistics
      this.sessionStats.delete(sessionId);
      
      await this.saveData();
      return true;
    }
    return false;
  }

  async getSessionCount(type, userId) {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.type === type) {
        count++;
      }
    }
    return count;
  }

  // QA Data Management
  async saveQAData(qaData) {
    const qa = {
      ...qaData,
      id: qaData.id || uuidv4(),
      createdAt: new Date().toISOString()
    };
    
    this.qaData.set(qa.id, qa);
    await this.saveData();
    return qa.id;
  }

  async getQADataBySessionId(sessionId) {
    const qaData = [];
    for (const qa of this.qaData.values()) {
      if (qa.sessionId === sessionId) {
        qaData.push(qa);
      }
    }
    return qaData.sort((a, b) => a.questionOrder - b.questionOrder);
  }

  // Statistics
  async saveSessionStatistics(sessionId, statistics) {
    this.sessionStats.set(sessionId, {
      ...statistics,
      sessionId,
      updatedAt: new Date().toISOString()
    });
    await this.saveData();
  }

  // Cleanup expired sessions periodically
  startCleanupInterval() {
    setInterval(async () => {
      await this.deleteExpiredUserSessions();
    }, 60000); // Clean up every minute
  }

  // Get storage stats
  getStorageStats() {
    return {
      users: this.users.size / 2, // Divide by 2 because we store by both id and email
      sessions: this.sessions.size,
      userSessions: this.userSessions.size / 2, // Divide by 2 because we store by both id and token
      qaData: this.qaData.size,
      sessionStats: this.sessionStats.size
    };
  }
}

module.exports = JSONStorage; 