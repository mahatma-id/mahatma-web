"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

export default function TentangKami() {
  const [settings, setSettings] = useState({});
  const [teams, setTeams] = useState([]);
  const [partners, setPartners] = useState([]); // Ditambahkan untuk Footer
  const [loading, setLoading] = useState(true);
  
  // State untuk Header
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Ambil data pengaturan
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => { 
        if(snap.exists()) setSettings(snap.data()); 
    });

    // Ambil data Tim Pakar
    const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "asc")), snap => { 
        setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
        setLoading(false);
    });

    // Ambil data Mitra untuk Footer
    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => { 
        setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() }))); 
    });

    // Listener untuk mendeteksi scroll
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => { 
        unsubSettings(); 
        unsubTeams(); 
        unsubPartners();
        window.removeEventListener('scroll', handleScroll); 
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
      
      {/* HEADER (Sama Persis dengan Home) */}
      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-white dark:bg-slate-950 shadow-md border-b border-slate-100 dark:border-slate-800 py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-4 md:px-12 lg:px-16 flex justify-between items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-2 group z-50">
            {settings.logoUrl ? (
                <img 
                    src={mounted && ((!isScrolled && settings.logoDarkUrl) || (isScrolled && resolvedTheme === 'dark' && settings.logoDarkUrl)) ? settings.logoDarkUrl : settings.logoUrl} 
                    alt="Logo" 
                    className="h-10 md:h-14 w-auto aspect-[4/1] object-contain object-left transition-all duration-300" 
                />
            ) : (
                <div className="flex flex-col md:flex-row md:items-center group-hover:text-emerald-600 transition-colors">
                    <span className={`font-extrabold text-base md:text-xl tracking-tight transition-colors ${isScrolled ? 'text-slate-900 dark:text-white' : 'text-white drop-shadow-md'}`}>
                        Mahatma <span className="text-emerald-600">Academy</span>
                    </span>
                    <span className={`text-[7px] md:text-[10px] font-bold tracking-widest uppercase md:ml-2 mt-0.5 md:mt-0 ${isScrolled ? 'text-slate-500 dark:text-slate-400' : 'text-white/80 drop-shadow-md'}`}>
                        <span className="hidden md:inline">- </span>Driving Transformation
                    </span>
                </div>
            )}
          </Link>

          <nav className={`hidden lg:flex items-center gap-10 font-bold text-xs tracking-widest uppercase transition-colors ${isScrolled ? 'text-slate-600 dark:text-slate-300' : 'text-white drop-shadow-md'}`}>
            <a href="/#layanan" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Service</a>
            <Link href="/tentang-kami" className="text-emerald-500 hover:-translate-y-1 transition-all">About Us</Link>
            <a href="/#tim" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Our Team</a>
            <a href="/#insight" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Insight</a>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <div className={isScrolled ? '' : 'text-white'}><ThemeToggle /></div>
            <Link href="/admin" className={`text-xs font-bold uppercase tracking-widest mr-4 transition ${isScrolled ? 'text-slate-400 hover:text-slate-800 dark:hover:text-white' : 'text-white/80 hover:text-white drop-shadow-md'}`}>Admin</Link>
            <a href="/#kontak" className={`px-6 py-2.5 font-bold text-xs rounded-full hover:-translate-y-1 hover:shadow-lg transition-all tracking-widest uppercase ${isScrolled ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(0,0,0,0.3)]'}`}>
              Join Us
            </a>
          </div>

          <div className="lg:hidden flex items-center gap-3 z-50">
            <div className={isScrolled || isMobileMenuOpen ? '' : 'text-white'}><ThemeToggle /></div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`focus:outline-none p-2 ${isScrolled || isMobileMenuOpen ? 'text-slate-900 dark:text-white' : 'text-white drop-shadow-md'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />}
                </svg>
            </button>
          </div>
        </div>

        <div className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 py-4 opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'}`}>
            <nav className="flex flex-col items-center gap-4 font-bold text-sm tracking-widest uppercase text-slate-600 dark:text-slate-300 px-4">
                <Link href="/tentang-kami" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">About Us</Link>
                <a href="/#layanan" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Service</a>
                <a href="/#tim" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Our Team</a>
                <a href="/#insight" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Insight</a>
                <div className="flex flex-col items-center gap-3 mt-2 w-full">
                    <a href="/#kontak" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-4 py-3 bg-emerald-600 text-white font-bold text-xs rounded-full hover:bg-slate-900 transition-all tracking-widest uppercase">Join Us</a>
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Login</Link>
                </div>
            </nav>
        </div>
      </header>

      {/* HERO SECTION TENTANG KAMI */}
      <section className="relative h-[60vh] md:h-[70vh] bg-slate-900 flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img 
                src={settings.aboutImageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80"} 
                alt="About Us" 
                className="w-full h-full object-cover transform scale-105 animate-[kenburns_20s_ease-out_infinite] mix-blend-overlay opacity-60"
            />
            {/* Efek Warna diubah jadi Emerald & Kuning */}
            <div className="absolute -top-20 -right-20 md:-top-40 md:-right-40 w-64 h-64 md:w-96 md:h-96 bg-emerald-600 rounded-full blur-[100px] opacity-40"></div>
            <div className="absolute -bottom-20 -left-20 md:-bottom-40 md:-left-40 w-64 h-64 md:w-96 md:h-96 bg-yellow-600 rounded-full blur-[100px] opacity-40"></div>
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

      {/* MISI & VISI (Background diubah agar support Dark Mode) */}
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

      {/* FOOTER (Sama Persis dengan Home) */}
      <footer className="bg-white dark:bg-slate-950 pt-12 pb-6 md:pt-20 md:pb-10 px-4 md:px-12 lg:px-16 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300 mt-auto">
        <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 mb-8 md:mb-16 text-center md:text-left">
                <div className="lg:col-span-4 lg:pr-8 flex flex-col items-center md:items-start">
                    <Link href="/" className="inline-block mb-4 md:mb-8">
                        {settings.logoUrl ? (
                            <img src={mounted && resolvedTheme === 'dark' && settings.logoDarkUrl ? settings.logoDarkUrl : settings.logoUrl} alt="Logo" className="h-10 md:h-14 w-auto aspect-[4/1] object-contain object-left" />
                        ) : (
                            <div className="flex flex-col md:flex-row md:items-center group-hover:text-emerald-600 transition-colors">
                                <span className="font-extrabold text-base md:text-xl tracking-tight text-slate-900 dark:text-white">Mahatma <span className="text-emerald-600">Academy</span></span>
                                <span className="text-[7px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase md:ml-2 mt-0.5 md:mt-0"><span className="hidden md:inline">- </span>Driving Transformation</span>
                            </div>
                        )}
                    </Link>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base leading-relaxed md:leading-loose mb-4 md:mb-8 max-w-xs md:max-w-none">
                        {settings.footerDesc || "Mempersiapkan diri menghadapi perubahan zaman dan membuat bisnis Anda tetap relevan di masa depan."}
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                        <a href={`https://wa.me/${waNumber}`} target="_blank" className="flex items-center justify-center md:justify-start gap-2 text-emerald-600 hover:text-emerald-700 transition">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                             <span className="text-sm font-bold">{rawPhone}</span>
                        </a>
                        {settings.email && (
                            <a href={`mailto:${settings.email}`} className="flex items-center justify-center md:justify-start gap-2 text-slate-500 hover:text-emerald-600 transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                <span className="text-sm">{settings.email}</span>
                            </a>
                        )}
                         {settings.address && (
                            <div className="flex items-start justify-center md:justify-start gap-2 text-slate-500">
                                <svg className="w-4 h-4 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span className="text-sm text-left">{settings.address}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 md:mb-6 uppercase tracking-wider text-[10px] md:text-sm">Follow Us</h4>
                    <div className="flex justify-center md:justify-start gap-3 md:gap-4">
                        <a href={settings.linkedin || "#"} target="_blank" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-emerald-600 hover:text-emerald-600 transition"><span className="text-xs md:text-sm font-bold">in</span></a>
                        <a href={settings.youtube || "#"} target="_blank" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-red-600 hover:text-red-600 transition"><span className="text-xs md:text-sm font-bold">yt</span></a>
                        <a href={settings.instagram || "#"} target="_blank" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-pink-600 hover:text-pink-600 transition"><span className="text-xs md:text-sm font-bold">ig</span></a>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 md:mb-6 uppercase tracking-wider text-[10px] md:text-sm">Location</h4>
                    {settings.mapUrl ? (
                         <a href={settings.mapLink || "#"} target="_blank" className="block w-full aspect-square rounded-xl overflow-hidden border border-slate-200 hover:opacity-80 transition">
                            <img src={settings.mapUrl} className="w-full h-full object-cover" alt="Lokasi Kami" />
                         </a>
                    ) : (
                         <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Maps belum diatur</div>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 md:mb-6 uppercase tracking-wider text-[10px] md:text-sm">Mitra Kerja</h4>
                    {partners.length > 0 ? (
                        <div className="flex flex-col items-center md:items-start">
                            <div className="grid grid-cols-4 lg:grid-cols-3 gap-2 md:gap-3 opacity-80 w-full max-w-[200px] md:max-w-xs">
                                {partners.slice(0, 12).map(p => (
                                    <div key={p.id} className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 hover:border-emerald-200 p-1 md:p-2 transition-colors">
                                        {p.imgUrl ? (
                                            <img src={p.imgUrl} alt={p.name} title={p.name} className="max-w-full max-h-full object-contain grayscale hover:grayscale-0 transition duration-300" />
                                        ) : (
                                            <span title={p.name} className="text-[6px] md:text-[9px] font-bold text-slate-400 uppercase w-full text-center truncate">{p.name.substring(0,3)}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {partners.length > 12 && (
                                <div className="mt-3 md:mt-5">
                                    <Link href="/mitra-kerja" className="text-[10px] md:text-sm text-emerald-600 hover:text-emerald-700 font-bold transition">
                                        Selengkapnya &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada mitra.</p>
                    )}
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 md:pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-[9px] md:text-[11px] font-bold tracking-widest uppercase text-slate-400">
                <p className="mb-3 md:mb-0">&copy; 2026 Mahatma Academy. All rights reserved.</p>
                <div className="flex justify-center gap-4 md:gap-6">
                    <Link href="/privacy-policy" className="hover:text-emerald-600 transition">Privacy Policy</Link>
                    <Link href="/terms-of-service" className="hover:text-emerald-600 transition">Terms of Service</Link>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}