import { User, LoginResponse, AuthConfig } from '../types';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000/api';

// Extend Window interface for MSAL
declare global {
  interface Window {
    msalInstance?: any; // Using any for MSAL instance to avoid complex typing
  }
}

class AuthService {
  private config: AuthConfig = {
    clientId: import.meta.env.VITE_REACT_APP_AZURE_CLIENT_ID || '',
    tenantId: import.meta.env.VITE_REACT_APP_AZURE_TENANT_ID || '',
    redirectUri: import.meta.env.VITE_REACT_APP_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    scopes: ['openid', 'profile', 'email', 'User.Read']
  };

  // Initialize Microsoft Authentication Library (MSAL)
  private async initializeMSAL() {
    if (typeof window !== 'undefined' && !window.msalInstance) {
      const { PublicClientApplication } = await import('@azure/msal-browser');
      
      window.msalInstance = new PublicClientApplication({
        auth: {
          clientId: this.config.clientId,
          authority: `https://login.microsoftonline.com/${this.config.tenantId}`,
          redirectUri: this.config.redirectUri,
        },
        cache: {
          cacheLocation: 'localStorage',
          storeAuthStateInCookie: false,
        }
      });
    }
    return window.msalInstance;
  }

  // Login with Microsoft Entra ID
  async login(): Promise<LoginResponse> {
    try {
      const msalInstance = await this.initializeMSAL();
      
      const loginRequest = {
        scopes: this.config.scopes,
        prompt: 'select_account'
      };

      const response = await msalInstance.loginPopup(loginRequest);
      
      // Exchange the MSAL token for our backend token
      const backendResponse = await this.exchangeTokenForBackendToken(response.accessToken);
      
      // Store tokens
      this.setTokens(backendResponse.accessToken, backendResponse.refreshToken, backendResponse.expiresAt);
      
      return backendResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Failed to authenticate with Microsoft Entra ID');
    }
  }

  // Local login with email and password
  async localLogin(credentials: { email: string; password: string }): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/local-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to authenticate');
      }

      const data = await response.json();
      
      // Store tokens
      this.setTokens(data.accessToken, data.refreshToken, data.expiresAt);
      
      return data;
    } catch (error) {
      console.error('Local login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Local authentication failed');
    }
  }

  // Register new user
  async register(credentials: { email: string; password: string; name: string; displayName?: string }): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to register user');
      }

      const data = await response.json();
      
      // Store tokens
      this.setTokens(data.accessToken, data.refreshToken, data.expiresAt);
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  // Exchange MSAL token for backend token
  private async exchangeTokenForBackendToken(msalToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msalToken,
        clientId: this.config.clientId,
        tenantId: this.config.tenantId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to authenticate with backend');
    }

    return response.json();
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Clear backend session first
      await this.clearBackendSession();
      
      // Clear local storage immediately
      this.clearTokens();
      
      // Only try MSAL logout if we have a valid MSAL instance
      try {
        const msalInstance = await this.initializeMSAL();
        if (msalInstance && typeof msalInstance.logoutPopup === 'function') {
          await msalInstance.logoutPopup({
            postLogoutRedirectUri: window.location.origin
          });
        }
      } catch (msalError) {
        console.warn('MSAL logout failed, but tokens cleared:', msalError);
        // Don't throw error for MSAL logout failure since we've already cleared tokens
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear local storage even if other operations fail
      this.clearTokens();
    }
  }

  // Clear backend session
  private async clearBackendSession(): Promise<void> {
    try {
      const token = this.getAccessToken();
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error clearing backend session:', error);
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.getCurrentUser();
          }
        }
        // Clear tokens on auth failure
        this.clearTokens();
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Error getting current user:', error);
      // Clear tokens on error
      this.clearTokens();
      return null;
    }
  }

  // Refresh access token
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.clearTokens();
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken, data.expiresAt);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      return false;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const expiresAt = this.getExpiresAt();
    
    if (!token || !expiresAt) return false;
    
    // Check if token is expired
    return new Date(expiresAt) > new Date();
  }

  // Get access token from localStorage
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  // Get refresh token from localStorage
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Get token expiration time
  getExpiresAt(): string | null {
    return localStorage.getItem('expiresAt');
  }

  // Set tokens in localStorage
  private setTokens(accessToken: string, refreshToken: string, expiresAt: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('expiresAt', expiresAt);
  }

  // Clear tokens from localStorage
  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');
  }

  // Get auth headers for API requests
  getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

// Create singleton instance
export const authService = new AuthService(); 