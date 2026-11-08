"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
      
      {/* GLOBAL NAVBAR */}
      <Navbar />

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
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            📍 {ev.location}
                                        </p>
                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            {ev.pricingType === 'tiered'
                                                ? 'Internal & Eksternal'
                                                : ev.pricingType === 'voluntary'
                                                ? 'Sistem Ikhlas'
                                                : ev.htmPrice > 0
                                                ? `Rp ${ev.htmPrice.toLocaleString('id-ID')}`
                                                : 'Gratis'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed line-clamp-3 font-light flex-grow">
                                        {ev.desc}
                                    </p>
                                    
                                    {/* BUTTON AREA (Daftar + Share) */}
                                    <div className="flex items-center gap-2 mt-auto">
                                        {/* LOGIKA TOMBOL UPDATE: Disable jika Completed ATAU Ongoing, arahkan ke link Form jika isRegistration === true */}
                                        {status?.state === 'completed' ? (
                                            <div className="flex-grow block text-center px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-xl cursor-not-allowed border border-transparent">
                                                Events Berakhir
                                            </div>
                                        ) : status?.state === 'ongoing' ? (
                                            <div className="flex-grow block text-center px-6 py-3.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600/70 dark:text-emerald-500/70 font-bold text-[10px] uppercase tracking-widest rounded-xl cursor-not-allowed border border-emerald-500/30">
                                                Sedang Berlangsung
                                            </div>
                                        ) : ev.isRegistration ? (
                                            <Link 
                                                href={`/events/${ev.id}`} 
                                                className="flex-grow block text-center px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-slate-900 dark:text-white hover:text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all duration-300 shadow-sm"
                                            >
                                                Daftar Sekarang
                                            </Link>
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

      {/* GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}