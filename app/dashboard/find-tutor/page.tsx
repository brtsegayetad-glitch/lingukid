"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';

export default function FindTutorPage() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPackages, setShowPackages] = useState(false);
  
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        const { data: tutorData } = await supabase.from('tutors').select('*');
        if (tutorData) setTutors(tutorData);

        const { data: pkgData, error: pkgError } = await supabase
          .from('packages')
          .select('id, name, price_per_hour, monthly_hours, max_students')
          .eq('is_active', true);

        if (pkgError) throw pkgError;
        if (pkgData) setPackages(pkgData);

      } catch (err: any) {
        console.error("Database Connection Error:", err.message);
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  const handleFinalize = () => {
    router.push(`/dashboard/add-child?tutorId=${selectedTutorId}&packageId=${selectedPkgId}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center p-10 text-center font-black italic uppercase text-xl">Loading Gallery...</div>;

  return (
    <div className="min-h-screen bg-white pb-32"> {/* Added bottom padding for the sticky button */}
      <div className="max-w-6xl mx-auto p-4 md:p-10">
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-xl text-red-700 font-bold text-xs md:text-sm">
            Connection Issue: {errorMsg}
          </div>
        )}

        {/* Mobile-First Header: Stacks on small screens */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div className="flex-1">
            <button onClick={() => router.push('/dashboard')} className="text-blue-600 font-black mb-3 flex items-center gap-2 italic underline text-[10px]">← BACK TO DASHBOARD</button>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter italic uppercase leading-[0.9]">
              {showPackages ? "Our Pricing Plans" : "Expert Tutors"}
            </h1>
          </div>

          <div className="w-full md:w-auto">
             <button 
              onClick={() => setShowPackages(!showPackages)}
              className="w-full md:w-auto px-8 py-4 rounded-2xl font-black uppercase text-[10px] border-4 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
            >
              {showPackages ? "View Tutors" : "View Packages"}
            </button>
          </div>
        </header>

        {showPackages ? (
          /* PACKAGE GALLERY - Responsive Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`transition-all bg-white border-[6px] p-6 md:p-8 rounded-[35px] md:rounded-[45px] flex flex-col items-center ${selectedPkgId === pkg.id ? 'border-blue-600 shadow-[8px_8px_0px_0px_rgba(37,99,235,0.2)]' : 'border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]'}`}>
                <h3 className="text-lg font-black uppercase italic text-blue-600 mb-1 text-center leading-tight">{pkg.name}</h3>
                <p className="text-[9px] font-black text-gray-400 mb-4 uppercase tracking-widest">{pkg.max_students} Student Limit</p>
                
                <div className="text-5xl md:text-6xl font-black mb-1 leading-none">{pkg.monthly_hours}<span className="text-sm">hrs</span></div>
                <p className="text-[10px] md:text-xs font-black text-gray-900 mb-6 md:mb-8 italic">{pkg.price_per_hour} ETB / hr</p>
                
                <button 
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`w-full py-4 rounded-xl font-black uppercase text-[10px] transition-all ${selectedPkgId === pkg.id ? 'bg-blue-600 text-white' : 'bg-black text-white'}`}
                >
                  {selectedPkgId === pkg.id ? "SELECTED ✓" : "Choose this Plan"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* TUTOR GALLERY - Responsive Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {tutors.map((tutor) => (
              <div key={tutor.id} className={`bg-white border-4 rounded-[30px] md:rounded-[40px] p-6 md:p-8 shadow-sm flex flex-col justify-between group transition-all ${selectedTutorId === tutor.id ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100'}`}>
                <div>
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 transition-colors ${selectedTutorId === tutor.id ? 'bg-blue-600 text-white' : 'bg-blue-50'}`}>🎓</div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-1">{tutor.full_name}</h2>
                  <p className="text-blue-600 font-black text-[9px] mb-3 px-2 py-1 bg-blue-50 w-fit rounded-lg uppercase italic tracking-tighter">{tutor.specialization}</p>
                  <p className="text-gray-500 text-xs md:text-sm font-bold leading-relaxed mb-6 italic line-clamp-3">"{tutor.bio}"</p>
                </div>
                
                <div className="border-t-2 border-gray-50 pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">Rate</p>
                    <p className="text-lg md:text-xl font-black text-gray-900">{tutor.hourly_rate} <span className="text-[10px]">ETB</span></p>
                  </div>
                  <button 
                    onClick={() => setSelectedTutorId(tutor.id)}
                    className={`px-6 py-3 rounded-xl font-black shadow-md transition-all uppercase text-[10px] ${selectedTutorId === tutor.id ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-black text-white'}`}
                  >
                    {selectedTutorId === tutor.id ? "SELECTED ✓" : "Select"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STICKY ACTION BUTTON: Professional App-like feel for Mobile */}
        {(selectedTutorId || selectedPkgId) && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t-4 border-black z-50 animate-in fade-in slide-in-from-bottom-5">
            <button 
              onClick={handleFinalize}
              className="w-full max-w-lg mx-auto block px-8 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none transition-all text-center"
            >
              {selectedTutorId && selectedPkgId ? "Continue Registration →" : "Continue to Form →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}