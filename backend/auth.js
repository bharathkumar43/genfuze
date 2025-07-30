const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const axios = require('axios');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.azureTenantId = process.env.AZURE_TENANT_ID;
    this.azureClientId = process.env.AZURE_CLIENT_ID;
    
    console.log('[AuthService] Initializing with Azure config:', {
      tenantId: this.azureTenantId ? 'Configured' : 'Missing',
      clientId: this.azureClientId ? 'Configured' : 'Missing'
    });
    
    // Initialize JWKS client with tenant-specific URI
    if (this.azureTenantId) {
      this.jwksClient = jwksClient({
        jwksUri: `https://login.microsoftonline.com/${this.azureTenantId}/discovery/v2.0/keys`,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 600000, // 10 minutes
      });
    } else {
      console.error('[AuthService] Azure Tenant ID not configured');
    }
  }

  // Validate Microsoft Entra ID token
  async validateAzureToken(token) {
    try {
      console.log('[AuthService] Validating Azure token...');
      
      if (!this.jwksClient) {
        throw new Error('JWKS client not initialized - Azure Tenant ID missing');
      }
      
      // Decode the token to get the header
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      console.log('[AuthService] Token decoded, getting key ID:', decoded.header.kid);

      // Get the key ID from the token header
      const kid = decoded.header.kid;
      
      // Get the public key from Microsoft
      const key = await this.jwksClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      console.log('[AuthService] Got public key, verifying token...');

      // Verify the token
      const verified = jwt.verify(token, publicKey, {
        audience: this.azureClientId,
        issuer: `https://login.microsoftonline.com/${this.azureTenantId}/v2.0`,
        algorithms: ['RS256']
      });

      console.log('[AuthService] Token validated successfully');
      return verified;
    } catch (error) {
      console.error('[AuthService] Token validation error:', error);
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  // Get user info from Microsoft Graph API
  async getUserInfo(accessToken) {
    try {
      console.log('[AuthService] Fetching user info from Microsoft Graph...');
      console.log('[AuthService] Access token preview:', accessToken.substring(0, 20) + '...');
      
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[AuthService] User info fetched successfully:', {
        id: response.data.id,
        email: response.data.mail || response.data.userPrincipalName,
        name: response.data.displayName
      });

      return response.data;
    } catch (error) {
      console.error('[AuthService] Error fetching user info from Microsoft Graph:');
      console.error('[AuthService] Error response status:', error.response?.status);
      console.error('[AuthService] Error response data:', error.response?.data);
      console.error('[AuthService] Error message:', error.message);
      
      if (error.response?.data?.error) {
        console.error('[AuthService] Microsoft Graph error details:', {
          code: error.response.data.error.code,
          message: error.response.data.error.message,
          details: error.response.data.error.details
        });
      }
      
      throw new Error(`Failed to fetch user information: ${error.response?.data?.error?.message || error.message}`);
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