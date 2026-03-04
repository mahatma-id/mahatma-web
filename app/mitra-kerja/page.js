"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

export default function MitraPage() {
  const [partners, setPartners] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  
  // State untuk Header
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Ambil Data Pengaturan (Logo, Footer, dll)
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
      if(snap.exists()) setSettings(snap.data());
    });

    // Ambil SEMUA Mitra
    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => {
      setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubSettings(); unsubPartners(); };
  }, []);

  const rawPhone = settings.phone || "6285185639375";
  let waNumber = rawPhone.replace(/[^0-9]/g, '');
  if (waNumber.startsWith('0')) waNumber = '62' + waNumber.substring(1);

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
    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 min-h-screen flex flex-col transition-colors duration-300">
      
      {/* HEADER: Solid (karena tidak ada hero image) */}
      <header className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-[100] transition-all duration-300 py-3">
        <div className="container mx-auto px-4 md:px-12 lg:px-16 flex justify-between items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-2 group z-50">
            {settings.logoUrl ? (
                <img 
                    src={mounted && resolvedTheme === 'dark' && settings.logoDarkUrl ? settings.logoDarkUrl : settings.logoUrl} 
                    alt="Logo" 
                    className="h-10 md:h-14 w-auto aspect-[4/1] object-contain object-left transition-all duration-300" 
                />
            ) : (
                <div className="flex flex-col md:flex-row md:items-center group-hover:text-emerald-600 transition-colors">
                    <span className="font-extrabold text-base md:text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        Mahatma <span className="text-emerald-600">Academy</span>
                    </span>
                    <span className="text-[7px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase md:ml-2 mt-0.5 md:mt-0">
                        <span className="hidden md:inline">- </span>Driving Transformation
                    </span>
                </div>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-10 font-bold text-xs tracking-widest uppercase text-slate-600 dark:text-slate-300">
            <Link href="/tentang-kami" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">About Us</Link>
            <Link href="/#layanan" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Service</Link>
            <Link href="/#tim" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Team</Link>
            <Link href="/#insight" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Insight</Link>
            <Link href="/events" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Events</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            
            {/* UPDATE: Tombol Portal ISO & Join Us Dijejer */}
            <div className="flex items-center p-1.5 md:p-[5px] rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 transition-all duration-300 ml-2">
                <Link href="/portal" className="px-4 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full transition-all hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                    Portal ISO
                </Link>
                <Link href="/#kontak" className="px-5 md:px-7 py-2 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-all">
                    Join Us
                </Link>
            </div>

            {/* UPDATE: Login Admin cuma Icon di ujung kanan */}
            <Link href="/admin" title="Login Admin" className="p-2 ml-1 rounded-full transition-all text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-3 z-50">
            <ThemeToggle />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-900 dark:text-white focus:outline-none p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] py-4 opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'}`}>
            <nav className="flex flex-col items-center gap-4 font-bold text-sm tracking-widest uppercase text-slate-600 dark:text-slate-300 px-4">
                <Link href="/tentang-kami" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">About Us</Link>
                <Link href="/#layanan" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Service</Link>
                <Link href="/#tim" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Team</Link>
                <Link href="/#insight" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Insight</Link>
                <Link href="/events" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Events</Link>
                
                <div className="flex flex-col items-center gap-3 mt-2 w-full">
                    {/* UPDATE: Menu Mobile Menyesuaikan Desain */}
                    <div className="flex items-center p-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 w-full justify-between">
                        <Link href="/portal" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 text-center px-4 py-3 text-slate-600 dark:text-slate-300 font-bold text-[10px] tracking-widest uppercase rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all">Portal ISO</Link>
                        <Link href="/#kontak" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 text-center px-4 py-3 bg-emerald-600 text-white font-bold text-[10px] rounded-full hover:bg-emerald-500 transition-all tracking-widest uppercase shadow-md">Join Us</Link>
                    </div>
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="mt-2 text-slate-400 hover:text-emerald-600 transition p-2 bg-slate-50 dark:bg-slate-800 rounded-full" title="Admin Login">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </Link>
                </div>
            </nav>
        </div>
      </header>

      {/* KONTEN MITRA */}
      <main className="flex-grow pt-12 pb-20 px-4 md:px-12 lg:px-16">
        <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-10 md:mb-16">
                <span className="text-emerald-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 md:mb-4 block">Jaringan Kepercayaan</span>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 md:mb-6">Mitra Kerja Kami</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg max-w-2xl mx-auto font-light leading-relaxed px-2">
                    Kami bangga telah berkolaborasi dan memberikan solusi terbaik untuk berbagai institusi, perusahaan, dan organisasi di berbagai sektor.
                </p>
            </div>

            {/* GRID RESPONSIF */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                {partners.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-emerald-900/20 hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group cursor-pointer">
                        
                        {/* Tempat Logo */}
                        <div className="h-16 md:h-24 w-full flex items-center justify-center mb-3 md:mb-4 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl p-2 md:p-4 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors">
                            {p.imgUrl ? (
                                <img src={p.imgUrl} alt={p.name} className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500" />
                            ) : (
                                <span className="text-[10px] md:text-sm font-bold text-slate-400 uppercase line-clamp-2 leading-tight">{p.name}</span>
                            )}
                        </div>
                        
                        {/* Deskripsi */}
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
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"></path></svg>
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
                                    <div key={p.id} className="w-full aspect-square flex items-center justify-center bg-white dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800 hover:border-emerald-200 p-1 md:p-2 transition-colors">
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
                                    <Link href="/mitra-kerja" className="text-[10px] md:text-sm text-emerald-600 hover:text-emerald-700 font-bold transition">Selengkapnya &rarr;</Link>
                                </div>
                            )}
                        </div>
                    ) : (<p className="text-xs text-slate-500 dark:text-slate-400">Belum ada mitra.</p>)}
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