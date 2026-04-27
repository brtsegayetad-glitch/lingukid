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
  
  // NEW: State to remember choices (Shopping Cart Logic)
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        // 1. Fetch Tutors
        const { data: tutorData } = await supabase.from('tutors').select('*');
        if (tutorData) setTutors(tutorData);

        // 2. Fetch Packages
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

  // Logic: Final redirect only when they click the main action button
  const handleFinalize = () => {
    router.push(`/dashboard/add-child?tutorId=${selectedTutorId}&packageId=${selectedPkgId}`);
  };

  if (loading) return <div className="p-10 text-center font-black italic uppercase">Loading Gallery...</div>;

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-xl text-red-700 font-bold text-sm">
            Connection Issue: {errorMsg}
          </div>
        )}

        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <button onClick={() => router.push('/dashboard')} className="text-blue-600 font-black mb-4 flex items-center gap-2 italic underline text-[10px]">← BACK TO DASHBOARD</button>
            <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tighter italic uppercase leading-tight">
              {showPackages ? "Our Pricing Plans" : "Expert Tutors"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <button 
              onClick={() => setShowPackages(!showPackages)}
              className="px-8 py-4 rounded-2xl font-black uppercase text-xs border-4 border-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              {showPackages ? "View Tutors" : "View Packages"}
            </button>

            {/* ACTION BUTTON: Appears when they have made selections */}
            {(selectedTutorId || selectedPkgId) && (
              <button 
                onClick={handleFinalize}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
              >
                {selectedTutorId && selectedPkgId ? "Continue Registration →" : "Continue to Form →"}
              </button>
            )}
          </div>
        </header>

        {showPackages ? (
          /* PACKAGE GALLERY */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`transition-all bg-white border-[6px] p-8 rounded-[45px] flex flex-col items-center ${selectedPkgId === pkg.id ? 'border-blue-600 shadow-[10px_10px_0px_0px_rgba(37,99,235,0.2)]' : 'border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)]'}`}>
                <h3 className="text-lg font-black uppercase italic text-blue-600 mb-1 text-center leading-tight">{pkg.name}</h3>
                <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest">{pkg.max_students} Student Limit</p>
                
                <div className="text-6xl font-black mb-1 leading-none">{pkg.monthly_hours}<span className="text-sm">hrs</span></div>
                <p className="text-xs font-black text-gray-900 mb-8 italic">{pkg.price_per_hour} ETB / hr</p>
                
                <button 
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] transition-all ${selectedPkgId === pkg.id ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-blue-600'}`}
                >
                  {selectedPkgId === pkg.id ? "SELECTED ✓" : "Choose this Plan"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* TUTOR GALLERY */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tutors.map((tutor) => (
              <div key={tutor.id} className={`bg-white border-2 rounded-[40px] p-8 shadow-sm flex flex-col justify-between group transition-all ${selectedTutorId === tutor.id ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 hover:border-blue-500'}`}>
                <div>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 transition-colors ${selectedTutorId === tutor.id ? 'bg-blue-600 text-white' : 'bg-blue-50 group-hover:bg-blue-600 group-hover:text-white'}`}>🎓</div>
                  <h2 className="text-2xl font-black text-gray-900 mb-1">{tutor.full_name}</h2>
                  <p className="text-blue-600 font-black text-xs mb-4 px-3 py-1 bg-blue-50 w-fit rounded-lg uppercase italic tracking-tighter">{tutor.specialization}</p>
                  <p className="text-gray-500 text-sm font-bold leading-relaxed mb-6 italic line-clamp-4">"{tutor.bio}"</p>
                </div>
                
                <div className="border-t-2 border-gray-50 pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Hourly Rate</p>
                    <p className="text-xl font-black text-gray-900">{tutor.hourly_rate} <span className="text-[10px]">ETB</span></p>
                  </div>
                  <button 
                    onClick={() => setSelectedTutorId(tutor.id)}
                    className={`px-8 py-3 rounded-2xl font-black shadow-lg transition-all uppercase text-[10px] ${selectedTutorId === tutor.id ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-blue-600'}`}
                  >
                    {selectedTutorId === tutor.id ? "SELECTED ✓" : "Select Tutor"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}