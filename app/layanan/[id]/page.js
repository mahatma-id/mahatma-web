"use client";
import { useEffect, useState, use } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function LayananDetail({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({}); // Untuk mengambil nomor WA

  useEffect(() => {
    // Ambil data pengaturan (untuk logo dan nomor WA)
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => { 
        if(snap.exists()) setSettings(snap.data()); 
    });

    // Ambil detail layanan berdasarkan ID
    const fetchService = async () => {
      try {
        const docRef = doc(db, "services", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() });
        } else {
          setService(null);
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();

    return () => { unsubSettings(); };
  }, [id]);

  // Format Nomor WA
  const rawPhone = settings.phone || "(+62) 811-8008-009";
  const waNumber = rawPhone.replace(/[^0-9]/g, '');

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 font-bold text-slate-500 tracking-widest uppercase text-xs">Menyiapkan Layanan...</p>
          </div>
      );
  }

  if (!service) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
              <h1 className="text-6xl font-black text-slate-900 mb-4">404</h1>
              <p className="text-slate-500 mb-8 text-lg">Layanan tidak ditemukan.</p>
              <Link href="/#layanan" className="px-8 py-3 bg-orange-600 text-white font-bold rounded-full text-xs tracking-widest uppercase hover:bg-orange-700 transition">
                  Kembali ke Beranda
              </Link>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-orange-500 selection:text-white">
      
      {/* NAVBAR SIMPEL */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 py-4 flex justify-between items-center max-w-7xl">
          <Link href="/#layanan" className="font-extrabold text-sm tracking-widest uppercase text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-2">
            <span>&larr;</span> LAYANAN LAIN
          </Link>
          <Link href="/">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 hidden md:block hover:text-orange-600 transition-colors">
                 Mahatma<span className="text-orange-600">.id</span>
              </span>
          </Link>
        </div>
      </header>

      {/* HEADER LAYANAN */}
      <section className="bg-slate-900 text-white py-20 px-6 md:px-12 lg:px-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
            <span className="inline-block px-4 py-1.5 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                Detail Layanan
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                {service.name}
            </h1>
        </div>
      </section>

      {/* DESKRIPSI LAYANAN */}
      <main className="flex-1 py-16 px-6 md:px-12 lg:px-16 -mt-10 relative z-20">
        <div className="container mx-auto max-w-4xl bg-white p-8 md:p-12 lg:p-16 rounded-[2rem] shadow-xl border border-slate-100">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-8">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Tentang Program Ini</h2>
            <p className="text-slate-600 text-lg leading-loose font-light whitespace-pre-line mb-12">
                {service.desc}
            </p>

            {/* CALL TO ACTION KHUSUS LAYANAN INI */}
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-3">Tertarik dengan {service.name}?</h3>
                <p className="text-slate-500 text-sm mb-6">Tim pakar kami siap mendiskusikan kebutuhan spesifik organisasi Anda.</p>
                <a 
                    href={`https://wa.me/${waNumber}?text=Halo%20tim%20Mahatma,%20saya%20tertarik%20untuk%20berdiskusi%20lebih%20lanjut%20mengenai%20layanan%20*${service.name}*.`} 
                    target="_blank" 
                    className="inline-block px-10 py-4 bg-orange-600 text-white font-bold tracking-widest uppercase rounded-full text-xs hover:bg-orange-500 hover:-translate-y-1 transition duration-300 shadow-md"
                >
                    Konsultasi Sekarang via WA
                </a>
            </div>
        </div>
      </main>

      {/* FOOTER MINIMALIS */}
      <footer className="bg-slate-950 py-10 px-6 text-center mt-auto border-t border-slate-900">
        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">&copy; 2026 Mahatma.id. Designed with Purpose.</p>
      </footer>

    </div>
  );
}