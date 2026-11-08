"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TimPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "asc")), snap => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubTeams(); };
  }, []);

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[ping_1.5s_infinite]"></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-[ping_1.5s_infinite_200ms]"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[ping_1.5s_infinite_400ms]"></div>
              </div>
          </div>
      );
  }

  return (
    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 min-h-screen flex flex-col transition-colors duration-300">
      
      <Navbar />

      {/* --- CONTENT UTAMA --- */}
      <main className="flex-grow pt-32 md:pt-40 pb-20 px-4 md:px-12 lg:px-16">
        <div className="container mx-auto max-w-7xl">
            
            {/* Judul Halaman */}
            <div className="text-center mb-12 md:mb-16">
                <span className="text-emerald-600 font-black tracking-widest uppercase text-xs md:text-sm mb-3 block">Meet The Team</span>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4">Our Experts</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light">
                    Berkenalan dengan para profesional yang siap membantu transformasi organisasi Anda.
                </p>
            </div>

            {/* Grid Kartu Tim (2 kolom HP, 4 kolom Laptop) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {teams.map(member => (
                    <div key={member.id} className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-800 dark:bg-slate-900 aspect-[3/4] shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer border border-transparent dark:border-slate-800">
                        <img src={member.img} alt={member.name} className="w-full h-full object-cover object-center group-hover:scale-110 group-hover:opacity-60 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 dark:from-slate-950 via-slate-900/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-3 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 w-full text-center">
                            <h3 className="text-sm md:text-lg font-bold mb-1 text-white leading-tight">{member.name}</h3>
                            <p className="text-yellow-400 text-[8px] md:text-[10px] font-bold tracking-widest uppercase line-clamp-1">{member.role}</p>
                        </div>
                    </div>
                ))}
            </div>

            {teams.length === 0 && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-20">Belum ada data tim yang ditambahkan.</p>
            )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
