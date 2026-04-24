"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import { useParams, useRouter } from 'next/navigation';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_INDICES: { [key: string]: number } = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };

export default function SmartBookingPage() {
  const { id: tutorId } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [schedule, setSchedule] = useState<{ day: string, time: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- NEW STATES FOR MULTIPLE CHILDREN ---
  const [children, setChildren] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Fetch all children associated with this parent on load
  useEffect(() => {
    const fetchChildren = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('students')
          .select('id, name')
          .eq('parent_id', user.id);
        setChildren(data || []);
        
        // Default to the first child if only one exists
        if (data && data.length === 1) {
          setSelectedStudentId(data[0].id);
        }
      }
    };
    fetchChildren();
  }, [supabase]);

  const toggleDay = (day: string) => {
    const exists = schedule.find(s => s.day === day);
    if (exists) {
      setSchedule(schedule.filter(s => s.day !== day));
    } else if (schedule.length < 3) {
      setSchedule([...schedule, { day, time: "17:00" }]);
    }
  };

  const handleFinalConfirm = async () => {
    // Check for 3 days AND a selected student
    if (schedule.length !== 3 || !selectedStudentId) {
      alert("Please select a student and pick 3 days.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let monthlyBookings = [];

      for (const item of schedule) {
        const targetDayIndex = DAY_INDICES[item.day];
        let currentSearchDate = new Date(); 

        let datesFound = 0;
        while (datesFound < 4) { 
          if (currentSearchDate.getDay() === targetDayIndex) {
            const dateOnly = currentSearchDate.toISOString().split('T')[0];
            const timestamp = `${dateOnly}T${item.time}:00`;

            monthlyBookings.push({
              parent_id: user.id,
              tutor_id: tutorId,
              student_id: selectedStudentId, // FIXED: Uses the child you picked from the list
              scheduled_at: timestamp,
              status: 'pending'
            });
            datesFound++;
          }
          currentSearchDate.setDate(currentSearchDate.getDate() + 1);
        }
      }

      const { error } = await supabase.from('bookings').insert(monthlyBookings);
      if (error) throw error;

      alert("Monthly schedule confirmed!");
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-5xl font-black italic uppercase text-gray-100 mb-2">Create Schedule</h1>
      
      {/* NEW: STUDENT SELECTION SECTION */}
      <div className="mb-10 p-6 bg-blue-50 rounded-[40px] border-4 border-blue-100">
        <label className="block text-blue-600 font-black uppercase italic mb-3 ml-2">Who is this for?</label>
        <select 
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full p-5 rounded-3xl border-4 border-blue-600 font-black text-2xl outline-none bg-white text-black appearance-none cursor-pointer shadow-lg"
        >
          <option value="">Choose a student...</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.name.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <p className="text-blue-600 font-bold mb-10 text-xl italic">Select 3 Days & Your Preferred Times</p>

      <div className="flex gap-3 mb-10">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => toggleDay(day)}
            className={`w-16 h-16 rounded-2xl font-black transition-all border-4 ${
              schedule.find(s => s.day === day) 
              ? 'bg-black text-white border-black scale-110 shadow-lg' 
              : 'bg-white text-gray-200 border-gray-100 hover:border-gray-300'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-4 mb-12">
        {schedule.map((item, idx) => (
          <div key={item.day} className="flex items-center justify-between p-8 bg-gray-50 rounded-[40px] border-2 border-gray-100">
            <div>
              <span className="text-2xl font-black uppercase italic text-black">{item.day}s</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recurring every week</p>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="time" 
                value={item.time}
                onChange={(e) => {
                  const newSched = [...schedule];
                  newSched[idx].time = e.target.value;
                  setSchedule(newSched);
                }}
                className="bg-white border-4 border-black p-4 rounded-2xl font-black text-xl outline-none shadow-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleFinalConfirm}
        disabled={schedule.length !== 3 || !selectedStudentId || isSubmitting}
        className={`w-full py-8 rounded-[45px] font-black uppercase text-2xl transition-all shadow-2xl ${
          schedule.length === 3 && selectedStudentId ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]' : 'bg-gray-100 text-gray-300'
        }`}
      >
        {isSubmitting ? "CALCULATING..." : `CONFIRM ${schedule.length}/3 DAYS SELECTED`}
      </button>
      
      <button onClick={() => router.back()} className="w-full mt-4 text-gray-400 font-bold uppercase text-xs">
        ← Cancel and go back
      </button>
    </div>
  );
}