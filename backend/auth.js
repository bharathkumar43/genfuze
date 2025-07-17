const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const axios = require('axios');

class AuthService {
  constructor() {
    this.jwksClient = jwksClient({
      jwksUri: `https://login.microsoftonline.com/common/discovery/v2.0/keys`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000, // 10 minutes
    });
    
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.azureTenantId = process.env.AZURE_TENANT_ID;
    this.azureClientId = process.env.AZURE_CLIENT_ID;
  }

  // Validate Microsoft Entra ID token
  async validateAzureToken(token) {
    try {
      // Decode the token to get the header
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      // Get the key ID from the token header
      const kid = decoded.header.kid;
      
      // Get the public key from Microsoft
      const key = await this.jwksClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      // Verify the token
      const verified = jwt.verify(token, publicKey, {
        audience: this.azureClientId,
        issuer: `https://login.microsoftonline.com/${this.azureTenantId}/v2.0`,
        algorithms: ['RS256']
      });

      return verified;
    } catch (error) {
      console.error('Token validation error:', error);
      throw new Error('Invalid token');
    }
  }

  // Get user info from Microsoft Graph API
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new Error('Failed to fetch user information');
    }
  }

  // Generate JWT token for our application
  generateJWT(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      tenantId: user.tenantId,
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
        tenantId: decoded.tenantId,
        roles: decoded.roles || ['user']
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = AuthService; 