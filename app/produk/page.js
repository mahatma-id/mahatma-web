"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

export default function ProdukPage() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [partners, setPartners] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // State Header
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
      if(snap.exists()) setSettings(snap.data());
    });

    // Ambil SEMUA Produk (Tanpa Limit)
    const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => {
        setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    return () => { unsubSettings(); unsubProducts(); unsubPartners(); window.removeEventListener('scroll', handleScroll); };
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
      
      {/* HEADER */}
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
            <Link href="/tentang-kami" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">About Us</Link>
            <Link href="/#layanan" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Service</Link>
            <Link href="/produk" className="text-emerald-500 hover:-translate-y-1 transition-all">Product</Link>
            <Link href="/tim" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Team</Link>
            <Link href="/events" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Events</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <div className={isScrolled ? '' : 'text-white'}><ThemeToggle /></div>
            <div className={`flex items-center p-1.5 md:p-[5px] rounded-full border transition-all duration-300 ml-2 ${isScrolled ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-white/10 border-white/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.2)]'}`}>
                <Link href="/portal" className={`px-4 md:px-6 py-2 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full transition-all hover:bg-white hover:text-slate-900 ${isScrolled ? 'text-slate-600 dark:text-slate-300' : 'text-white'}`}>Portal ISO</Link>
                <a href="#kontak" className="px-5 md:px-7 py-2 md:py-2.5 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-all">Join Us</a>
            </div>
            <Link href="/admin" title="Admin Panel" className={`p-2 ml-1 rounded-full transition-all ${isScrolled ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800' : 'text-white/80 hover:text-white hover:bg-white/20'}`}>
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-3 z-50">
            <div className={isScrolled || isMobileMenuOpen ? '' : 'text-white'}><ThemeToggle /></div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`focus:outline-none p-2 ${isScrolled || isMobileMenuOpen ? 'text-slate-900 dark:text-white' : 'text-white drop-shadow-md'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{isMobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />}</svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] py-4 opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'}`}>
            <nav className="flex flex-col items-center gap-4 font-bold text-sm tracking-widest uppercase text-slate-600 dark:text-slate-300 px-4">
                <Link href="/tentang-kami" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
                <Link href="/#layanan" onClick={() => setIsMobileMenuOpen(false)}>Service</Link>
                <Link href="/produk" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-600">Product</Link>
                <Link href="/tim" onClick={() => setIsMobileMenuOpen(false)}>Team</Link>
                <Link href="/events" onClick={() => setIsMobileMenuOpen(false)}>Events</Link>
                <div className="flex flex-col items-center gap-2 mt-2 w-full">
                    <div className="flex items-center p-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 w-full justify-between">
                        <Link href="/portal" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 text-center px-4 py-3 text-slate-600 dark:text-slate-300 font-bold text-[10px] tracking-widest uppercase rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all">Portal ISO</Link>
                        <a href="#kontak" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 text-center px-4 py-3 bg-emerald-600 text-white font-bold text-[10px] rounded-full hover:bg-emerald-500 transition-all tracking-widest uppercase shadow-md">Join Us</a>
                    </div>
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="mt-2 text-slate-400 hover:text-emerald-600 transition p-2 bg-slate-50 dark:bg-slate-800 rounded-full" title="Admin Login"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></Link>
                </div>
            </nav>
        </div>
      </header>

      {/* HEADER SECTION (Mirip Events/Mitra) */}
      <section className="bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-20 px-4 md:px-12 lg:px-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
            <span className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-500/30">
                Katalog Lengkap
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg">
                Products & Portfolio
            </h1>
            <p className="text-slate-300 md:text-lg max-w-2xl mx-auto font-light">
                Eksplorasi modul pelatihan, layanan siap pakai, dan jejak keberhasilan kami mendampingi organisasi Anda mencapai standar tertinggi.
            </p>
        </div>
      </section>

      {/* KONTEN PRODUK (SEMUA) */}
      <main className="flex-grow py-16 px-4 md:px-12 lg:px-16 -mt-10 relative z-20">
        <div className="container mx-auto max-w-7xl">
            {products.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Katalog sedang dalam persiapan. Silakan kembali lagi nanti.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {products.map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col">
                            <div className="w-full h-48 md:h-60 bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                                <img src={p.imgUrl || 'https://placehold.co/600x400?text=No+Image'} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                {p.label && (
                                    <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm text-emerald-600 dark:text-emerald-400">
                                        {p.label}
                                    </span>
                                )}
                            </div>
                            <div className="p-6 md:p-8 flex flex-col flex-grow">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 leading-snug group-hover:text-emerald-600 transition-colors">{p.name}</h3>
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-4 mb-6 flex-grow font-light leading-relaxed">{p.desc}</p>
                                
                                <a 
                                    href={p.btnLink || `https://wa.me/${waNumber}?text=Halo%20tim%20Mahatma,%20saya%20tertarik%20dengan%20produk/portofolio%20*${p.name}*.%20Boleh%20minta%20info%20lebih%20lanjut?`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full text-center px-6 py-3.5 md:py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all duration-300 shadow-sm"
                                >
                                    {p.btnText || 'Tanya Project Ini'}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-950 pt-12 pb-6 md:pt-20 md:pb-10 px-4 md:px-12 lg:px-16 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300 mt-auto">
        {/* ... (Isi Footer sama persis, saya ringkas agar fokus ke konten utama, Anda bisa paste Footer standar Anda di sini jika perlu) ... */}
        <div className="container mx-auto max-w-7xl">
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