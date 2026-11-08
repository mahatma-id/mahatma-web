"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function MitraPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => {
      setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubPartners(); };
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

      {/* KONTEN MITRA */}
      <main className="flex-grow pt-32 md:pt-40 pb-20 px-4 md:px-12 lg:px-16">
        <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-10 md:mb-16">
                <span className="text-emerald-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 md:mb-4 block">Jaringan Kepercayaan</span>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 md:mb-6">Mitra Kerja Kami</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg max-w-2xl mx-auto font-light leading-relaxed px-2">
                    Kami bangga telah berkolaborasi dan memberikan solusi terbaik untuk berbagai institusi, perusahaan, dan organisasi di berbagai sektor.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                {partners.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-emerald-900/20 hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group cursor-pointer">
                        <div className="h-16 md:h-24 w-full flex items-center justify-center mb-3 md:mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl p-2 md:p-4 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                            {p.imgUrl ? (
                                <img src={p.imgUrl} alt={p.name} className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500" />
                            ) : (
                                <span className="text-[10px] md:text-sm font-bold text-slate-400 uppercase line-clamp-2 leading-tight">{p.name}</span>
                            )}
                        </div>
                        <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">{p.name}</h3>
                        <p className="text-[8px] md:text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest line-clamp-1">{p.field || 'Partner'}</p>
                    </div>
                ))}
            </div>
            
            {partners.length === 0 && (
                <p className="text-center text-slate-400 mt-10">Belum ada data mitra yang ditambahkan.</p>
            )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
