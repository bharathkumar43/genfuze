const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class LocalAuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  generateJWT(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      roles: user.roles || ['user']
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
  }

  // Generate refresh token
  generateRefreshToken(user) {
    const payload = {
      userId: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }

  // Verify JWT token
  verifyJWT(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Extract user from token
  extractUserFromToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        displayName: decoded.displayName,
        roles: decoded.roles || ['user']
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // Create default admin user
  async createDefaultAdmin(db) {
    try {
      const adminExists = await db.getUserByEmail('admin@example.com');
      if (!adminExists) {
        const hashedPassword = await this.hashPassword('admin123');
        const adminUser = {
          id: uuidv4(),
          email: 'admin@example.com',
          name: 'Admin User',
          displayName: 'Administrator',
          password: hashedPassword,
          roles: ['admin', 'user'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await db.createUser(adminUser);
        console.log('✅ Default admin user created: admin@example.com');
      }
    } catch (error) {
      console.error('Error creating default admin:', error);
    }
  }
}

module.exports = LocalAuthService; 