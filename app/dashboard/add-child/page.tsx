"use client";

import React, { useState } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';

export default function AddChild() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('students')
      .insert([
        { 
          name, 
          age: parseInt(age), 
          grade_level: grade, 
          parent_id: user.id,
          parent_phone: phone 
        }
      ]);

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard'); // Go back to dashboard to see the new child
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Add a Student</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Child's Name</label>
            <input 
              type="text" required
              className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 bg-white"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Age</label>
              <input 
                type="number" required
                className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 bg-white"
                value={age} onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Grade Level</label>
              <input 
                type="text" placeholder="e.g. Grade 2" required
                className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 bg-white"
                value={grade} onChange={(e) => setGrade(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contact Phone</label>
            <input 
              type="text" placeholder="09..." required
              className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 bg-white"
              value={phone} onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg hover:bg-blue-700"
          >
            {loading ? 'Saving...' : 'Register Student'}
          </button>
          
          <button 
            type="button" onClick={() => router.back()}
            className="w-full text-gray-500 font-bold py-2"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}