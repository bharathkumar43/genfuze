import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginResponse } from '../types';
import { authService } from '../services/authService';

// Action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Context
interface AuthContextType extends AuthState {
  login: (method?: string, credentials?: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: 'AUTH_START' });
        
        if (authService.isAuthenticated()) {
          const user = await authService.getCurrentUser();
          if (user) {
            dispatch({ 
              type: 'AUTH_SUCCESS', 
              payload: { user, token: authService.getAccessToken()! } 
            });
          } else {
            // Clear tokens on auth failure
            authService.clearTokens();
            dispatch({ type: 'AUTH_FAILURE', payload: 'Failed to get user information' });
          }
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: 'Not authenticated' });
        }
      } catch (error) {
        // Clear tokens on auth failure
        authService.clearTokens();
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: error instanceof Error ? error.message : 'Authentication failed' 
        });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (method: string = 'microsoft', credentials?: Record<string, unknown>) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      let response: LoginResponse;
      
      switch (method) {
        case 'local':
          response = await authService.localLogin(credentials as { email: string; password: string });
          break;
        case 'register':
          response = await authService.register(credentials as { email: string; password: string; name: string; displayName?: string });
          break;
        case 'microsoft':
        default:
          response = await authService.login();
          break;
      }
      
      dispatch({ 
        type: 'AUTH_SUCCESS', 
        payload: { user: response.user, token: response.accessToken } 
      });
    } catch (error) {
      // Clear tokens on login failure
      authService.clearTokens();
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: error instanceof Error ? error.message : 'Login failed' 
      });
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the state even if logout fails
      authService.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Refresh user function
  const refreshUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user, token: authService.getAccessToken()! } 
        });
      } else {
        // Clear tokens on refresh failure
        authService.clearTokens();
        dispatch({ type: 'AUTH_FAILURE', payload: 'Failed to refresh user information' });
      }
    } catch (error) {
      // Clear tokens on refresh failure
      authService.clearTokens();
      dispatch({ 
        type: 'AUTH_FAILURE', 
        payload: error instanceof Error ? error.message : 'Failed to refresh user' 
      });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 