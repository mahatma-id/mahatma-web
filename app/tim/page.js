"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

export default function TimPage() {
  const [teams, setTeams] = useState([]);
  const [settings, setSettings] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Logika Tema untuk Logo
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Ambil Data Pengaturan (Logo, Footer, dll)
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
      if(snap.exists()) setSettings(snap.data());
    });

    // Ambil SEMUA Data Tim (Urut berdasarkan input admin)
    const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "asc")), snap => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubSettings(); unsubTeams(); };
  }, []);

  const rawPhone = settings.phone || "6285185639375";
  let waNumber = rawPhone.replace(/[^0-9]/g, '');
  if (waNumber.startsWith('0')) waNumber = '62' + waNumber.substring(1);

  return (
    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 min-h-screen flex flex-col transition-colors duration-300">
      
      {/* --- NAVBAR (Sama persis dengan Home) --- */}
      <header className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 md:px-12 lg:px-16 py-3 md:py-4 flex justify-between items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-2 group z-50">
            {settings.logoUrl ? (
                <img 
                    src={mounted && resolvedTheme === 'dark' && settings.logoDarkUrl ? settings.logoDarkUrl : settings.logoUrl} 
                    alt="Logo" 
                    className="h-10 md:h-14 w-auto aspect-[4/1] object-contain object-left" 
                />
            ) : (
                <span className="font-extrabold text-base md:text-xl text-emerald-600">Mahatma Academy</span>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-10 font-bold text-xs tracking-widest uppercase text-slate-600 dark:text-slate-300">
            <Link href="/#layanan" className="hover:text-emerald-600 dark:hover:text-emerald-500 hover:-translate-y-1 transition-all">Service</Link>
            <Link href="/tentang-kami" className="hover:text-emerald-600 dark:hover:text-emerald-500 hover:-translate-y-1 transition-all">About Us</Link>
            <Link href="/tim" className="text-emerald-600 dark:text-emerald-500 hover:-translate-y-1 transition-all">Our Experts</Link>
            <Link href="/#insight" className="hover:text-emerald-600 dark:hover:text-emerald-500 hover:-translate-y-1 transition-all">Insight</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/#kontak" className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-full hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:-translate-y-1 hover:shadow-lg transition-all tracking-widest uppercase">
              Join Us
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
        {isMobileMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl py-4">
                <nav className="flex flex-col items-center gap-4 font-bold text-sm tracking-widest uppercase text-slate-600 dark:text-slate-300 px-4">
                    <Link href="/#layanan" onClick={() => setIsMobileMenuOpen(false)}>Service</Link>
                    <Link href="/tentang-kami" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
                    <Link href="/tim" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-600">Our Experts</Link>
                    <Link href="/#insight" onClick={() => setIsMobileMenuOpen(false)}>Insight</Link>
                    <Link href="/#kontak" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-4 py-3 bg-emerald-600 text-white rounded-full">Join Us</Link>
                </nav>
            </div>
        )}
      </header>

      {/* --- CONTENT UTAMA --- */}
      <main className="flex-grow pt-12 pb-20 px-4 md:px-12 lg:px-16">
        <div className="container mx-auto max-w-7xl">
            
            {/* Judul Halaman */}
            <div className="text-center mb-12 md:mb-16">
                <span className="text-emerald-600 font-black tracking-widest uppercase text-xs md:text-sm mb-3 block">Meet The Team</span>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white">Our Experts</h1>
                <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                    Berkenalan dengan para profesional yang siap membantu transformasi organisasi Anda.
                </p>
            </div>

            {/* Grid Kartu Tim (2 kolom HP, 4 kolom Laptop) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {teams.map(member => (
                    <div key={member.id} className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-800 dark:bg-slate-900 aspect-[3/4]">
                        <img src={member.img} alt={member.name} className="w-full h-full object-cover object-center group-hover:scale-110 group-hover:opacity-60 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 dark:from-slate-950 via-slate-900/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-3 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 w-full text-center">
                            <h3 className="text-sm md:text-lg font-bold mb-1 text-white">{member.name}</h3>
                            <p className="text-yellow-400 text-[10px] md:text-xs font-bold tracking-widest uppercase line-clamp-1">{member.role}</p>
                        </div>
                    </div>
                ))}
            </div>

            {teams.length === 0 && (
                <p className="text-center text-slate-500 py-20">Belum ada data tim yang ditambahkan.</p>
            )}

        </div>
      </main>

      {/* --- FOOTER (Sama persis dengan Home) --- */}
      <footer className="bg-white dark:bg-slate-950 pt-12 pb-6 md:pt-20 md:pb-10 px-4 md:px-12 lg:px-16 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 mb-8 md:mb-16 text-center md:text-left">
                <div className="lg:col-span-4 lg:pr-8 flex flex-col items-center md:items-start">
                    <Link href="/" className="inline-block mb-4 md:mb-8">
                        {settings.logoUrl ? (
                            <img 
                                src={mounted && resolvedTheme === 'dark' && settings.logoDarkUrl ? settings.logoDarkUrl : settings.logoUrl} 
                                alt="Logo" 
                                className="h-10 md:h-14 w-auto aspect-[4/1] object-contain object-left" 
                            />
                        ) : <span className="font-extrabold text-xl text-emerald-600">Mahatma Academy</span>}
                    </Link>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base leading-relaxed mb-4">{settings.footerDesc}</p>
                    <div className="flex flex-col gap-2 w-full text-sm">
                        <a href={`https://wa.me/${waNumber}`} target="_blank" className="flex items-center justify-center md:justify-start gap-2 text-emerald-600 font-bold">{rawPhone}</a>
                        {settings.email && <span className="flex items-center justify-center md:justify-start gap-2 text-slate-500">{settings.email}</span>}
                        {settings.address && <span className="flex items-center justify-center md:justify-start gap-2 text-slate-500 text-left">{settings.address}</span>}
                    </div>
                </div>

                <div className="lg:col-span-2">
                     <h4 className="font-bold text-slate-900 dark:text-white mb-3 md:mb-6 uppercase tracking-wider text-[10px] md:text-sm">Follow Us</h4>
                     <div className="flex justify-center md:justify-start gap-3">
                        <a href={settings.linkedin || "#"} className="text-slate-400 hover:text-emerald-600">LinkedIn</a>
                        <a href={settings.instagram || "#"} className="text-slate-400 hover:text-pink-600">Instagram</a>
                     </div>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 md:mb-6 uppercase tracking-wider text-[10px] md:text-sm">Location</h4>
                    {settings.mapUrl ? (
                        <a href={settings.mapLink || "#"} target="_blank" className="block w-full aspect-square rounded-xl overflow-hidden border border-slate-200 hover:opacity-80 transition">
                        <img src={settings.mapUrl} className="w-full h-full object-cover" alt="Lokasi Kami" />
                        </a>
                    ) : <div className="w-full aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">Maps belum diatur</div>}
                </div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                &copy; 2026 Mahatma Academy.
            </div>
        </div>
      </footer>
    </div>
  );
}