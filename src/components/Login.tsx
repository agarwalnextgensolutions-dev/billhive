import React, { useState } from 'react';
import { HiveIcon } from './HiveIcon';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { authenticateUser, SINGLE_ENTITY_PHONE, setCurrentUserSession } from '../utils/userHelper';
import { supabase } from '../utils/supabaseClient';
import { AppUser } from '../types';

interface LoginProps {
  onLogin: (user: AppUser, company: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = userId.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setError('Please enter both User ID and Password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // 1. Authenticate user credentials
      const user = await authenticateUser(cleanId, cleanPass);
      if (!user) {
        throw new Error('Invalid User ID or Password. Please try again.');
      }

      // 2. Fetch the single entity record (phone = 9999999999)
      const { data: company, error: compError } = await supabase
        .from('companies')
        .select('*')
        .eq('phone', SINGLE_ENTITY_PHONE)
        .maybeSingle();

      if (compError) {
        throw new Error('Database error loading entity: ' + compError.message);
      }

      const entityData = company || {
        id: '95bd2eb9-e92f-45d3-bbc9-5038ccc8dcd2',
        phone: SINGLE_ENTITY_PHONE,
        trade_name: 'Agarwal NextGen Solutions',
        legal_name: 'Agarwal NextGen Solutions',
        is_setup_completed: true,
      };

      // 3. Persist session
      setCurrentUserSession(user);
      localStorage.setItem('billhive_session', JSON.stringify(entityData));

      setIsLoading(false);
      onLogin(user, entityData);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto w-full max-w-md">
        <div className="flex justify-center items-center space-x-3">
          <div className="p-2.5 bg-[#3b82f6] rounded-xl text-white shadow-md shadow-blue-500/20">
            <HiveIcon className="w-8 h-8" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-[#0f172a] font-sans">
            Bill<span className="text-[#3b82f6]">Hive</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-slate-800">
          Enterprise Invoicing Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Agarwal NextGen Solutions • Unified Entity Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* User ID Field */}
            <div>
              <label htmlFor="user-id" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                User ID
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="user-id"
                  type="text"
                  required
                  autoFocus
                  autoCapitalize="none"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter User ID (e.g. Angs)"
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 placeholder-slate-400 text-sm font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="user-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="user-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter Password"
                  className="block w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 placeholder-slate-400 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div id="login-error" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Platform</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secure access info */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Role-Based Access Control Enabled</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-400 px-4 space-y-1">
        <p>© 2026 Agarwal NextGen Solutions. All rights reserved.</p>
        <p>Protected by Granular Role & Permission Access Control.</p>
      </div>
    </div>
  );
}
