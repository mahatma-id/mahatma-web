"use client";
import { useEffect, useState, use } from 'react';
import { doc, getDoc, onSnapshot, collection, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

export default function LayananDetail({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [service, setService] = useState(null);
  const [subServices, setSubServices] = useState([]); // STATE BARU UNTUK SUB-LAYANAN
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState({});
  const [partners, setPartners] = useState([]); 
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => { 
        if(snap.exists()) setSettings(snap.data()); 
    });

    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => {
        setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Ambil detail layanan utama (Parent)
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

    // Ambil daftar Sub-Layanan berdasarkan ID Layanan Utama
    const subServicesQuery = query(collection(db, "subservices"), where("parentId", "==", id));
    const unsubSubServices = onSnapshot(subServicesQuery, snap => {
        // Karena orderBy tidak bisa dipakai bersamaan dengan where di Firebase tanpa index, kita sort manual di client
        const subs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        subs.sort((a, b) => b.createdAt - a.createdAt); 
        setSubServices(subs);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    return () => { 
        unsubSettings(); 
        unsubPartners();
        unsubSubServices();
        window.removeEventListener('scroll', handleScroll);
    };
  }, [id]);

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

  if (!service) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center px-4 transition-colors duration-300">
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-4">404</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6 md:mb-8 text-sm md:text-lg">Layanan tidak ditemukan.</p>
              <Link href="/#layanan" className="px-6 py-3 md:px-8 bg-emerald-600 text-white font-bold rounded-full text-[10px] md:text-xs tracking-widest uppercase hover:bg-emerald-700 transition">
                  Kembali ke Beranda
              </Link>
          </div>
      );
  }

  return (
    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 min-h-screen flex flex-col selection:bg-emerald-500 selection:text-white relative transition-colors duration-300">
      
      {/* HEADER DINAMIS */}
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
            <Link href="/#layanan" className="text-emerald-500 hover:-translate-y-1 transition-all">Service</Link>
            <Link href="/#tim" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Team</Link>
            <Link href="/#insight" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Insight</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <div className={isScrolled ? '' : 'text-white'}><ThemeToggle /></div>
            <Link href="/admin" className={`text-xs font-bold uppercase tracking-widest mr-4 transition ${isScrolled ? 'text-slate-400 hover:text-slate-800 dark:hover:text-white' : 'text-white/80 hover:text-white drop-shadow-md'}`}>Admin</Link>
            <Link href="/#kontak" className={`px-6 py-2.5 font-bold text-xs rounded-full hover:-translate-y-1 hover:shadow-lg transition-all tracking-widest uppercase ${isScrolled ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(0,0,0,0.3)]'}`}>
              Join Us
            </Link>
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

        {/* Mobile Menu */}
        <div className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 py-4 opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'}`}>
            <nav className="flex flex-col items-center gap-4 font-bold text-sm tracking-widest uppercase text-slate-600 dark:text-slate-300 px-4">
                <Link href="/tentang-kami" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">About Us</Link>
                <Link href="/#layanan" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Service</Link>
                <Link href="/#tim" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Team</Link>
                <Link href="/#insight" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Insight</Link>
                <div className="flex flex-col items-center gap-3 mt-2 w-full">
                    <Link href="/#kontak" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-4 py-3 bg-emerald-600 text-white font-bold text-xs rounded-full hover:bg-slate-900 transition-all tracking-widest uppercase">Join Us</Link>
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Login</Link>
                </div>
            </nav>
        </div>
      </header>

      {/* HEADER LAYANAN - Background Gelap */}
      <section className="bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-20 px-4 md:px-12 lg:px-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 md:-mr-20 md:-mt-20 w-40 h-40 md:w-80 md:h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto max-w-5xl text-center relative z-10">
            <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6 border border-emerald-500/30">
                Detail Layanan Utama
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6 drop-shadow-lg">
                {service.name}
            </h1>
        </div>
      </section>

      {/* KONTEN LAYANAN & SUB-LAYANAN */}
      <main className="flex-grow py-10 md:py-16 px-4 md:px-12 lg:px-16 -mt-10 md:-mt-12 relative z-20">
        <div className="container mx-auto max-w-6xl bg-white dark:bg-slate-900 p-6 md:p-12 lg:p-16 rounded-2xl md:rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
            
            {/* Bagian Deskripsi Utama */}
            <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 dark:bg-slate-800 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8 mx-auto transition-colors">
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6 transition-colors">Tentang Program Utama</h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm md:text-lg leading-relaxed md:leading-loose font-light whitespace-pre-line transition-colors">
                    {service.desc}
                </p>
            </div>

            {/* --- GRID KARTU SUB-LAYANAN --- */}
            {subServices.length > 0 && (
                <div className="mb-12 md:mb-20 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-center mb-10">
                        <span className="text-emerald-600 font-black tracking-widest uppercase text-[10px] md:text-xs mb-2 block">Pilihan Program</span>
                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">Sub-Kategori {service.name}</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {subServices.map(sub => (
                            <div key={sub.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col">
                                {sub.imgUrl ? (
                                    <div className="w-full h-40 md:h-52 overflow-hidden bg-slate-200 dark:bg-slate-800">
                                        <img src={sub.imgUrl} alt={sub.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                ) : (
                                    <div className="w-full h-2 bg-emerald-500"></div> // Garis warna jika tidak ada gambar
                                )}
                                <div className="p-6 md:p-8 flex flex-col flex-grow">
                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 transition-colors">{sub.title}</h3>
                                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed flex-grow font-light">
                                        {sub.desc}
                                    </p>
                                    <a 
                                        href={`https://wa.me/${waNumber}?text=Halo%20tim%20Mahatma,%20saya%20ingin%20info%20lebih%20lanjut%20tentang%20program%20*${sub.title}*%20(Kategori:%20${service.name}).`} 
                                        target="_blank" 
                                        className="inline-flex items-center text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest text-[10px] hover:text-orange-600 transition mt-auto"
                                    >
                                        Tanya Program Ini <span className="ml-2 transform group-hover:translate-x-2 transition-transform">→</span>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CALL TO ACTION UMUM */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-10 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 text-center transition-colors duration-300">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3">Butuh program yang disesuaikan?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-5 md:mb-6">Tim pakar kami siap mendiskusikan kebutuhan spesifik organisasi Anda.</p>
                <a 
                    href={`https://wa.me/${waNumber}?text=Halo%20tim%20Mahatma,%20saya%20tertarik%20untuk%20berdiskusi%20lebih%20lanjut%20mengenai%20layanan%20*${service.name}*.`} 
                    target="_blank" 
                    className="inline-block px-8 py-3.5 md:px-10 md:py-4 bg-emerald-600 text-white font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-emerald-500 hover:-translate-y-1 transition duration-300 shadow-md"
                >
                    Konsultasi via WhatsApp
                </a>
            </div>
            
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