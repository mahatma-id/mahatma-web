"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function MitraKerja() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Menarik semua data mitra dari Firebase
    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => { 
        setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
        setLoading(false);
    });
    return () => unsubPartners();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-orange-500 selection:text-white">
      
      {/* NAVBAR SIMPEL */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-7xl">
          <Link href="/" className="font-extrabold text-xl tracking-tight text-slate-900 hover:text-orange-600 transition-colors">
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </header>

      <main className="flex-1 py-20 px-4">
        <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-16">
                <span className="text-orange-600 font-bold tracking-widest uppercase text-xs mb-4 block">Jaringan Kepercayaan</span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Mitra Kerja Kami</h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                    Kami bangga telah berkolaborasi dan memberikan solusi terbaik untuk berbagai institusi, perusahaan, dan organisasi di berbagai sektor.
                </p>
            </div>

            {loading ? (
                <div className="text-center text-slate-400 animate-pulse font-bold tracking-widest mt-20">MEMUAT DATA MITRA...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {partners.map(p => (
                        <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center">
                            
                            {/* Tempat Logo / Nama */}
                            <div className="h-24 w-full flex items-center justify-center mb-4 bg-slate-50 rounded-2xl p-4">
                                {p.imgUrl ? (
                                    <img src={p.imgUrl} alt={p.name} className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                                ) : (
                                    <span className="text-sm font-bold text-slate-400 uppercase">{p.name}</span>
                                )}
                            </div>
                            
                            {/* Deskripsi */}
                            <h3 className="text-base font-bold text-slate-900 mb-1">{p.name}</h3>
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{p.field || 'Mitra Strategis'}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-10 px-4 text-center border-t border-slate-900 mt-auto">
        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">&copy; 2026 Mahatma.id. All Rights Reserved.</p>
      </footer>

    </div>
  );
}