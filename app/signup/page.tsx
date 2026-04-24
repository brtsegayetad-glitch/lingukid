"use client";

import React, { useState } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'parent' | 'tutor'>('parent');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Auth Signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Insert into Profiles Table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: authData.user.id, 
          full_name: fullName, 
          email: email,
          role: role 
        }]);

      // 3. If Tutor, also insert into Tutors Table
      if (role === 'tutor' && !profileError) {
        await supabase.from('tutors').insert([{ 
          id: authData.user.id, 
          full_name: fullName,
          hourly_rate: 0 // Admin can update this later
        }]);
      }

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
      } else {
        alert("Account created! Check your email for a confirmation link.");
        router.push('/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full border-[6px] border-black rounded-[40px] p-8 md:p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8">Join LinguKid</h1>
        
        <form onSubmit={handleSignup} className="space-y-5">
          {/* Name & Email */}
          <div className="space-y-4">
            <input 
              type="text" placeholder="Full Name" required
              className="w-full p-4 border-4 border-black rounded-2xl font-bold outline-none focus:bg-blue-50"
              onChange={(e) => setFullName(e.target.value)}
            />
            <input 
              type="email" placeholder="Email Address" required
              className="w-full p-4 border-4 border-black rounded-2xl font-bold outline-none focus:bg-blue-50"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password with "Show" Toggle */}
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" required
              className="w-full p-4 border-4 border-black rounded-2xl font-bold outline-none focus:bg-blue-50"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-5 text-[10px] font-black uppercase text-gray-400 hover:text-black"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Role Selection Checkbox Style */}
          <div className="flex gap-4 p-2 bg-gray-100 rounded-2xl border-2 border-gray-200">
            <button 
              type="button"
              onClick={() => setRole('parent')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${role === 'parent' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
            >
              I am a Parent
            </button>
            <button 
              type="button"
              onClick={() => setRole('tutor')}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${role === 'tutor' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}
            >
              I am a Tutor
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl uppercase shadow-lg hover:bg-blue-600 active:scale-95 transition-all"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Already have an account? <Link href="/login" className="text-blue-600 underline">Login</Link>
          </p>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Link href="/forgot-password">Forgot Password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}