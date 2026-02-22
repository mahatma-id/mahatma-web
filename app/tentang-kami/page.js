"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function TentangKami() {
  const [settings, setSettings] = useState({});
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ambil data pengaturan
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => { 
        if(snap.exists()) setSettings(snap.data()); 
    });

    // Ambil data Tim Pakar
    const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "asc")), snap => { 
        setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
        setLoading(false);
    });

    return () => { unsubSettings(); unsubTeams(); };
  }, []);

  const rawPhone = settings.phone || "6285185639375"; 
  let waNumber = rawPhone.replace(/[^0-9]/g, ''); 
  if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.substring(1);
  }

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
              <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 font-bold text-slate-500 tracking-widest uppercase text-[10px] md:text-xs">Memuat Profil...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-orange-500 selection:text-white overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-12 lg:px-16 py-3 md:py-4 flex justify-between items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-2 group">
            {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-8 md:h-10 object-contain group-hover:scale-105 transition-transform" />
            ) : (
                <span className="font-extrabold text-lg md:text-xl tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                    MAHATMA <span className="text-orange-600">ACADEMY</span>
                </span>
            )}
          </Link>
          <Link href="/" className="font-extrabold text-[10px] md:text-sm tracking-widest uppercase text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-2">
            <span>&larr;</span> KEMBALI
          </Link>
        </div>
      </header>

      {/* HERO SECTION TENTANG KAMI (TERHUBUNG KE ADMIN) */}
      <section className="bg-slate-900 text-white py-16 md:py-24 lg:py-32 px-4 md:px-12 lg:px-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-20 -right-20 md:-top-40 md:-right-40 w-64 h-64 md:w-96 md:h-96 bg-orange-600 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 md:-bottom-40 md:-left-40 w-64 h-64 md:w-96 md:h-96 bg-indigo-600 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
            <span className="text-orange-500 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 md:mb-4 block">Tentang Perusahaan</span>
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-extrabold mb-4 md:mb-8 leading-[1.2]">
                {settings.aboutTitle || "Membangun Masa Depan yang Berkelanjutan."}
            </h1>
            <p className="text-sm md:text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto px-2">
                {settings.aboutDesc || "Mahatma Academy berdedikasi untuk membantu individu dan organisasi menavigasi perubahan zaman, memastikan mereka tetap relevan dan bertumbuh."}
            </p>
        </div>
      </section>

      {/* MISI & VISI */}
      <section className="py-10 md:py-20 px-5 md:px-12 lg:px-16 bg-white relative z-20 -mt-8 md:-mt-10 mx-4 md:mx-12 lg:mx-auto max-w-5xl rounded-2xl md:rounded-[2rem] shadow-xl border border-slate-100 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-4 md:mb-6 leading-snug">
            {settings.missionTitle || "Solusi Terintegrasi Untuk Bisnis Anda."}
        </h2>
        <p className="text-sm md:text-xl text-slate-600 leading-relaxed md:leading-loose font-light">
            {settings.missionDesc || "Kami memiliki misi untuk mendorong perubahan berkelanjutan dengan memberdayakan individu dan organisasi."}
            <br className="hidden md:block"/><br className="hidden md:block"/>
            <span className="block mt-3 md:mt-0">Dengan pendekatan berbasis riset, inovasi, dan praktik terbaik secara global, kami memastikan setiap klien kami mendapatkan strategi yang tepat sasaran, dapat dieksekusi, dan berdampak jangka panjang.</span>
        </p>
      </section>

      {/* TIM PAKAR */}
      {teams.length > 0 && (
          <section className="py-16 md:py-24 bg-slate-50 px-4 md:px-12 lg:px-16 mt-6 md:mt-10">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-10 md:mb-16">
                    <span className="text-orange-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 block">Orang di Balik Layar</span>
                    <h2 className="text-2xl md:text-5xl font-bold text-slate-900 mb-2 md:mb-4">Tim Pakar Kami</h2>
                    <p className="text-slate-500 text-xs md:text-lg font-light max-w-2xl mx-auto px-4">Profesional berpengalaman yang siap berkolaborasi mencarikan solusi terbaik untuk organisasi Anda.</p>
                </div>
                
                {/* Di HP Dibuat Grid 2 agar foto tidak terlalu besar dan makan layar */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {teams.map(member => (
                        <div key={member.id} className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-800 shadow-sm hover:shadow-xl transition-all duration-500">
                            {/* Tinggi foto disesuaikan di HP (h-48) */}
                            <img src={member.img} alt={member.name} className="w-full h-48 md:h-96 object-cover group-hover:scale-105 group-hover:opacity-70 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-90"></div>
                            <div className="absolute bottom-0 left-0 p-3 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                <h3 className="text-sm md:text-xl font-bold mb-0.5 md:mb-1 text-white leading-tight">{member.name}</h3>
                                <p className="text-orange-400 text-[8px] md:text-xs font-bold tracking-widest uppercase line-clamp-1">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* CALL TO ACTION (TERHUBUNG KE ADMIN) */}
      <section className="bg-white py-16 md:py-24 px-4 md:px-12 lg:px-16 text-center border-t border-slate-100">
        <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl md:text-5xl font-bold text-slate-900 mb-4 md:mb-6">
                {settings.ctaTitle || "Siap Memulai Transformasi?"}
            </h2>
            <p className="text-sm md:text-lg text-slate-500 mb-8 md:mb-10 font-light leading-relaxed px-2">
                {settings.ctaDesc || "Jangan ragu untuk menghubungi tim kami dan jadwalkan sesi konsultasi pertama Anda. Mari berdiskusi tentang bagaimana kami bisa membantu."}
            </p>
            <a 
                href={`https://wa.me/${waNumber}`} 
                target="_blank" 
                className="inline-block px-8 py-3.5 md:px-12 md:py-5 bg-orange-600 text-white font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-orange-500 hover:-translate-y-1 transition duration-300 shadow-md"
            >
                Hubungi Kami Sekarang
            </a>
        </div>
      </section>

      {/* FOOTER MINIMALIS */}
      <footer className="bg-slate-950 py-8 px-4 text-center border-t border-slate-900 mt-auto">
        <p className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-slate-500">&copy; 2026 MAHATMA ACADEMY. Designed with Purpose.</p>
      </footer>

    </div>
  );
}