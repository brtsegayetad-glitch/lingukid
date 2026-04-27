"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/supabase';
import Link from 'next/link';

const supabase = createClient();

export default function AdminInsights() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [allPkgs, setAllPkgs] = useState<any[]>([]);
  const [allTutors, setAllTutors] = useState<any[]>([]); // Added to store tutor list
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: students } = await supabase.from('students').select('*');
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: pkgs } = await supabase.from('packages').select('*');
      const { data: bookings } = await supabase.from('bookings').select('*');
      const { data: tutors } = await supabase.from('tutors').select('*');

      setAllPkgs(pkgs || []);
      setAllTutors(tutors || []); // Store tutors globally for the update menu

      const combined = students?.map(student => {
        const parent = profiles?.find(p => p.id === student.parent_id);
        const pkg = pkgs?.find(p => p.id === student.package_id);
        
        // ✅ FIX: Find tutor directly from the student record's tutor_id
        const tutor = tutors?.find(t => t.id === student.tutor_id);

        return {
          ...student,
          parentName: parent?.full_name || "Awaiting Profile",
          parentEmail: parent?.email || "No Email",
          packageName: pkg?.name || "No Plan",
          packageId: pkg?.id || null,
          tutorName: tutor?.full_name || "Unassigned", // Displayed in table
          tutorId: student.tutor_id || null,
          preferredDays: student.preferred_days || "Not Set",
          preferredTime: student.preferred_time || "Not Set"
        };
      }) || [];

      const studentCountsByPackage = pkgs?.map(p => {
        const count = students?.filter(s => s.package_id === p.id).length || 0;
        return { name: p.name, total: count };
      }) || [];

      setData(combined);
      setStats(studentCountsByPackage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateMonthlyBookings = async (student: any) => {
    if (student.preferredDays === "Not Set") return alert("No schedule set!");

    await supabase.from('bookings').delete().eq('student_id', student.id).eq('status', 'pending');

    const selectedDays = student.preferredDays.split(',').map((d: string) => d.trim().toUpperCase().substring(0, 3));
    const newBookings = [];
    const today = new Date();
    
    for (let i = 0; i < 28; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

      if (selectedDays.includes(dayName)) {
        newBookings.push({
          student_id: student.id,
          parent_id: student.parent_id,
          tutor_id: student.tutorId, // ✅ FIX: Now links the tutor to the booking!
          scheduled_at: date.toISOString(),
          day_of_week: dayName,
          status: 'pending'
        });
      }
    }

    const { error } = await supabase.from('bookings').insert(newBookings);
    if (error) alert(error.message);
    else alert(`Generated ${newBookings.length} sessions linked to ${student.tutorName}!`);
    fetchData();
  };

  const handleUpdateStudent = async (student: any) => {
    const action = prompt("Update: (name / package / schedule / tutor)");

    if (action === 'name') {
      const newName = prompt("New Name:", student.name);
      if (newName) await supabase.from('students').update({ name: newName }).eq('id', student.id);
    } 
    else if (action === 'package') {
      const pkgList = allPkgs.map((p, i) => `${i}: ${p.name}`).join('\n');
      const choice = prompt(`Choose Package Number:\n${pkgList}`);
      if (choice !== null) {
        const selectedPkg = allPkgs[parseInt(choice)];
        await supabase.from('students').update({ package_id: selectedPkg.id }).eq('id', student.id);
      }
    }
    else if (action === 'tutor') {
      const tutorList = allTutors.map((t, i) => `${i}: ${t.full_name}`).join('\n');
      const choice = prompt(`Choose Tutor Number:\n${tutorList}`);
      if (choice !== null) {
        const selectedTutor = allTutors[parseInt(choice)];
        await supabase.from('students').update({ tutor_id: selectedTutor.id }).eq('id', student.id);
      }
    }
    else if (action === 'schedule') {
      const newDays = prompt("Enter Days:", student.preferredDays);
      const newTime = prompt("Enter Time:", student.preferredTime);
      if (newDays !== null && newTime !== null) {
        await supabase.from('students').update({ preferred_days: newDays, preferred_time: newTime }).eq('id', student.id);
      }
    }
    fetchData();
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="p-20 text-center font-black text-blue-600 animate-pulse uppercase">Syncing...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black font-sans">
      {/* ... Stats Section ... */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {stats.map(s => (
          <div key={s.name} className="bg-yellow-100 border-4 border-black p-6 rounded-[30px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-[10px] font-black uppercase text-gray-500 leading-tight">{s.name}</h3>
            <p className="text-5xl font-black mt-2">{s.total}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[40px] border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase italic border-b-4 border-black">
                <th className="pb-4 w-12 text-gray-400">#</th>
                <th className="pb-4">Student & Grade</th>
                <th className="pb-4">Parent Details</th>
                <th className="pb-4">Assigned Tutor</th>
                <th className="pb-4">Plan / Package</th>
                <th className="pb-4">Weekly Schedule</th>
                <th className="pb-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s, index) => (
                <tr key={s.id} className="border-b-2 border-gray-100 hover:bg-blue-50/30 transition-colors group">
                  <td className="py-6 font-black text-gray-200 group-hover:text-blue-200">{index + 1}</td>
                  <td className="py-6">
                    <div className="font-black uppercase text-lg tracking-tighter">{s.name}</div>
                    <div className="text-[10px] font-bold text-blue-500 px-2 py-0.5 bg-blue-50 rounded-full inline-block">GRADE {s.grade_level}</div>
                  </td>
                  <td>
                    <div className="font-bold text-sm">{s.parentName}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{s.parentEmail}</div>
                  </td>
                  {/* ✅ TUTOR COLUMN ADDED HERE */}
                  <td>
                    <div className="text-[10px] font-black uppercase text-gray-400">Tutor:</div>
                    <div className="font-black text-xs uppercase italic text-green-600">{s.tutorName}</div>
                  </td>
                  <td>
                    <span className="bg-black text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">
                      {s.packageName}
                    </span>
                  </td>
                  {/* ... Schedule & Settings ... */}
                  <td className="py-6">
                    <div className="flex flex-wrap gap-1 mb-2 items-center">
                      {s.preferredDays !== "Not Set" ? s.preferredDays.split(',').map((day: string) => (
                        <span key={day} className="bg-blue-600 text-white px-2 py-1 rounded-md text-[9px] font-black uppercase shadow-sm">{day.trim()}</span>
                      )) : <span className="bg-gray-200 text-gray-500 px-2 py-1 rounded-md text-[9px] font-black uppercase">Not Set</span>}
                      {s.preferredDays !== "Not Set" && (
                        <button onClick={() => generateMonthlyBookings(s)} className="ml-2 w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-600 hover:text-white transition-all text-xs" title="Sync Monthly Schedule">🔄</button>
                      )}
                    </div>
                  </td>
                  <td className="text-right">
                    <button onClick={() => handleUpdateStudent(s)} className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase hover:bg-black transition-all">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}