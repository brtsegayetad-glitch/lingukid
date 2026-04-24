"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import { useRouter } from 'next/navigation';

export default function TutorDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // --- State to hold the Admin's set limit from Database ---
  const [adminLimit, setAdminLimit] = useState(60); 
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchTutorData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // --- Fetches the latest available_hours set by Admin ---
      const { data: tutorProfile } = await supabase
        .from('tutors')
        .select('id, available_hours')
        .eq('user_id', user.id)
        .single();

      if (tutorProfile) {
        // Syncs the local state with the database column
        setAdminLimit(tutorProfile.available_hours || 60);

        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select(`
            id,
            status,
            scheduled_at,
            zoom_link,
            students (name, grade_level)
          `)
          .eq('tutor_id', tutorProfile.id)
          .order('scheduled_at', { ascending: true });

        if (!error) {
          setBookings(bookingsData || []);
        }
      }
      setLoading(false);
    };

    fetchTutorData();
  }, [router, supabase]);

  const updateStatus = async (bookingId: string, newStatus: string) => {
    try {
      // 1. Update the booking status
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        alert("Error: " + error.message);
        return;
      }

      // 2. Direct Sync: If confirmed, subtract 1 from the actual database column
      if (newStatus === 'confirmed') {
        const { data: { user } } = await supabase.auth.getUser();
        
        const newHourValue = adminLimit - 1;

        await supabase
          .from('tutors')
          .update({ available_hours: newHourValue })
          .eq('user_id', user?.id);

        // Update local state so UI changes immediately to match DB
        setAdminLimit(newHourValue);
      }

      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      
    } catch (err: any) {
      console.error("Update Error:", err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-900 font-black">Connecting to Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Tutor Portal</h1>
            {/* UPDATED HEADER: 
                We now use adminLimit directly to show exactly what is in Supabase.
            */}
            <p className="text-blue-600 font-black text-sm">
              Capacity: {adminLimit} Hours Remaining
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => router.push('/tutor-dashboard/profile')} className="text-sm font-black text-blue-600 hover:underline">Edit Profile</button>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-sm font-bold text-red-600 hover:underline">Logout</button>
          </div>
        </header>

        <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100">
          <h2 className="text-xl font-black mb-6 text-gray-900 text-center md:text-left">Incoming Student Requests</h2>
          
          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 border-2 border-gray-50 rounded-2xl">
                  <div>
                    <p className="text-xs font-black text-blue-600 uppercase mb-1">
                      {new Date(booking.scheduled_at).toLocaleDateString()} @ {new Date(booking.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <h3 className="text-xl font-black text-gray-900">{booking.students?.name || "New Student"}</h3>
                    <p className="text-gray-500 font-bold text-sm">Grade {booking.students?.grade_level || "N/A"}</p>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase ${
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {booking.status}
                    </span>

                    {booking.status === 'pending' ? (
                      <button 
                        onClick={() => updateStatus(booking.id, 'confirmed')} 
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-sm hover:bg-blue-700 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        Accept Lesson
                      </button>
                    ) : (
                      booking.zoom_link ? (
                        <a 
                          href={booking.zoom_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-green-600 text-white px-6 py-2 rounded-xl font-black text-sm hover:bg-green-700 shadow-md transition-all flex items-center"
                        >
                          <span className="mr-2">🎥</span> Join Classroom
                        </a>
                      ) : (
                        <span className="text-gray-400 font-bold text-xs italic text-center">Waiting for Admin to add Zoom link</span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold text-lg italic">No pending student requests yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}