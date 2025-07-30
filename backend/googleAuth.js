const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

class GoogleAuthService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    
    if (!this.clientId) {
      console.warn('GOOGLE_CLIENT_ID not set in environment variables');
    }
  }

  // Verify Google ID token
  async verifyGoogleToken(idToken) {
    try {
      const client = new OAuth2Client(this.clientId);
      
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: this.clientId
      });

      const payload = ticket.getPayload();
      
      return {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
        displayName: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified
      };
    } catch (error) {
      console.error('Google token verification error:', error);
      throw new Error('Invalid Google token');
    }
  }

  // Verify Google access token
  async verifyGoogleAccessToken(accessToken) {
    try {
      // Verify the access token by calling Google's userinfo endpoint
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      
      if (!response.ok) {
        throw new Error('Invalid access token');
      }

      const userInfo = await response.json();
      
      return {
        userId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        displayName: userInfo.name,
        picture: userInfo.picture,
        emailVerified: userInfo.verified_email
      };
    } catch (error) {
      console.error('Google access token verification error:', error);
      throw new Error('Invalid Google access token');
    }
  }

  // Generate JWT token for our application
  generateJWT(user) {
    const payload = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      picture: user.picture,
      provider: 'google',
      roles: ['user']
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
  }

  // Generate refresh token
  generateRefreshToken(user) {
    const payload = {
      userId: user.userId,
      type: 'refresh',
      provider: 'google'
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

  // Extract user from token
  extractUserFromToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        displayName: decoded.displayName,
        picture: decoded.picture,
        provider: decoded.provider,
        roles: decoded.roles || ['user']
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = GoogleAuthService; 