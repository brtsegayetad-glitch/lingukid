"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';

export default function AddChild() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [phone, setPhone] = useState('');
  
  // Updated states to handle time per day
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dayTimes, setDayTimes] = useState<Record<string, string>>({});
  
  const [packageId, setPackageId] = useState('');
  const [packages, setPackages] = useState<any[]>([]);

  // NEW: Tutor state
  const [tutorId, setTutorId] = useState('');
  const [tutors, setTutors] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    const fetchData = async () => {
      // Existing fetch for packages
      const { data: pkgData } = await supabase.from('packages').select('*');
      if (pkgData) setPackages(pkgData);

      // NEW: Fetch available tutors
     const { data: tutorData } = await supabase
        .from('tutors')
        .select('id, full_name');
      
      if (tutorData) setTutors(tutorData);
    };
    fetchData();
  }, [supabase]);

  // Updated toggle: adds/removes day and its specific time
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(prev => prev.filter(d => d !== day));
      const updatedTimes = { ...dayTimes };
      delete updatedTimes[day];
      setDayTimes(updatedTimes);
    } else {
      setSelectedDays(prev => [...prev, day]);
      setDayTimes(prev => ({ ...prev, [day]: '16:00' })); // Default time
    }
  };

  const handleTimeChange = (day: string, time: string) => {
    setDayTimes(prev => ({ ...prev, [day]: time }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDays.length === 0) {
      alert("Please select at least one preferred day.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Combine days and their specific times into one string
    const formattedSchedule = selectedDays
      .map(day => `${day}: ${dayTimes[day]}`)
      .join(', ');

    const { error } = await supabase
      .from('students')
      .insert([
        { 
          name, 
          age: parseInt(age), 
          grade_level: grade, 
          parent_id: user.id,
          parent_phone: phone,
          preferred_days: selectedDays.join(', '),
          preferred_time: formattedSchedule, // Saves day-specific times
          package_id: packageId,
          tutor_id: tutorId // NEW: Save chosen tutor ID
        }
      ]);

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard'); 
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

          <div className="pt-2 border-t border-dashed border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-1">Select Plan / Package</label>
            <select 
              required
              className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 bg-white"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
            >
              <option value="" disabled>Select a package</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
              ))}
            </select>
          </div>

          {/* NEW: Tutor Selection Field */}
          <div className="pt-2">
    <label className="block text-sm font-bold text-gray-700 mb-1">Choose Tutor</label>
    <select 
      required
      className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 bg-white"
      value={tutorId}
      onChange={(e) => setTutorId(e.target.value)}
    >
      <option value="" disabled>Select a tutor</option>
      {tutors.map((tutor) => (
        <option key={tutor.id} value={tutor.id}>
          {tutor.full_name} {/* ✅ FIX: Changed from tutor.name */}
        </option>
      ))}
    </select>
  </div>

          {/* Individual Day & Time Selectors */}
          <div className="pt-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Days & Times</label>
            <div className="space-y-3">
              {daysOfWeek.map(day => (
                <div key={day} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-20 py-2 rounded-lg text-[10px] font-black transition-all border-2 ${
                      selectedDays.includes(day) 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                      : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {day.toUpperCase()}
                  </button>
                  
                  {selectedDays.includes(day) && (
                    <input 
                      type="time"
                      required
                      className="p-1 border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                      value={dayTimes[day]}
                      onChange={(e) => handleTimeChange(day, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg hover:bg-blue-700 mt-4"
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