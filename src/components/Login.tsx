import React, { useState } from 'react';
import { HiveIcon } from './HiveIcon'; // Custom vector icon helper
import { Phone, ArrowRight } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface LoginProps {
  onLogin: (company: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // Query the database for the phone number
      const { data: existingCompany, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (existingCompany) {
        setIsLoading(false);
        onLogin(existingCompany);
      } else {
        // Create new profile with a unique ID
        const { data: newCompany, error: insertError } = await supabase
          .from('companies')
          .insert([{ phone: cleanPhone, is_setup_completed: false }])
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        setIsLoading(false);
        onLogin(newCompany);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto w-full max-w-md">
        <div className="flex justify-center items-center space-x-3">
          <div className="p-2.5 bg-[#3b82f6] rounded-lg text-white shadow-sm">
            <HiveIcon className="w-8 h-8" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-[#0f172a] font-sans">
            Bill<span className="text-[#3b82f6]">Hive</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-xl font-medium tracking-tight text-[#64748b]">
          Invoicing & Billing Portal
        </h2>
        <p className="mt-1 text-center text-sm text-[#64748b]">
          Enter your registered mobile number to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-md rounded-lg border border-[#e2e8f0]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="phone-number" className="block text-sm font-semibold text-slate-700">
                Mobile Number
              </label>
              <div className="mt-2 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="absolute inset-y-0 left-11 flex items-center pointer-events-none text-slate-400 text-sm font-medium pr-1 border-r border-[#e2e8f0]">
                  +91
                </div>
                <input
                  id="phone-number"
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPhone(val);
                    if (val.length === 10) setError('');
                  }}
                  placeholder="Enter Mobile Number"
                  className="block w-full pl-[5.5rem] pr-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] text-slate-900 placeholder-slate-400 text-sm font-mono tracking-wider"
                />
              </div>
              {error && (
                <p id="phone-error" className="mt-2 text-xs text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span> {error}
                </p>
              )}
            </div>

            <div>
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3b82f6] transition-colors disabled:bg-[#3b82f6]/50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <>
                    <span>Proceed to Dashboard</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-[#64748b] px-4">
        <p>© 2026 BillHive Invoicing Inc. All rights reserved.</p>
        <p className="mt-1">Designed with precision for business scaling.</p>
      </div>
    </div>
  );
}
