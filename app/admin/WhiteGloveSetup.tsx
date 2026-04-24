"use client";

import React, { useState } from 'react';
import { createClient } from '@/supabase';

interface WhiteGloveProps {
  parents: any[];
  tutors: any[];
  onComplete: () => void;
}

export default function WhiteGloveSetup({ parents, tutors, onComplete }: WhiteGloveProps) {
  const [loading, setLoading] = useState(false);
  const [setup, setSetup] = useState({
    parentId: '',
    tutorId: '',
    studentName: '', 
    days: [
      { date: '' }, 
      { date: '' }, 
      { date: '' }  
    ]
  });

  const supabase = createClient();

  const handleDayChange = (index: number, value: string) => {
    const newDays = [...setup.days];
    newDays[index].date = value;
    setSetup({ ...setup, days: newDays });
  };

  const handleMonthlyLaunch = async () => {
    const hasAllDates = setup.days.every(d => d.date !== '');
    if (!setup.parentId || !setup.tutorId || !hasAllDates) {
      return alert("እባክዎ ወላጅ፣ ቱተር እና ሶስቱንም ቀናት ይምረጡ!");
    }

    setLoading(true);

    try {
      let studentId;

      // FIX 1: If a student name is typed, ALWAYS create a new student first
      if (setup.studentName.trim() !== '') {
        const { data: newStudent, error: sError } = await supabase
          .from('students')
          .insert([{ name: setup.studentName, parent_id: setup.parentId }])
          .select()
          .single();
        
        if (sError) throw sError;
        studentId = newStudent.id;
      } else {
        // Fallback: Check if the parent already has a student registered
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('parent_id', setup.parentId)
          .limit(1)
          .single();

        if (!existingStudent) {
          setLoading(false);
          return alert("ለዚህ ወላጅ ተማሪ አልተገኘም፣ እባክዎ የተማሪ ስም ያስገቡ!");
        }
        studentId = existingStudent.id;
      }

      // FIX 2: Mapping values to your specific Supabase columns (date_time, day_of_week, etc.)
      let payload = [];
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      for (let week = 0; week < 4; week++) {
        for (let dayIndex = 0; dayIndex < 3; dayIndex++) {
          const originalDate = new Date(setup.days[dayIndex].date);
          const sessionDate = new Date(originalDate);
          sessionDate.setDate(originalDate.getDate() + (week * 7));

          payload.push({
            parent_id: setup.parentId,
            tutor_id: setup.tutorId,
            student_id: studentId,
            scheduled_at: sessionDate.toISOString(),
            status: 'pending',
            // Adding values for your specific Supabase columns:
            date_time: sessionDate.toISOString(), // Fixes the NULL date_time
            day_of_week: dayNames[sessionDate.getDay()], // Fixes the NULL day_of_week
            start_time: sessionDate.toLocaleTimeString('en-US', { hour12: false }) // Fixes start_time
          });
        }
      }

      const { error: bError } = await supabase.from('bookings').insert(payload);
      if (bError) throw bError;

      alert("ተሳክቷል! አዲስ ተማሪ ተፈጥሮ 12 ክፍለ-ጊዜዎች ተመዝግበዋል።");
      onComplete();

    } catch (err: any) {
      alert("ስህተት ተከስቷል: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-700 rounded-[40px] p-10 shadow-2xl text-white">
      <h2 className="text-3xl font-black uppercase italic mb-8 border-b-2 border-white/20 pb-4">
        Master White Glove Setup
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-black uppercase opacity-60">1. Select Parent Account</label>
            <select 
              className="bg-black/20 p-5 rounded-2xl border-2 border-white/10 font-bold text-white"
              onChange={e => setSetup({...setup, parentId: e.target.value})}
            >
              <option value="" className="text-black">ወላጅ ይምረጡ...</option>
              {parents.map(p => <option key={p.id} value={p.id} className="text-black">{p.email}</option>)}
            </select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-black uppercase opacity-60">2. New Student Name (Required for new creation)</label>
            <input 
              type="text"
              placeholder="አዲስ ተማሪ ለመፍጠር እዚህ ይጻፉ..."
              className="bg-black/20 p-5 rounded-2xl border-2 border-white/10 font-bold"
              onChange={e => setSetup({...setup, studentName: e.target.value})}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-black uppercase opacity-60">3. Assign Specialist</label>
            <select 
              className="bg-black/20 p-5 rounded-2xl border-2 border-white/10 font-bold text-white"
              onChange={e => setSetup({...setup, tutorId: e.target.value})}
            >
              <option value="" className="text-black">ቱተር ይምረጡ...</option>
              {tutors.map(t => <option key={t.id} value={t.id} className="text-black">{t.full_name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-6 bg-white/5 p-6 rounded-[30px] border border-white/10">
          <h3 className="text-xs font-black uppercase italic opacity-60 mb-4">Set Weekly 3-Day Schedule</h3>
          {setup.days.map((day, index) => (
            <div key={index} className="flex flex-col space-y-2">
              <label className="text-[9px] font-black uppercase">Day {index + 1}</label>
              <input 
                type="datetime-local"
                className="bg-black/40 p-4 rounded-xl border border-white/10 font-bold text-sm text-white"
                onChange={e => handleDayChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleMonthlyLaunch} 
        disabled={loading}
        className="w-full mt-10 py-6 rounded-3xl font-black text-2xl uppercase italic bg-white text-blue-700 hover:bg-black hover:text-white transition-all"
      >
        {loading ? 'Processing...' : '🚀 Launch 12 Sessions'}
      </button>
    </div>
  );
}