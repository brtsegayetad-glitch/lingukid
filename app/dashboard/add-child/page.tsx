"use client";

import React, { useState, useEffect, Suspense } from 'react'; 
import { createClient } from '@/supabase';
import { useRouter, useSearchParams } from 'next/navigation'; 

// 1. We keep your exact logic inside this component
function AddChildForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const preSelectedPackage = searchParams.get('packageId') || '';
  const preSelectedTutor = searchParams.get('tutorId') || '';

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('');
  const [phone, setPhone] = useState('');
  
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dayTimes, setDayTimes] = useState<Record<string, string>>({});
  
  const [packageId, setPackageId] = useState(preSelectedPackage);
  const [tutorId, setTutorId] = useState(preSelectedTutor);

  const [packages, setPackages] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    const fetchData = async () => {
      const { data: pkgData } = await supabase.from('packages').select('*');
      if (pkgData) setPackages(pkgData);

      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id, full_name');
      
      if (tutorData) setTutors(tutorData);
    };
    fetchData();
  }, [supabase]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(prev => prev.filter(d => d !== day));
      const updatedTimes = { ...dayTimes };
      delete updatedTimes[day];
      setDayTimes(updatedTimes);
    } else {
      setSelectedDays(prev => [...prev, day]);
      setDayTimes(prev => ({ ...prev, [day]: '16:00' })); 
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
          preferred_time: formattedSchedule, 
          package_id: packageId,
          tutor_id: tutorId 
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase italic tracking-tighter">Add a Student</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Child's Name</label>
            <input 
              type="text" required
              className="w-full p-3 border-2 border-gray-100 rounded-xl text-gray-900 bg-white font-bold focus:border-blue-600 outline-none transition-all"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Age</label>
              <input 
                type="number" required
                className="w-full p-3 border-2 border-gray-100 rounded-xl text-gray-900 bg-white font-bold focus:border-blue-600 outline-none transition-all"
                value={age} onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Grade Level</label>
              <input 
                type="text" placeholder="Grade 2" required
                className="w-full p-3 border-2 border-gray-100 rounded-xl text-gray-900 bg-white font-bold focus:border-blue-600 outline-none transition-all"
                value={grade} onChange={(e) => setGrade(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Contact Phone</label>
            <input 
              type="text" placeholder="09..." required
              className="w-full p-3 border-2 border-gray-100 rounded-xl text-gray-900 bg-white font-bold focus:border-blue-600 outline-none transition-all"
              value={phone} onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="pt-2 border-t-2 border-dashed border-gray-100">
            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Select Plan</label>
            <select 
              required
              className="w-full p-3 border-2 border-gray-100 rounded-xl text-gray-900 bg-white font-bold outline-none"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
            >
              <option value="" disabled>Select a package</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Choose Tutor</label>
            <select 
              required
              className="w-full p-3 border-2 border-gray-100 rounded-xl text-gray-900 bg-white font-bold outline-none"
              value={tutorId}
              onChange={(e) => setTutorId(e.target.value)}
            >
              <option value="" disabled>Select a tutor</option>
              {tutors.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Preferred Days & Times</label>
            <div className="grid grid-cols-1 gap-2">
              {daysOfWeek.map(day => (
                <div key={day} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`w-20 py-2 rounded-lg text-[9px] font-black transition-all border-2 ${
                      selectedDays.includes(day) 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                      : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    {day.toUpperCase()}
                  </button>
                  
                  {selectedDays.includes(day) && (
                    <input 
                      type="time"
                      required
                      className="p-1 border-2 border-gray-200 rounded-lg text-xs font-black text-gray-900 outline-none"
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
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all mt-4"
          >
            {loading ? 'Saving Data...' : 'Register Student →'}
          </button>
          
          <button 
            type="button" onClick={() => router.back()}
            className="w-full text-gray-400 font-black uppercase text-[10px] py-2 italic underline underline-offset-4"
          >
            Cancel and Return
          </button>
        </form>
      </div>

      {/* FOOTER / TAIL SECTION */}
      <footer className="mt-10 mb-6 text-center">
        <div className="h-1 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
          lingukid@2026
        </p>
        <p className="text-[8px] font-bold text-gray-200 uppercase tracking-tighter mt-1">
          Bahir Dar, Ethiopia
        </p>
      </footer>
    </div>
  );
}

// 2. THIS IS THE CRITICAL CHANGE: We export a default component that wraps the form in Suspense
export default function AddChildPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black uppercase italic">Synchronizing...</div>}>
      <AddChildForm />
    </Suspense>
  );
}