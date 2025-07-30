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
    redirectUri: import.meta.env.VITE_REACT_APP_REDIRECT_URI || window.location.origin,
    scopes: ['openid', 'profile', 'email', 'User.Read']
  };

  constructor() {
    // Validate configuration on initialization
    if (!this.config.clientId) {
      console.error('[AuthService] Azure Client ID is not configured');
    }
    if (!this.config.tenantId) {
      console.error('[AuthService] Azure Tenant ID is not configured');
    }
    console.log('[AuthService] Configuration loaded:', {
      clientId: this.config.clientId ? 'Configured' : 'Missing',
      tenantId: this.config.tenantId ? 'Configured' : 'Missing',
      redirectUri: this.config.redirectUri
    });
  }

  // Initialize Microsoft Authentication Library (MSAL)
  private async initializeMSAL() {
    try {
    if (typeof window !== 'undefined' && !window.msalInstance) {
        console.log('[AuthService] Initializing MSAL with config:', {
          clientId: this.config.clientId,
          tenantId: this.config.tenantId,
          redirectUri: this.config.redirectUri
        });
        
      console.log('[AuthService] Importing @azure/msal-browser...');
      const { PublicClientApplication } = await import('@azure/msal-browser');
      console.log('[AuthService] MSAL imported successfully');
      
      console.log('[AuthService] Creating MSAL instance...');
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
      console.log('[AuthService] MSAL instance created');
        
        // Initialize the MSAL instance
        console.log('[AuthService] Initializing MSAL instance...');
        await window.msalInstance.initialize();
        console.log('[AuthService] MSAL instance initialized successfully');
    } else {
      console.log('[AuthService] MSAL instance already exists');
    }
    return window.msalInstance;
    } catch (error) {
      console.error('[AuthService] Error initializing MSAL:', error);
      throw new Error(`Failed to initialize Microsoft Authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test MSAL configuration
  async testMSALConfiguration(): Promise<boolean> {
    try {
      console.log('[AuthService] Testing MSAL configuration...');
      const msalInstance = await this.initializeMSAL();
      console.log('[AuthService] MSAL configuration test successful');
      return true;
    } catch (error) {
      console.error('[AuthService] MSAL configuration test failed:', error);
      return false;
    }
  }

  // Clear any active interactions
  private async clearActiveInteractions(msalInstance: any): Promise<void> {
    try {
      console.log('[AuthService] Clearing active interactions...');
      
      // Clear cache
      await msalInstance.clearCache();
      
      // Clear any stored interaction state
      if (msalInstance.browserStorage) {
        await msalInstance.browserStorage.clear();
      }
      
      // Clear localStorage items related to MSAL
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('msal')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('[AuthService] Active interactions cleared');
    } catch (error) {
      console.warn('[AuthService] Warning clearing interactions:', error);
    }
  }

  // Reset MSAL instance completely
  private resetMSALInstance(): void {
    try {
      console.log('[AuthService] Resetting MSAL instance...');
      if (window.msalInstance) {
        delete window.msalInstance;
      }
      console.log('[AuthService] MSAL instance reset');
    } catch (error) {
      console.warn('[AuthService] Warning resetting MSAL instance:', error);
    }
  }

  // Login with Microsoft Entra ID
  async login(): Promise<LoginResponse> {
    try {
      console.log('[AuthService] Starting Microsoft login...');
      console.log('[AuthService] Config:', this.config);
      
      const msalInstance = await this.initializeMSAL();
      console.log('[AuthService] MSAL instance ready, starting login popup...');
      
      // Clear any existing interactions first
      await this.clearActiveInteractions(msalInstance);
      
      const loginRequest = {
        scopes: this.config.scopes,
        prompt: 'select_account'
      };

      console.log('[AuthService] Login request config:', loginRequest);
      console.log('[AuthService] About to call loginPopup...');
      
      let response;
      try {
        console.log('[AuthService] About to call MSAL loginPopup...');
        response = await msalInstance.loginPopup(loginRequest);
        console.log('[AuthService] MSAL login successful, got access token');
        console.log('[AuthService] MSAL response:', {
          hasAccessToken: !!response.accessToken,
          hasAccount: !!response.account,
          accountName: response.account?.name,
          accountUsername: response.account?.username
        });
        
        // Test if we actually got a token
        if (!response.accessToken) {
          console.error('[AuthService] MSAL login succeeded but no access token received');
          throw new Error('MSAL login succeeded but no access token received');
        }
        
        console.log('[AuthService] MSAL access token confirmed:', {
          tokenLength: response.accessToken.length,
          tokenPreview: response.accessToken.substring(0, 20) + '...'
        });
        
        // Test if we can proceed to backend exchange
        console.log('[AuthService] MSAL login completed successfully, proceeding to backend exchange...');
        
        // Test if we have the required configuration
        console.log('[AuthService] Checking configuration before backend call:', {
          hasClientId: !!this.config.clientId,
          hasTenantId: !!this.config.tenantId,
          clientId: this.config.clientId,
          tenantId: this.config.tenantId
        });
      } catch (popupError: any) {
        console.error('[AuthService] Popup error:', popupError);
        
        // Handle interaction in progress error
        if (popupError.errorCode === 'interaction_in_progress') {
          console.log('[AuthService] Interaction in progress, clearing cache and retrying...');
          await this.clearActiveInteractions(msalInstance);
          
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            response = await msalInstance.loginPopup(loginRequest);
            console.log('[AuthService] MSAL login successful on retry, got access token');
          } catch (retryError: any) {
            console.error('[AuthService] Retry failed:', retryError);
            
            // If retry also fails, reset the MSAL instance completely
            if (retryError.errorCode === 'interaction_in_progress') {
              console.log('[AuthService] Persistent interaction issue, resetting MSAL instance...');
              this.resetMSALInstance();
              throw new Error('Authentication session is stuck. Please refresh the page and try again.');
            } else {
              throw retryError;
            }
          }
        } else {
          throw popupError;
        }
      }
      
      // Exchange the MSAL token for our backend token
      console.log('[AuthService] Exchanging token with backend...');
      console.log('[AuthService] MSAL access token received:', {
        hasToken: !!response.accessToken,
        tokenLength: response.accessToken?.length,
        tokenPreview: response.accessToken?.substring(0, 20) + '...'
      });
      
      console.log('[AuthService] About to start backend token exchange process...');
      
      let backendResponse;
      try {
        console.log('[AuthService] About to call exchangeTokenForBackendToken...');
        console.log('[AuthService] Backend URL will be:', `${API_BASE_URL}/auth/login`);
        console.log('[AuthService] Making backend request...');
        backendResponse = await this.exchangeTokenForBackendToken(response.accessToken);
        console.log('[AuthService] Backend token exchange successful');
      } catch (backendError) {
        console.error('[AuthService] Backend token exchange failed:', backendError);
        console.error('[AuthService] Backend error details:', {
          message: backendError.message,
          stack: backendError.stack
        });
        throw backendError;
      }
      
      console.log('[AuthService] Backend response received:', {
        type: typeof backendResponse,
        keys: Object.keys(backendResponse),
        hasAccessToken: !!backendResponse.accessToken,
        hasRefreshToken: !!backendResponse.refreshToken,
        hasExpiresAt: !!backendResponse.expiresAt
      });
      
      // Store tokens
      console.log('[AuthService] About to store tokens:', {
        accessToken: !!backendResponse.accessToken,
        refreshToken: !!backendResponse.refreshToken,
        expiresAt: backendResponse.expiresAt,
        accessTokenLength: backendResponse.accessToken?.length,
        refreshTokenLength: backendResponse.refreshToken?.length
      });
      
      // Check if we have all required fields
      if (!backendResponse.accessToken || !backendResponse.refreshToken || !backendResponse.expiresAt) {
        console.error('[AuthService] Missing required token fields:', {
          accessToken: !!backendResponse.accessToken,
          refreshToken: !!backendResponse.refreshToken,
          expiresAt: !!backendResponse.expiresAt
        });
        
        // Generate fallback values if missing
        if (!backendResponse.accessToken) {
          throw new Error('Backend response missing access token');
        }
        
        const fallbackExpiresAt = new Date();
        fallbackExpiresAt.setDate(fallbackExpiresAt.getDate() + 7);
        
        const fallbackRefreshToken = 'fallback-refresh-' + Date.now();
        
        console.log('[AuthService] Using fallback values:', {
          expiresAt: fallbackExpiresAt.toISOString(),
          refreshToken: fallbackRefreshToken
        });
        
        // Update the response with fallback values
        backendResponse.refreshToken = backendResponse.refreshToken || fallbackRefreshToken;
        backendResponse.expiresAt = backendResponse.expiresAt || fallbackExpiresAt.toISOString();
      }
      
      this.setTokens(backendResponse.accessToken, backendResponse.refreshToken, backendResponse.expiresAt);
      console.log('[AuthService] Tokens stored successfully');
      
      return backendResponse;
    } catch (error) {
      console.error('[AuthService] Microsoft login error:', error);
      if (error instanceof Error) {
        throw new Error(`Microsoft authentication failed: ${error.message}`);
      } else {
      throw new Error('Failed to authenticate with Microsoft Entra ID');
      }
    }
  }

  // Login with Google OAuth
  async googleLogin(): Promise<LoginResponse> {
    try {
      // Load Google Identity Services
      await this.loadGoogleIdentityServices();
      
      return new Promise((resolve, reject) => {
        // Initialize Google Sign-In with no redirect URI
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_REACT_APP_GOOGLE_CLIENT_ID || '',
          scope: 'openid profile email',
          prompt: 'select_account',
          callback: async (response: any) => {
            try {
              if (response.error) {
                reject(new Error(response.error));
                return;
              }
              
              // Exchange the Google token for our backend token
              const backendResponse = await this.exchangeGoogleTokenForBackendToken(response.access_token);
              
              // Store tokens
              this.setTokens(backendResponse.accessToken, backendResponse.refreshToken, backendResponse.expiresAt);
              
              resolve(backendResponse);
            } catch (error) {
              reject(error);
            }
          }
        });
        
        // Request access token
        client.requestAccessToken();
      });
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  // Load Google Identity Services
  private async loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  // Alternative Google login using One Tap
  async googleLoginOneTap(): Promise<LoginResponse> {
    try {
      await this.loadGoogleIdentityServices();
      
      return new Promise((resolve, reject) => {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_REACT_APP_GOOGLE_CLIENT_ID || '',
          callback: async (response: any) => {
            try {
              if (response.error) {
                reject(new Error(response.error));
                return;
              }
              
              // Exchange the Google token for our backend token
              const backendResponse = await this.exchangeGoogleTokenForBackendToken(response.credential);
              
              // Store tokens
              this.setTokens(backendResponse.accessToken, backendResponse.refreshToken, backendResponse.expiresAt);
              
              resolve(backendResponse);
            } catch (error) {
              reject(error);
            }
          }
        });
        
        (window as any).google.accounts.id.prompt();
      });
    } catch (error) {
      console.error('Google One Tap login error:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  // Exchange Google token for backend token
  private async exchangeGoogleTokenForBackendToken(accessToken: string): Promise<LoginResponse> {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      const userInfo = await userInfoResponse.json();
      
      // Send to our backend with access token
      const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken,
          userInfo: userInfo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to authenticate with backend');
      }

      return response.json();
    } catch (error) {
      console.error('Error exchanging Google token:', error);
      throw new Error('Failed to authenticate with backend');
    }
  }

  // Local login with email and password
  async localLogin(credentials: { email: string; password: string }): Promise<LoginResponse> {
    try {
      console.log('🔐 [AuthService] Starting local login with credentials:', { 
        email: credentials.email, 
        passwordLength: credentials.password.length 
      });
      console.log('🌐 [AuthService] API Base URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/auth/local-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 [AuthService] Local login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [AuthService] Local login failed:', errorData);
        throw new Error(errorData.error || 'Failed to authenticate');
      }

      const data = await response.json();
      console.log('✅ [AuthService] Local login successful, received data:', { 
        user: data.user, 
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
        expiresAt: data.expiresAt
      });
      
      // Store tokens
      this.setTokens(data.accessToken, data.refreshToken, data.expiresAt);
      console.log('💾 [AuthService] Tokens stored successfully for local login');
      
      return data;
    } catch (error) {
      console.error('❌ [AuthService] Local login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Local authentication failed');
    }
  }

  // Register new user
  async register(credentials: { email: string; password: string; name: string; displayName?: string }): Promise<LoginResponse> {
    try {
      console.log('🔐 Registering user with credentials:', { ...credentials, password: '[HIDDEN]' });
      console.log('🌐 API Base URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 Registration response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Registration failed:', errorData);
        throw new Error(errorData.error || 'Failed to register user');
      }

      const data = await response.json();
      console.log('✅ Registration successful, received data:', { 
        user: data.user, 
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
        expiresAt: data.expiresAt
      });
      
      // Store tokens
      this.setTokens(data.accessToken, data.refreshToken, data.expiresAt);
      console.log('💾 Tokens stored successfully');
      
      return data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  // Exchange MSAL token for backend token
  private async exchangeTokenForBackendToken(msalToken: string): Promise<LoginResponse> {
    console.log('[AuthService] Exchanging token with backend...');
    console.log('[AuthService] Backend URL:', `${API_BASE_URL}/auth/login`);
    console.log('[AuthService] Request payload:', {
      clientId: this.config.clientId,
      tenantId: this.config.tenantId,
      hasToken: !!msalToken,
      tokenLength: msalToken?.length
    });

    try {
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

      console.log('[AuthService] Backend response status:', response.status);
      console.log('[AuthService] Backend response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AuthService] Backend error response:', errorData);
        throw new Error(errorData.error || `Backend authentication failed with status ${response.status}`);
      }

      const responseData = await response.json();
      console.log('[AuthService] Backend success response:', {
        hasUser: !!responseData.user,
        hasToken: !!responseData.accessToken,
        hasRefreshToken: !!responseData.refreshToken,
        hasExpiresAt: !!responseData.expiresAt,
        userEmail: responseData.user?.email,
        expiresAt: responseData.expiresAt,
        accessTokenLength: responseData.accessToken?.length,
        refreshTokenLength: responseData.refreshToken?.length
      });

      console.log('[AuthService] Full backend response:', responseData);
      console.log('[AuthService] Response keys:', Object.keys(responseData));

      // Check if response has the expected structure
      if (!responseData.accessToken || !responseData.refreshToken || !responseData.expiresAt) {
        console.error('[AuthService] Backend response missing required fields:', {
          hasAccessToken: !!responseData.accessToken,
          hasRefreshToken: !!responseData.refreshToken,
          hasExpiresAt: !!responseData.expiresAt,
          availableKeys: Object.keys(responseData)
        });
        
        // Instead of throwing error, let's try to handle missing fields gracefully
        console.warn('[AuthService] Attempting to handle missing fields...');
        
        // Check if we have at least an access token
        if (!responseData.accessToken) {
          throw new Error('Backend response is missing access token');
        }
        
        // Generate default values for missing fields
        const defaultExpiresAt = new Date();
        defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 7); // 7 days from now
        
        const defaultRefreshToken = 'temp-refresh-token-' + Date.now();
        
        console.log('[AuthService] Using default values:', {
          expiresAt: defaultExpiresAt.toISOString(),
          refreshToken: defaultRefreshToken
        });
        
        // Create a complete response object
        return {
          ...responseData,
          refreshToken: responseData.refreshToken || defaultRefreshToken,
          expiresAt: responseData.expiresAt || defaultExpiresAt.toISOString()
        };
      }

      return responseData;
    } catch (fetchError) {
      console.error('[AuthService] Fetch error:', fetchError);
      throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      console.log('[AuthService] Starting logout process...');
      
      // Clear backend session first
      await this.clearBackendSession();
      console.log('[AuthService] Backend session cleared');
      
      // Clear local storage immediately
      this.clearTokens();
      console.log('[AuthService] Local tokens cleared');
      
      // Clear MSAL cache silently without showing popup
      try {
        if (window.msalInstance && typeof window.msalInstance.clearCache === 'function') {
          window.msalInstance.clearCache();
          console.log('[AuthService] MSAL cache cleared');
        }
      } catch (msalError) {
        console.warn('[AuthService] MSAL cache clear failed, but tokens cleared:', msalError);
        // Don't throw error for MSAL cache clear failure since we've already cleared tokens
      }
      
      console.log('[AuthService] Logout completed successfully');
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
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
    
    console.log('[AuthService] Checking authentication:', {
      hasToken: !!token,
      hasExpiresAt: !!expiresAt,
      expiresAt: expiresAt,
      currentTime: new Date().toISOString(),
      tokenExpiry: expiresAt ? new Date(expiresAt).toISOString() : 'N/A',
      isExpired: expiresAt ? new Date(expiresAt) <= new Date() : 'N/A'
    });
    
    if (!token || !expiresAt) {
      console.log('[AuthService] Authentication failed: missing token or expiry');
      return false;
    }
    
    // Check if token is expired
    const isValid = new Date(expiresAt) > new Date();
    console.log('[AuthService] Token validity check:', { isValid });
    return isValid;
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
    console.log('[AuthService] Setting tokens in localStorage:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      expiresAt: expiresAt,
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length
    });
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('expiresAt', expiresAt);
    
    // Verify tokens were stored
    console.log('[AuthService] Tokens stored, verification:', {
      storedAccessToken: !!localStorage.getItem('accessToken'),
      storedRefreshToken: !!localStorage.getItem('refreshToken'),
      storedExpiresAt: localStorage.getItem('expiresAt')
    });
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