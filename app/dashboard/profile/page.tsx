"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone_number')
        .eq('id', user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone_number || '');
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ type: '', text: '' });

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phone,
      })
      .eq('id', user?.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    }
    setUpdating(false);
  };

  if (loading) return <div className="p-10 text-center font-black text-gray-900">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="text-blue-600 font-bold mb-6 hover:underline"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-4xl font-black text-gray-900 mb-8">My Profile</h1>

        <form onSubmit={handleUpdate} className="space-y-6 bg-white border-2 border-gray-100 p-8 rounded-3xl shadow-xl">
          {message.text && (
            <div className={`p-4 rounded-xl font-bold text-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-black text-gray-400 uppercase mb-2 ml-1">Email Address (Cannot change)</label>
            <input
              type="text"
              value={email}
              disabled
              className="w-full px-4 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-400 font-bold outline-none cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 mb-2 ml-1">Full Name</label>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 outline-none text-gray-900 font-bold focus:border-blue-500 transition-all"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-900 mb-2 ml-1">Phone Number</label>
            <input
              type="tel"
              placeholder="+251..."
              className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 outline-none text-gray-900 font-bold focus:border-blue-500 transition-all"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {updating ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}