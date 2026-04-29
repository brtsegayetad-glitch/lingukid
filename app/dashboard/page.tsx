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
    <div className="min-h-screen bg-white pb-10">
      
      {/* STICKY HEADER - The "Brain" */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-4 border-black px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Parent</h1>
            <h2 className="text-sm font-bold uppercase text-blue-600 tracking-[0.2em]">Dashboard</h2>
          </div>
          <button 
            onClick={() => router.push('/dashboard/find-tutor')} 
            className="bg-black text-white px-4 py-2 rounded-xl font-black uppercase text-[9px] shadow-[3px_3px_0px_0px_rgba(37,99,235,1)] active:translate-y-1 active:shadow-none transition-all"
          >
            Tutors & Plans
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        
        {/* 1. STUDENT REGISTRATION (Priority #1) */}
        <section className="mb-6">
          <div className="bg-blue-50 p-5 rounded-[30px] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black uppercase italic tracking-tight">My Children</h3>
              <button 
                onClick={() => router.push('/dashboard/add-child')} 
                className="bg-yellow-400 px-3 py-1.5 border-2 border-black rounded-lg font-black text-[9px] uppercase active:translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                + Register Student
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              {students.length > 0 ? (
                students.map(s => (
                  <div key={s.id} className="bg-white p-3 rounded-xl border-2 border-black flex justify-between items-center">
                    <div>
                      <p className="font-black uppercase text-sm leading-tight">{s.name}</p>
                      <p className="text-[8px] font-bold text-blue-600 uppercase tracking-tighter">Grade {s.grade_level}</p>
                    </div>
                    <span className="text-[8px] font-black uppercase text-green-600">Active ✓</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] font-bold text-gray-400 italic text-center py-2">No students registered yet.</p>
              )}
            </div>
          </div>
        </section>

        {/* 2. MINIMIZED BALANCE - Horizontal Layout */}
        <section className="mb-8">
          <div className="bg-green-500 p-4 rounded-2xl text-white border-4 border-black flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg text-xl">⏳</div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-90">Remaining Credits</p>
                <p className="text-xl font-black italic uppercase leading-none">Lesson Hours</p>
              </div>
            </div>
            <div className="bg-white text-green-600 px-5 py-2 rounded-xl border-2 border-black">
              <span className="text-3xl font-black">{remainingHours}</span>
            </div>
          </div>
        </section>

        {/* 3. SCHEDULE SECTION */}
        <section className="bg-white border-4 border-black p-5 rounded-[30px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
          <h2 className="text-xl font-black uppercase italic mb-6 underline decoration-blue-500 decoration-4 underline-offset-4">Upcoming Lessons</h2>
          
          <div className="space-y-3">
            {bookings.length > 0 ? (
              bookings.map(b => (
                <div key={b.id} className="flex flex-col p-4 border-2 border-gray-100 rounded-2xl hover:border-blue-500 transition-colors gap-2 bg-gray-50/30">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase">
                          {new Date(b.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} @ {new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-md font-black text-gray-900 uppercase leading-tight">{b.students?.name}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full border border-black text-[7px] font-black uppercase ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {b.status}
                      </span>
                   </div>
                   
                   <div className="flex items-center justify-between mt-1">
                      <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">Tutor: {b.tutors?.full_name}</p>
                      {b.zoom_link ? (
                        <a href={b.zoom_link} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-black text-[8px] uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Join Class</a>
                      ) : (
                        <span className="text-[8px] font-black text-gray-300 uppercase italic">Link Pending</span>
                      )}
                   </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-[20px] border-2 border-dashed border-gray-200">
                <p className="font-black text-gray-400 uppercase italic text-[10px]">No sessions scheduled.</p>
                <button onClick={() => router.push('/dashboard/find-tutor')} className="mt-2 text-blue-600 font-black underline uppercase text-[9px]">Book now</button>
              </div>
            )}
          </div>
        </section>

        {/* FOOTER SECTION - The "Tail" */}
        <footer className="mt-20 mb-8 text-center border-t-2 border-gray-100 pt-10">
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))} 
            className="w-full max-w-xs mx-auto bg-white text-gray-400 py-3 rounded-xl font-black uppercase text-[10px] border-2 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-all active:scale-95 mb-8"
          >
            Logout from Dashboard
          </button>
          
          <div className="flex flex-col items-center gap-2">
            <div className="h-1 w-8 bg-gray-100 rounded-full mb-1"></div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
              lingukid@2026
            </p>
            <p className="text-[7px] font-bold text-gray-200 uppercase tracking-widest">
              Bahir Dar • Ethiopia
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}