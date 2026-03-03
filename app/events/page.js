"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

// --- FUNGSI PINTAR PENGHITUNG HARI OTOMATIS ---
function getEventsStatus(dateStr) {
    if (!dateStr) return null;
    
    // Kamus bulan bahasa Indonesia
    const months = {
        januari: 0, jan: 0, februari: 1, feb: 1, maret: 2, mar: 2,
        april: 3, apr: 3, mei: 4, juni: 5, jun: 5, juli: 6, jul: 6,
        agustus: 7, agu: 7, september: 8, sep: 8, oktober: 9, okt: 9,
        november: 10, nov: 10, desember: 11, des: 11
    };

    // Regex untuk menangkap format "15 Agustus 2026" atau "10-12 September 2026"
    const regex = /(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+([a-zA-Z]+)\s+(\d{4})/;
    const match = dateStr.match(regex);

    if (!match) return null;

    const startDay = parseInt(match[1]);
    const endDay = match[2] ? parseInt(match[2]) : startDay;
    const monthStr = match[3].toLowerCase();
    const year = parseInt(match[4]);

    if (months[monthStr] === undefined) return null;
    const month = months[monthStr];

    // Waktu hari ini (dinormalkan ke jam 00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(year, month, startDay);
    const endDate = new Date(year, month, endDay);

    // Hitung selisih hari
    const diffTimeStart = startDate.getTime() - today.getTime();
    const diffDaysStart = Math.ceil(diffTimeStart / (1000 * 60 * 60 * 24));
    
    const diffTimeEnd = endDate.getTime() - today.getTime();
    const diffDaysEnd = Math.ceil(diffTimeEnd / (1000 * 60 * 60 * 24));

    if (diffDaysStart > 0) {
        return { state: 'upcoming', text: `H-${diffDaysStart}`, color: 'bg-blue-600 text-white shadow-blue-500/50' };
    } else if (diffDaysStart <= 0 && diffDaysEnd >= 0) {
        return { state: 'ongoing', text: 'Sedang Berlangsung', color: 'bg-emerald-500 text-white animate-pulse shadow-emerald-500/50' };
    } else {
        return { state: 'completed', text: 'Sudah Selesai', color: 'bg-slate-700 text-white opacity-90' };
    }
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState({});
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
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

    // Ambil Data Events
    const unsubEvents = onSnapshot(query(collection(db, "events"), orderBy("createdAt", "desc")), snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    return () => { 
        unsubSettings(); 
        unsubPartners();
        unsubEvents(); 
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const rawPhone = settings.phone || "6285185639375";
  let waNumber = rawPhone.replace(/[^0-9]/g, '');
  if (waNumber.startsWith('0')) waNumber = '62' + waNumber.substring(1);

  // --- FUNGSI SHARE EVENTS ---
  const handleShare = async (eventsTitle) => {
    const shareData = {
        title: `Ikuti ${eventsTitle} di Mahatma Academy`,
        text: `Yuk ikuti events/pelatihan ${eventsTitle} bersama Mahatma Academy! Cek jadwal selengkapnya di sini:`,
        url: window.location.href, // Akan share link halaman events ini
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // Fallback untuk browser desktop yang tidak support navigator.share
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            alert("Link berhasil disalin ke clipboard!");
        }
    } catch (err) {
        console.log("Share dibatalkan atau error:", err);
    }
  };

  return (
    <div className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col transition-colors duration-300">
      
      {/* NAVBAR */}
      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-white dark:bg-slate-950 shadow-md border-b border-slate-100 dark:border-slate-800 py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-4 md:px-12 lg:px-16 flex justify-between items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-2 group z-50">
            {settings.logoUrl ? (
                <img src={mounted && ((!isScrolled && settings.logoDarkUrl) || (isScrolled && resolvedTheme === 'dark' && settings.logoDarkUrl)) ? settings.logoDarkUrl : settings.logoUrl} alt="Logo" className="h-10 md:h-14 w-auto aspect-[4/1] object-contain object-left transition-all duration-300" />
            ) : (
                <div className="flex flex-col md:flex-row md:items-center group-hover:text-emerald-600 transition-colors">
                    <span className={`font-extrabold text-base md:text-xl tracking-tight transition-colors ${isScrolled ? 'text-slate-900 dark:text-white' : 'text-white drop-shadow-md'}`}>Mahatma <span className="text-emerald-600">Academy</span></span>
                    <span className={`text-[7px] md:text-[10px] font-bold tracking-widest uppercase md:ml-2 mt-0.5 md:mt-0 ${isScrolled ? 'text-slate-500 dark:text-slate-400' : 'text-white/80 drop-shadow-md'}`}><span className="hidden md:inline">- </span>Driving Transformation</span>
                </div>
            )}
          </Link>
          <nav className={`hidden lg:flex items-center gap-10 font-bold text-xs tracking-widest uppercase transition-colors ${isScrolled ? 'text-slate-600 dark:text-slate-300' : 'text-white drop-shadow-md'}`}>
            <Link href="/tentang-kami" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">About Us</Link>
            <Link href="/#layanan" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Service</Link>
            <Link href="/#tim" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Team</Link>
            <Link href="/#insight" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Insight</Link>
            <Link href="/events" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Events</Link>
          </nav>
          
          <div className="hidden lg:flex items-center gap-4">
            <div className={isScrolled ? '' : 'text-white'}><ThemeToggle /></div>
            
            {/* UPDATE: Tombol Portal ISO & Join Us Dijejer */}
            <div className={`flex items-center p-1 rounded-full border transition-all duration-300 ${isScrolled ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-white/10 border-white/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.2)]'}`}>
                <Link href="/portal" className={`px-5 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full transition-all hover:bg-white hover:text-slate-900 ${isScrolled ? 'text-slate-600 dark:text-slate-300' : 'text-white'}`}>
                    Portal ISO
                </Link>
                <Link href="/#kontak" className="px-5 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-all">
                    Join Us
                </Link>
            </div>

            {/* UPDATE: Login Admin jadi Icon di ujung */}
            <Link href="/admin" title="Admin Panel" className={`p-2 rounded-full transition-all ${isScrolled ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800' : 'text-white/80 hover:text-white hover:bg-white/20'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
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
                <Link href="/#tim" onClick={() => setIsMobileMenuOpen(false)}>Team</Link>
                <Link href="/#insight" onClick={() => setIsMobileMenuOpen(false)}>Insight</Link>
                <Link href="/events" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-600">Events</Link>
                
                <div className="flex flex-col items-center gap-2 mt-2 w-full">
                    {/* UPDATE: Menu Mobile Menyesuaikan Desain */}
                    <Link href="/portal" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-bold text-xs rounded-full transition-all tracking-widest uppercase">Portal ISO</Link>
                    <Link href="/#kontak" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-4 py-3 bg-emerald-600 text-white font-bold text-xs rounded-full transition-all tracking-widest uppercase">Join Us</Link>
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> Admin</Link>
                </div>
            </nav>
        </div>
      </header>

      {/* HEADER SECTION */}
      <section className="bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-20 px-4 md:px-12 lg:px-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
            <span className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-500/30">
                Agenda Terdekat
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg">
                Jadwal Pelatihan
            </h1>
            <p className="text-slate-300 md:text-lg max-w-2xl mx-auto font-light">
                Tingkatkan kompetensi Anda dengan mengikuti berbagai program pelatihan eksklusif dari Mahatma Academy.
            </p>
        </div>
      </section>

      {/* KONTEN EVENTS */}
      <main className="flex-grow py-16 px-4 md:px-12 lg:px-16 -mt-10 relative z-20">
        <div className="container mx-auto max-w-7xl">
            {loading ? (
                <div className="text-center text-slate-400 animate-pulse font-bold tracking-widest mt-20 text-xs">MEMUAT JADWAL...</div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Belum ada jadwal pelatihan dalam waktu dekat.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {events.map(ev => {
                        const status = getEventsStatus(ev.date);

                        return (
                            <div key={ev.id} className={`bg-white dark:bg-slate-900 border ${status?.state === 'completed' ? 'border-slate-200 dark:border-slate-800 opacity-75' : 'border-slate-100 dark:border-slate-800'} rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col group relative`}>
                                
                                {/* Indikator Status Dinamis */}
                                {status && (
                                    <div className={`absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg shadow-lg text-[9px] md:text-[11px] font-black uppercase tracking-widest ${status.color}`}>
                                        {status.text}
                                    </div>
                                )}

                                <div className="relative h-48 md:h-60 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    {ev.imgUrl ? (
                                        <img src={ev.imgUrl} alt={ev.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${status?.state === 'completed' ? 'grayscale' : ''}`} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">Tanpa Banner</div>
                                    )}
                                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-900/90 to-transparent pt-10">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5 drop-shadow-md">Jadwal</span>
                                        <span className="text-sm font-bold text-white drop-shadow-md">{ev.date}</span>
                                    </div>
                                </div>
                                <div className="p-6 md:p-8 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-emerald-600 transition-colors">{ev.name}</h3>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
                                        📍 {ev.location}
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed line-clamp-3 font-light flex-grow">
                                        {ev.desc}
                                    </p>
                                    
                                    {/* BUTTON AREA (Daftar + Share) */}
                                    <div className="flex items-center gap-2 mt-auto">
                                        {/* LOGIKA TOMBOL UPDATE: Disable jika Completed ATAU Ongoing */}
                                        {status?.state === 'completed' ? (
                                            <div className="flex-grow block text-center px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-xl cursor-not-allowed border border-transparent">
                                                Events Berakhir
                                            </div>
                                        ) : status?.state === 'ongoing' ? (
                                            <div className="flex-grow block text-center px-6 py-3.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600/70 dark:text-emerald-500/70 font-bold text-[10px] uppercase tracking-widest rounded-xl cursor-not-allowed border border-emerald-500/30">
                                                Sedang Berlangsung
                                            </div>
                                        ) : (
                                            <a 
                                                href={`https://wa.me/${waNumber}?text=Halo%20tim%20Mahatma,%20saya%20tertarik%20mengikuti%20events%20*${ev.name}*%20pada%20${ev.date}.%20Mohon%20info%20pendaftarannya.`} 
                                                target="_blank" 
                                                className="flex-grow block text-center px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-slate-900 dark:text-white hover:text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 shadow-sm"
                                            >
                                                Daftar Sekarang
                                            </a>
                                        )}

                                        {/* TOMBOL SHARE */}
                                        <button 
                                            onClick={() => handleShare(ev.name)}
                                            title="Bagikan Events"
                                            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-slate-600 dark:text-slate-400 hover:text-emerald-600 rounded-xl transition-colors duration-300 border border-transparent shadow-sm"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
      </main>

      {/* FOOTER */}
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