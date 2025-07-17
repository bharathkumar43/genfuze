const { v4: uuidv4 } = require('uuid');

class MemoryStorage {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.userSessions = new Map();
    this.qaData = new Map();
    this.sessionStats = new Map();
    
    // Create default admin user
    this.createDefaultAdmin();
  }

  // Create default admin user
  createDefaultAdmin() {
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
    
    this.users.set(adminUser.id, adminUser);
    this.users.set(adminUser.email, adminUser);
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
  }

  // Cleanup expired sessions periodically
  startCleanupInterval() {
    setInterval(() => {
      this.deleteExpiredUserSessions();
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

module.exports = MemoryStorage; 