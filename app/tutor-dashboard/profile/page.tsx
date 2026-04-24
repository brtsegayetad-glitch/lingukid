"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';

export default function TutorProfilePage() {
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [rate, setRate] = useState(0);
  const [imageUrl, setImageUrl] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchTutorData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Load existing profile data so the fields aren't empty
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setSpecialization(data.specialization || '');
        setBio(data.bio || '');
        setRate(data.hourly_rate || 0);
        setImageUrl(data.image_url || '');
      }
      
      setLoading(false);
    };

    fetchTutorData();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('tutors')
      .update({
        specialization,
        bio,
        hourly_rate: rate,
        image_url: imageUrl, 
      })
      .eq('user_id', user?.id);

    if (error) {
      alert(error.message);
    } else {
      alert("Profile updated successfully!");
      router.push('/tutor-dashboard');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center font-black text-gray-900">Loading your profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">Edit Your Profile</h1>
          <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:underline">Cancel</button>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Photo Preview & Input */}
          <div className="flex items-center space-x-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-inner">
            <div className="h-24 w-24 rounded-2xl bg-white overflow-hidden border-4 border-white shadow-md flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="text-gray-400 font-bold text-[10px] text-center p-2 uppercase">No Photo</div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-black text-blue-700 uppercase mb-1">Profile Photo URL</label>
              <input 
                type="text" 
                placeholder="Paste an image link (e.g. from Google)"
                className="w-full p-3 border-2 border-white rounded-xl font-bold text-sm focus:border-blue-500 outline-none shadow-sm"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block font-black text-gray-700 mb-2 ml-1">Full Name</label>
            <input 
              type="text" 
              disabled
              className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-2xl font-bold text-gray-400 cursor-not-allowed"
              value={fullName}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-black text-gray-700 mb-2 ml-1">Specialization</label>
              <input 
                type="text" 
                placeholder="e.g., Amharic & Geez"
                className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-black text-gray-700 mb-2 ml-1">Hourly Rate (ETB)</label>
              <input 
                type="number" 
                className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block font-black text-gray-700 mb-2 ml-1">Your Bio (Introduction for Parents)</label>
            <textarea 
              placeholder="Tell parents about your experience and teaching style..."
              className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold h-40 outline-none focus:border-blue-500 transition-all shadow-sm"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "Updating Profile..." : "Save My Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
