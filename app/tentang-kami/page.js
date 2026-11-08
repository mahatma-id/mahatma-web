"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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

    return () => { 
        unsubSettings(); 
        unsubTeams(); 
    };
  }, []);

  const rawPhone = settings.phone || "6285185639375"; 
  let waNumber = rawPhone.replace(/[^0-9]/g, ''); 
  if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.substring(1);
  }

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
              {settings.logoDarkUrl || settings.logoUrl ? (
                  <img src={settings.logoDarkUrl || settings.logoUrl} alt="Loading..." className="h-12 md:h-16 w-auto object-contain animate-pulse mb-6 drop-shadow-lg" />
              ) : (
                  <span className="font-extrabold text-2xl md:text-3xl tracking-tight animate-pulse mb-6 text-emerald-500">Mahatma <span className="text-white">Academy</span></span>
              )}
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[ping_1.5s_infinite]"></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-[ping_1.5s_infinite_200ms]"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[ping_1.5s_infinite_400ms]"></div>
              </div>
          </div>
      );
  }

  return (
    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 min-h-screen flex flex-col selection:bg-emerald-500 selection:text-white relative transition-colors duration-300">
      
      <Navbar />

      {/* HERO SECTION TENTANG KAMI */}
      <section className="relative h-[60vh] md:h-[70vh] bg-slate-900 flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img 
                src={settings.aboutImageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80"} 
                alt="About Us" 
                className="w-full h-full object-cover transform scale-105 animate-[kenburns_20s_ease-out_infinite] mix-blend-overlay opacity-60"
            />
            {/* Efek Warna diubah jadi Emerald & Kuning */}
            <div className="absolute -top-20 -right-20 md:-top-40 md:-right-40 w-64 h-64 md:w-96 h-96 bg-emerald-600 rounded-full blur-[100px] opacity-40"></div>
            <div className="absolute -bottom-20 -left-20 md:-bottom-40 md:-left-40 w-64 h-64 md:w-96 h-96 bg-yellow-600 rounded-full blur-[100px] opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <span className="text-emerald-400 font-bold tracking-widest uppercase text-[10px] md:text-sm mb-4 block drop-shadow-md">Tentang Perusahaan</span>
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-extrabold text-white mb-4 md:mb-8 leading-[1.2] drop-shadow-xl">
                {settings.aboutTitle || "Membangun Masa Depan yang Berkelanjutan."}
            </h1>
            <p className="text-sm md:text-xl text-slate-300 font-light leading-relaxed max-w-2xl mx-auto px-2 drop-shadow-md">
                {settings.aboutDesc || "Mahatma Academy berdedikasi untuk membantu individu dan organisasi menavigasi perubahan zaman, memastikan mereka tetap relevan dan bertumbuh."}
            </p>
        </div>
      </section>

      {/* MISI & VISI */}
      <section className="py-10 md:py-20 px-5 md:px-12 lg:px-16 bg-white dark:bg-slate-900 relative z-20 -mt-8 md:-mt-10 mx-4 md:mx-12 lg:mx-auto max-w-5xl rounded-2xl md:rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 text-center transition-colors duration-300">
        <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6 leading-snug">
            {settings.missionTitle || "Solusi Terintegrasi Untuk Bisnis Anda."}
        </h2>
        <p className="text-sm md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed md:leading-loose font-light">
            {settings.missionDesc || "Kami memiliki misi untuk mendorong perubahan berkelanjutan dengan memberdayakan individu dan organisasi."}
            <br className="hidden md:block"/><br className="hidden md:block"/>
            <span className="block mt-3 md:mt-0">Dengan pendekatan berbasis riset, inovasi, dan praktik terbaik secara global, kami memastikan setiap klien kami mendapatkan strategi yang tepat sasaran, dapat dieksekusi, dan berdampak jangka panjang.</span>
        </p>
      </section>

      {/* TIM PAKAR */}
      {teams.length > 0 && (
          <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-950 px-4 md:px-12 lg:px-16 mt-6 md:mt-10 transition-colors duration-300">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-10 md:mb-16">
                    <span className="text-emerald-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 block">Orang di Balik Layar</span>
                    <h2 className="text-2xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2 md:mb-4">Tim Pakar Kami</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-lg font-light max-w-2xl mx-auto px-4">Profesional berpengalaman yang siap berkolaborasi mencarikan solusi terbaik untuk organisasi Anda.</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {teams.map(member => (
                        <div key={member.id} className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-500">
                            <img src={member.img} alt={member.name} className="w-full h-48 md:h-96 object-cover group-hover:scale-105 group-hover:opacity-70 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90"></div>
                            <div className="absolute bottom-0 left-0 p-3 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 w-full text-center">
                                <h3 className="text-sm md:text-xl font-bold mb-0.5 md:mb-1 text-white leading-tight">{member.name}</h3>
                                <p className="text-yellow-400 text-[8px] md:text-xs font-bold tracking-widest uppercase line-clamp-1">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* CALL TO ACTION */}
      <section className="bg-white dark:bg-slate-900 py-16 md:py-24 px-4 md:px-12 lg:px-16 text-center border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto max-w-3xl relative z-10">
            <h2 className="text-2xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6">
                {settings.ctaTitle || "Siap Memulai Transformasi?"}
            </h2>
            <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 mb-8 md:mb-10 font-light leading-relaxed px-2">
                {settings.ctaDesc || "Jangan ragu untuk menghubungi tim kami dan jadwalkan sesi konsultasi pertama Anda. Mari berdiskusi tentang bagaimana kami bisa membantu."}
            </p>
            <a 
                href={`https://wa.me/${waNumber}`} 
                target="_blank" 
                className="inline-block px-8 py-3.5 md:px-12 md:py-5 bg-emerald-600 text-white font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-emerald-500 hover:-translate-y-1 transition duration-300 shadow-md"
            >
                Hubungi Kami Sekarang
            </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}