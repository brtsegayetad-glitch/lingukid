"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';

export default function ParentDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [remainingHours, setRemainingHours] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchParentData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      if (user.email === 'brtsegayetad@gmail.com') {
        return router.push('/admin');
      }

      const { data: subData } = await supabase.from('parent_subscriptions')
        .select('remaining_hours')
        .eq('parent_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      const { data: sData } = await supabase.from('students')
        .select('*')
        .eq('parent_id', user.id);

      const { data: bData } = await supabase.from('bookings')
        .select('*, tutors(full_name), students(name)')
        .eq('parent_id', user.id)
        .order('scheduled_at', { ascending: true });

      setRemainingHours(subData?.remaining_hours || 0);
      setStudents(sData || []);
      setBookings(bData || []);
      setLoading(false);
    };
    fetchParentData();
  }, [router, supabase]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-2xl px-4 text-center">Loading LinguKid...</div>;

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header - MOBILE FIRST FIX */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b-8 border-black pb-6 gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Parent</h1>
            <h2 className="text-2xl font-bold uppercase text-blue-600 tracking-widest">Dashboard</h2>
          </div>
          
          {/* Buttons wrap automatically and stay accessible on mobile */}
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button 
              onClick={() => router.push('/dashboard/find-tutor')} 
              className="flex-1 sm:flex-none bg-black text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-blue-600 transition-all active:scale-95"
            >
              Find Tutor
            </button>
            <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))} 
              className="flex-1 sm:flex-none bg-red-600 text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: BALANCE & STUDENTS */}
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-green-500 p-6 md:p-8 rounded-[30px] md:rounded-[40px] text-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Lesson Credits</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl md:text-7xl font-black leading-none">{remainingHours}</span>
                <span className="text-lg md:text-xl font-bold uppercase italic">Hours</span>
              </div>
            </div>

            {/* Students Card */}
            <div className="bg-blue-50 p-6 md:p-8 rounded-[30px] md:rounded-[40px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-xl md:text-2xl font-black uppercase italic mb-6 border-b-2 border-blue-200 pb-2">My Children</h3>
              <div className="space-y-4">
                {students.length > 0 ? (
                  students.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-xl border-4 border-black flex justify-between items-center">
                      <div>
                        <p className="font-black uppercase text-base md:text-lg leading-tight">{s.name}</p>
                        <p className="text-[10px] font-bold text-blue-600 uppercase">Grade {s.grade_level}</p>
                      </div>
                      <span className="bg-yellow-400 px-2 py-1 rounded-lg border-2 border-black text-[9px] font-black uppercase">Active</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-bold text-gray-400 italic">No students registered yet.</p>
                )}
              </div>
              <button 
                onClick={() => router.push('/dashboard/add-child')} 
                className="w-full mt-6 py-4 bg-yellow-400 border-4 border-black rounded-2xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all"
              >
                + Add Student
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: SCHEDULE */}
          <div className="lg:col-span-2 bg-white border-4 border-black p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl md:text-3xl font-black uppercase italic mb-8 underline decoration-blue-500 decoration-[6px] md:decoration-8 underline-offset-4">Upcoming Lessons</h2>
            
            <div className="space-y-4">
              {bookings.length > 0 ? (
                bookings.map(b => (
                  <div key={b.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border-4 border-gray-100 rounded-[25px] hover:border-blue-500 transition-colors gap-4">
                     <div className="w-full">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                          {new Date(b.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} @ {new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-lg font-black text-gray-900 uppercase leading-none mb-1">{b.students?.name}</p>
                        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-tighter">With {b.tutors?.full_name}</p>
                     </div>
                     <div className="flex flex-row md:flex-col items-center md:items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                        <span className={`px-3 py-1 rounded-full border-2 border-black text-[9px] font-black uppercase ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {b.status}
                        </span>
                        {b.zoom_link ? (
                          <a href={b.zoom_link} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none text-center bg-blue-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">Join Link</a>
                        ) : (
                          <span className="text-[9px] font-black text-gray-300 uppercase italic">Link Pending</span>
                        )}
                     </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 md:py-20 bg-gray-50 rounded-[25px] border-4 border-dashed border-gray-200">
                  <p className="font-black text-gray-400 uppercase italic text-sm">No sessions scheduled.</p>
                  <button onClick={() => router.push('/dashboard/find-tutor')} className="mt-4 text-blue-600 font-black underline uppercase text-[10px]">Book now</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}