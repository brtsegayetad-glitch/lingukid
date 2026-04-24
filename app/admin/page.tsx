"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';
import WhiteGloveSetup from './WhiteGloveSetup'; 

export default function AdminTMS() {
  const [activeTab, setActiveTab] = useState('bookings'); 
  const [parents, setParents] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchMasterData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.email !== 'brtsegayetad@gmail.com') {
      return router.push('/dashboard');
    }

    const { data: pData } = await supabase.from('profiles').select('*');
    const { data: tData } = await supabase.from('tutors').select('*');
    const { data: sData } = await supabase.from('students').select('*, profiles(email)');
    
    // ጥያቄውን በ scheduled_at አደራጅተን እናመጣለን
    const { data: bData, error } = await supabase
      .from('bookings')
      .select(`
        id, 
        scheduled_at, 
        status, 
        zoom_link, 
        parent_id,
        tutors (full_name), 
        students (name),
        profiles:parent_id (full_name, email)
      `)
      .order('scheduled_at', { ascending: true }); 

    if (!error && bData) {
      // ለዛሬ ቅርብ የሆኑት ከላይ እንዲመጡ በዝርዝሩ መጀመሪያ ላይ እናስቀምጣለን
      setAllBookings(bData);
      setParents(pData || []);
      setTutors(tData || []);
      setStudents(sData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMasterData();
  }, [router, supabase]);

  const updateZoomLink = async (id: string, link: string) => {
    await supabase.from('bookings').update({ zoom_link: link }).eq('id', id);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    fetchMasterData(); 
  };

  const filteredBookings = allBookings.filter(b => 
    b.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.tutors?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.students?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center font-black uppercase italic bg-black text-white min-h-screen">Connecting Master System...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex justify-between items-center mb-10 border-b-4 border-white pb-6">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">TMS <span className="text-blue-500">Admin</span></h1>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="bg-red-600 px-8 py-3 rounded-2xl font-black uppercase text-xs hover:bg-white hover:text-red-600 transition-all">Logout</button>
        </header>

        <nav className="flex space-x-4 mb-10 overflow-x-auto pb-4">
          {['bookings', 'parents', 'tutors', 'students', 'white-glove'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-2xl font-black uppercase text-xs transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>

        <div className="animate-in fade-in duration-500">
          
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-[40px] p-10 text-black shadow-2xl">
              <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-2">
                <h2 className="text-2xl font-black uppercase italic">Schedule Manager</h2>
                <input 
                  type="text" 
                  placeholder="SEARCH..." 
                  className="bg-gray-100 p-3 rounded-xl border-2 border-gray-200 outline-none focus:border-blue-500"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-gray-400 border-b-2">
                      <th className="pb-4">Session Info</th>
                      <th className="pb-4">Users</th>
                      <th className="pb-4">Zoom Classroom</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-sm">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="border-b border-gray-50">
                        <td className="py-6">
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                            {new Date(b.scheduled_at).toLocaleDateString('en-US', { weekday: 'long' })}
                          </div>
                          <div className="text-lg font-black">{new Date(b.scheduled_at).toLocaleDateString()}</div>
                          <div className="text-blue-600 text-xs uppercase italic font-black">
                            {new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-6">
                          <div className="text-sm font-black uppercase tracking-tight">
                            {b.students?.name || "N/A"}
                          </div>
                          <div className="text-[11px] text-blue-500 font-bold italic lowercase opacity-80">
                            {b.profiles?.email}
                          </div>
                          <div className="text-[9px] text-gray-400 uppercase mt-1">
                            Tutor: {b.tutors?.full_name}
                          </div>
                        </td>
                        <td className="py-6">
                          <input 
                            type="text" 
                            placeholder="Paste Link..." 
                            defaultValue={b.zoom_link}
                            onBlur={(e) => updateZoomLink(b.id, e.target.value)}
                            className="bg-gray-100 p-4 rounded-2xl border-2 border-gray-200 w-60 text-xs outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-6 text-right">
                          {b.status === 'pending' ? (
                            <button onClick={() => updateStatus(b.id, 'confirmed')} className="bg-green-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">Confirm</button>
                          ) : (
                            <span className="px-4 py-1 rounded-full text-[9px] font-black uppercase border-2 bg-green-100 border-green-200 text-green-700">Confirmed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'parents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {parents.map(p => (
                <div key={p.id} className="bg-white/10 p-8 rounded-[40px] border border-white/20">
                  <h3 className="text-xl font-black uppercase italic text-blue-500">{p.full_name || "No Name Set"}</h3>
                  <p className="text-gray-400 font-bold mb-4">{p.email}</p>
                  <div className="text-[10px] font-black bg-white/5 inline-block px-4 py-1 rounded-full">PARENT ACCOUNT</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tutors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutors.map(t => (
                <div key={t.id} className="bg-white/10 p-8 rounded-[40px] border border-white/20">
                  <h3 className="text-xl font-black uppercase italic text-green-500">{t.full_name}</h3>
                  <p className="text-gray-400 font-bold mb-2">Capacity: {t.available_hours}h Remaining</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'students' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map(s => (
                <div key={s.id} className="bg-white/10 p-8 rounded-[40px] border border-white/20">
                  <h3 className="text-xl font-black uppercase italic text-yellow-500">{s.name}</h3>
                  <p className="text-blue-400 text-[10px] font-black uppercase mt-2">Parent: {s.profiles?.email}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'white-glove' && (
            <WhiteGloveSetup 
              parents={parents} 
              tutors={tutors} 
              onComplete={fetchMasterData} 
            />
          )}

        </div>
      </div>
    </div>
  );
}