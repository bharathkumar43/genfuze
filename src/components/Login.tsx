import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import ErrorNotification from './ui/ErrorNotification';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { login, error, clearError } = useAuth();

  // Debug effect to monitor error state
  useEffect(() => {
    if (error) {
      console.log('🔍 [Login] Error state changed:', error);
    }
  }, [error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Real-time validation
    const newErrors = { ...validationErrors };
    
    if (name === 'email') {
      if (!value.trim()) {
        newErrors.email = 'Please enter the email';
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    } else if (name === 'password') {
      if (!value.trim()) {
        newErrors.password = 'Please enter the password';
      } else {
        delete newErrors.password;
      }
    }
    
    setValidationErrors(newErrors);

    // Set custom HTML5 validation messages
    const input = e.target;
    if (input.name === 'email') {
      if (!input.value.trim()) {
        input.setCustomValidity('Please enter the email');
      } else if (!/\S+@\S+\.\S+/.test(input.value)) {
        input.setCustomValidity('Please enter a valid email address');
      } else {
        input.setCustomValidity('');
      }
    } else if (input.name === 'password') {
      if (!input.value.trim()) {
        input.setCustomValidity('Please enter the password');
      } else {
        input.setCustomValidity('');
      }
    }
  };

  const validateField = (name: string, value: string) => {
    const newErrors = { ...validationErrors };
    
    if (name === 'email') {
      if (!value.trim()) {
        newErrors.email = 'Please enter the email';
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    } else if (name === 'password') {
      if (!value.trim()) {
        newErrors.password = 'Please enter the password';
      } else {
        delete newErrors.password;
      }
    }
    
    setValidationErrors(newErrors);
    return !newErrors[name as keyof typeof newErrors];
  };

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Please enter the email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Please enter the password';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    console.log('🔐 [Login] Form submitted, clearing previous errors');
    
    // Validate form before submission
    if (!validateForm()) {
      console.log('❌ [Login] Form validation failed');
      return;
    }
    
    console.log('🔐 [Login] Attempting local login with:', { 
      email: formData.email, 
      passwordLength: formData.password.length 
    });
    
    setIsLoading(true);

    try {
      await login('local', { email: formData.email, password: formData.password });
      console.log('✅ [Login] Local login successful');
    } catch (err: any) {
      console.error('❌ [Login] Local login failed:', err);
      console.log('🔍 [Login] Error details:', {
        message: err.message,
        type: typeof err,
        error: err
      });
      // Error is now handled by AuthContext, no need to set it here
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setIsLoading(true);

    try {
      await login('google');
    } catch (err: any) {
      // Error is now handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    clearError();
    setIsLoading(true);

    try {
      console.log('[Login] Starting Microsoft sign-in...');
      console.log('[Login] Environment variables:', {
        clientId: import.meta.env.VITE_REACT_APP_AZURE_CLIENT_ID,
        tenantId: import.meta.env.VITE_REACT_APP_AZURE_TENANT_ID,
        redirectUri: import.meta.env.VITE_REACT_APP_REDIRECT_URI
      });
      
      await login('microsoft');
      console.log('[Login] Microsoft sign-in successful');
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[Login] Authentication state after login:', {
        isAuthenticated: authService.isAuthenticated(),
        hasToken: !!authService.getAccessToken(),
        user: await authService.getCurrentUser()
      });
      
      // Check if authentication was successful before redirecting
      if (authService.isAuthenticated()) {
        console.log('[Login] Authentication confirmed, redirecting to overview page...');
        navigate('/overview', { replace: true });
      } else {
        console.error('[Login] Authentication failed - not authenticated after login');
      }
    } catch (err: any) {
      console.error('[Login] Microsoft sign-in error:', err);
      // Error is now handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 px-4 relative overflow-hidden">
      {/* Enhanced background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 via-indigo-300/30 to-purple-300/30"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-200/20 via-blue-200/20 to-indigo-200/20"></div>
      
      {/* Animation Style 1: Floating Orbs with Pulse */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/40 to-cyan-400/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-purple-400/40 to-pink-400/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-r from-indigo-400/35 to-blue-400/35 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{animationDelay: '2s'}}></div>
      
      {/* Animation Style 2: Bouncing Elements */}
      <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-cyan-300/30 to-blue-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute top-3/4 left-1/3 w-20 h-20 bg-gradient-to-br from-indigo-300/30 to-purple-300/30 rounded-full blur-2xl animate-bounce" style={{animationDelay: '2.5s'}}></div>
      
      {/* Animation Style 3: Rotating Geometric Shapes */}
      <div className="absolute top-1/3 left-1/6 w-16 h-16 bg-gradient-to-br from-indigo-400/25 to-purple-400/25 rotate-45 blur-xl animate-spin" style={{animationDuration: '8s'}}></div>
      <div className="absolute bottom-1/3 right-1/6 w-20 h-20 bg-gradient-to-br from-blue-400/25 to-cyan-400/25 rotate-12 blur-xl animate-spin" style={{animationDuration: '12s', animationDirection: 'reverse'}}></div>
      <div className="absolute top-1/6 right-1/3 w-12 h-12 bg-gradient-to-br from-pink-400/25 to-purple-400/25 rotate-30 blur-lg animate-spin" style={{animationDuration: '6s'}}></div>
      
      {/* Animation Style 4: Floating Particles */}
      <div className="absolute top-1/5 left-1/5 w-8 h-8 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-md animate-ping" style={{animationDelay: '0s'}}></div>
      <div className="absolute top-2/5 right-1/5 w-6 h-6 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-md animate-ping" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-1/5 left-2/5 w-10 h-10 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-md animate-ping" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-2/5 right-2/5 w-7 h-7 bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 rounded-full blur-md animate-ping" style={{animationDelay: '3s'}}></div>
      
      {/* Animation Style 5: Wave-like Elements */}
      <div className="absolute top-0 left-1/2 w-64 h-64 bg-gradient-to-br from-blue-300/15 to-indigo-300/15 rounded-full blur-2xl animate-pulse" style={{animationDuration: '4s'}}></div>
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-gradient-to-br from-purple-300/15 to-pink-300/15 rounded-full blur-2xl animate-pulse" style={{animationDuration: '6s', animationDelay: '1s'}}></div>
      
      <div className="w-full max-w-lg mx-auto p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 relative z-10 bg-gradient-to-br from-white/95 via-white/90 to-white/95">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <User className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">Welcome to Genfuze.ai</h1>
          <p className="text-gray-600 text-lg">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onInvalid={(e) => {
                e.preventDefault();
                const input = e.target as HTMLInputElement;
                if (!input.value.trim()) {
                  input.setCustomValidity('Please enter the email');
                } else if (!/\S+@\S+\.\S+/.test(input.value)) {
                  input.setCustomValidity('Please enter a valid email address');
                }
              }}
              required
              className={`w-full px-4 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                validationErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
            />
            {validationErrors.email && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-900 mb-3">Password</label>
            <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onBlur={handleBlur}
                onInvalid={(e) => {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  if (!input.value.trim()) {
                    input.setCustomValidity('Please enter the password');
                  }
                }}
                required
                className={`w-full px-4 pr-12 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  validationErrors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              tabIndex={-1}
            >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            </div>
            {validationErrors.password && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.password}
              </p>
            )}
          </div>



          {/* Primary Sign In Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transform hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        {/* Links as Text */}
        <div className="mt-6 text-center space-y-2">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm"
          >
            Forgot your password?
          </button>
          <div>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-sm"
            >
              Don&apos;t have an account? Sign up
            </button>
          </div>
        </div>

        {/* Social Login Options */}
        <div className="mt-10 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/google.svg" alt="Google" className="w-6 h-6" />
            Sign in with Google
          </button>
          <button 
            onClick={handleMicrosoftSignIn}
            disabled={isLoading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="/microsoft.svg" alt="Microsoft" className="w-6 h-6" />
            Sign in with Microsoft
          </button>
        </div>
      </div>
      
      {/* Error Notification */}
      <ErrorNotification
        error={error}
        onClose={clearError}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </div>
  );
};

export default Login; 