"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Authenticate the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Fetch the role from the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      // 3. Save credentials if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }

      // 4. Redirect based on role
      if (profile?.role === 'tutor') {
        router.push('/tutor-dashboard');
      } else if (profile?.role === 'admin') {
        router.push('/admin-dashboard');
      } else {
        router.push('/dashboard'); // Default for parents
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border-2 border-gray-100">
        <h1 className="text-4xl font-black text-blue-600 text-center mb-8">KidTutor</h1>
        
        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="p-3 text-sm font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl text-center">{error}</div>}
          
          <div>
            <label className="block text-sm font-black text-gray-900 mb-1 ml-1">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 outline-none text-gray-900 font-bold focus:border-blue-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-black text-gray-900 mb-1 ml-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 outline-none text-gray-900 font-bold focus:border-blue-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[42px] text-gray-500 hover:text-blue-600"
            >
              {showPassword ? (
                <span className="text-xs font-black uppercase">Hide</span>
              ) : (
                <span className="text-xs font-black uppercase">Show</span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-black text-gray-700">Remember Me</span>
            </label>
            {/* REMOVED 'size' property here to fix the red error */}
            <Link href="/forgot-password" className="text-sm font-black text-blue-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-700 font-bold">
          New here? <Link href="/signup" className="text-blue-600 font-black hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}