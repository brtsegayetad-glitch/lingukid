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

  // Logic to clear selections (Cancel functionality)
  const clearSelection = () => {
    setSelectedTutorId(null);
    setSelectedPkgId(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center p-10 text-center font-black italic uppercase text-xl">Loading Gallery...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-40 bg-white border-b-4 border-black px-4 py-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-2">
          <button onClick={() => router.push('/dashboard')} className="text-blue-600 font-black text-[10px] uppercase italic">
            ← Back
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">
              {showPackages ? "Plans" : "Tutors"}
            </h1>
            <button 
              onClick={() => setShowPackages(!showPackages)}
              className="bg-yellow-400 border-2 border-black px-4 py-1 rounded-lg font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5"
            >
              {showPackages ? "Show Tutors" : "Show Plans"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded-lg text-red-700 font-bold text-[10px]">
            {errorMsg}
          </div>
        )}

        {showPackages ? (
          /* 2x2 GRID: PACKAGES */
          <div className="grid grid-cols-2 gap-3">
            {packages.map((pkg) => (
              <div 
                key={pkg.id} 
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`flex flex-col items-center justify-between p-3 rounded-2xl border-4 transition-all text-center ${
                  selectedPkgId === pkg.id 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <div className="mb-1">
                  <h3 className="text-[10px] font-black uppercase leading-none truncate w-full">{pkg.name}</h3>
                  <p className="text-[7px] font-bold text-gray-500 uppercase mt-1">Max {pkg.max_students}</p>
                </div>
                <div className="my-2">
                  <span className="text-3xl font-black leading-none block">{pkg.monthly_hours}h</span>
                  <span className="text-[7px] font-black uppercase text-gray-400">Monthly</span>
                </div>
                <div className="w-full pt-2 border-t-2 border-gray-100">
                  <p className="text-[9px] font-black mb-1">{pkg.price_per_hour} ETB</p>
                  <div className={`text-[8px] font-black py-1.5 rounded-md uppercase border-2 border-black ${
                    selectedPkgId === pkg.id ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
                  }`}>
                    {selectedPkgId === pkg.id ? 'SELECTED ✓' : 'SELECT'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* COMPACT LIST: TUTORS */
          <div className="space-y-3">
            {tutors.map((tutor) => (
              <div 
                key={tutor.id} 
                onClick={() => setSelectedTutorId(tutor.id)}
                className={`flex items-center p-3 rounded-2xl border-4 transition-all ${
                  selectedTutorId === tutor.id ? 'border-blue-600 bg-blue-50' : 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-xl mr-3 border-2 border-black">🎓</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-black uppercase truncate">{tutor.full_name}</h2>
                  <p className="text-[9px] font-bold text-blue-600 uppercase truncate">{tutor.specialization}</p>
                </div>
                <div className="text-right pl-2">
                  <p className="text-xs font-black mb-1">{tutor.hourly_rate} <span className="text-[8px]">ETB</span></p>
                  <div className={`px-3 py-1 rounded-md text-[8px] font-black uppercase border-2 border-black ${
                    selectedTutorId === tutor.id ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
                  }`}>
                    {selectedTutorId === tutor.id ? 'SELECTED' : 'SELECT'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STICKY BOTTOM ACTIONS */}
        {(selectedTutorId || selectedPkgId) && (
          <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2">
            {/* CANCEL / CLEAR BUTTON */}
            <button 
              onClick={clearSelection}
              className="w-full py-2 bg-white text-black border-2 border-black rounded-xl font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all"
            >
              ✕ Clear Selection
            </button>

            {/* MAIN ACTION BUTTON */}
            <button 
              onClick={handleFinalize}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
            >
              {selectedTutorId && selectedPkgId ? "Finish Registration →" : "Continue to Form →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}