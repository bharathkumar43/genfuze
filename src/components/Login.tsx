import React, { useState } from 'react';
import { User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { login, isLoading, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    displayName: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login('local', formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-blue-100">
      <div className="w-full max-w-md mx-auto p-8 rounded-2xl shadow-xl bg-white border border-primary/10">
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center mb-4 shadow">
          <User className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-primary mb-2">Welcome to Genfuze.ai</h1>
        <p className="text-slate-700 mb-6">Sign in to your account to continue</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-3 bg-blue-50 border border-primary/20 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 pr-12 py-3 bg-blue-50 border border-primary/20 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent text-white font-bold py-3 px-6 rounded-lg hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-3">
          <button className="w-full bg-white border border-primary text-primary font-medium py-2 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
            <img src="/google.svg" alt="Google" className="w-5 h-5" /> Sign in with Google
          </button>
          <button className="w-full bg-white border border-primary text-primary font-medium py-2 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
            <img src="/microsoft.svg" alt="Microsoft" className="w-5 h-5" /> Sign in with Microsoft
          </button>
        </div>
        <div className="mt-6 text-center">
          <a href="#" className="text-primary font-medium underline underline-offset-2 transition-all duration-200 shadow-none hover:text-accent hover:underline hover:decoration-4 hover:decoration-accent focus:outline-none focus:ring-2 focus:ring-primary">
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
} 