"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';

export default function FindTutorPage() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [remainingHours, setRemainingHours] = useState<number>(0);
  const [showPackages, setShowPackages] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        // 1. Fetch Credits
        const { data: subData } = await supabase
          .from('parent_subscriptions')
          .select('remaining_hours')
          .eq('parent_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (subData) setRemainingHours(subData.remaining_hours);

        // 2. Fetch Tutors
        const { data: tutorData } = await supabase.from('tutors').select('*');
        if (tutorData) setTutors(tutorData);

        // 3. Fetch Packages using your specific columns
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

  const handleBuyPackage = async (pkg: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use monthly_hours from your table
    const { error } = await supabase
      .from('parent_subscriptions')
      .upsert({
        parent_id: user.id,
        package_id: pkg.id,
        remaining_hours: remainingHours + pkg.monthly_hours,
        status: 'active'
      }, { onConflict: 'parent_id' });

    if (!error) {
      alert(`Success! ${pkg.name} selected.`);
      setRemainingHours(prev => prev + pkg.monthly_hours);
      setShowPackages(false); 
    } else {
      alert("Error: " + error.message);
    }
  };

  if (loading) return <div className="p-10 text-center font-black italic uppercase">Synchronizing with Database...</div>;

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Error Debugger - Shows only if connection fails */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-xl text-red-700 font-bold text-sm">
            Connection Issue: {errorMsg}
          </div>
        )}

        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <button onClick={() => router.push('/dashboard')} className="text-blue-600 font-black mb-4 flex items-center gap-2 italic underline text-[10px]">← BACK TO DASHBOARD</button>
            <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tighter italic uppercase leading-tight">
              {showPackages ? "Select your Plan" : "Find your Perfect Tutor"}
            </h1>
          </div>

          <div className={`p-6 rounded-[35px] border-4 transition-all ${remainingHours > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Available Credit</p>
            <p className={`text-3xl font-black ${remainingHours > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {remainingHours} Hours Left
            </p>
            <button 
              onClick={() => setShowPackages(!showPackages)}
              className="mt-2 text-[10px] font-black text-red-600 underline uppercase block tracking-tighter"
            >
              {showPackages ? "View Available Tutors" : "Buy a package to enable booking"}
            </button>
          </div>
        </header>

        {showPackages ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white border-[6px] border-black p-8 rounded-[45px] shadow-[10px_10px_0px_0px_rgba(37,99,235,1)] flex flex-col items-center">
                <h3 className="text-lg font-black uppercase italic text-blue-600 mb-1 text-center leading-tight">{pkg.name}</h3>
                <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest">{pkg.max_students} Student{pkg.max_students > 1 ? 's' : ''}</p>
                
                <div className="text-6xl font-black mb-1 leading-none">{pkg.monthly_hours}<span className="text-sm">hrs</span></div>
                <p className="text-xs font-black text-gray-900 mb-8 italic">{pkg.price_per_hour} ETB / hr</p>
                
                <button 
                  onClick={() => handleBuyPackage(pkg)}
                  className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] hover:bg-blue-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                >
                  Confirm Plan
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tutors.map((tutor) => (
              <div key={tutor.id} className="bg-white border-2 border-gray-100 rounded-[40px] p-8 shadow-sm flex flex-col justify-between group">
                <div>
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">🎓</div>
                  <h2 className="text-2xl font-black text-gray-900 mb-1">{tutor.full_name}</h2>
                  <p className="text-blue-600 font-black text-xs mb-4 px-3 py-1 bg-blue-50 w-fit rounded-lg uppercase italic tracking-tighter">{tutor.specialization}</p>
                  <p className="text-gray-500 text-sm font-bold leading-relaxed mb-6 italic line-clamp-3">"{tutor.bio}"</p>
                </div>
                
                <div className="border-t-2 border-gray-50 pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Tutor Rate</p>
                    <p className="text-xl font-black text-gray-900">{tutor.hourly_rate} <span className="text-[10px]">ETB/hr</span></p>
                  </div>
                  <button 
                    disabled={remainingHours < 12}
                    onClick={() => router.push(`/dashboard/book/${tutor.id}`)}
                    className={`px-8 py-3 rounded-2xl font-black transition-all ${
                      remainingHours >= 12 ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {remainingHours >= 12 ? 'BOOK NOW' : 'NO CREDITS'}
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