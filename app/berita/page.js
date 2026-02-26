"use client";
import { useEffect, useState, Suspense } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

// Komponen Isi Berita (Dibungkus agar useSearchParams aman dari error server Next.js)
function BeritaContent() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState(''); 
  const [visibleCount, setVisibleCount] = useState(6); 
  
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get('tag');

  // Menangkap jika ada yang klik hashtag dari halaman lain
  useEffect(() => {
    if (tagFromUrl) {
        setSearchQuery(tagFromUrl);
    }
  }, [tagFromUrl]);

  useEffect(() => {
    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => {
        const allFetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // HANYA MENAMPILKAN BERITA YANG STATUSNYA BUKAN DRAF
        setPosts(allFetched.filter(p => !p.isDraft)); 
        setLoading(false);
    });
    return () => unsubPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
      const matchCategory = filter === 'Semua' ? true : post.category === filter;
      const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (post.tags && post.tags.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
  });

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  if (loading) return (
    <div className="py-20 flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-white dark:bg-slate-900 p-4 rounded-2xl md:rounded-full shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar justify-center md:justify-start">
                {['Semua', 'News', 'Opini'].map(f => (
                    <button 
                        key={f} 
                        onClick={() => {setFilter(f); setVisibleCount(6);}} 
                        className={`whitespace-nowrap px-5 py-2 md:px-6 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-emerald-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div className="relative w-full md:w-80">
                <input 
                    type="text" 
                    placeholder="Cari berita atau tag..." 
                    value={searchQuery}
                    onChange={(e) => {setSearchQuery(e.target.value); setVisibleCount(6);}}
                    className="w-full pl-10 pr-4 py-2.5 md:py-3 rounded-full border border-slate-200 dark:border-slate-700 text-xs md:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
                <svg className="w-4 h-4 md:w-5 md:h-5 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {visiblePosts.map(post => {
                let dStr = ""; if(post.createdAt) dStr = post.createdAt.toDate().toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' });
                return (
                <Link href={`/berita/${post.id}`} key={post.id} className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-3 md:p-4 hover:shadow-xl dark:hover:shadow-emerald-900/20 hover:-translate-y-2 transition-all duration-500 border border-slate-100 dark:border-slate-800">
                    <div className="w-full h-48 md:h-56 bg-slate-200 dark:bg-slate-800 rounded-xl md:rounded-2xl overflow-hidden mb-4 relative">
                        <img src={post.coverUrl || 'https://placehold.co/600x400'} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
                        <span className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-full shadow-sm text-slate-900 dark:text-white">{post.category}</span>
                    </div>
                    <div className="px-2 flex-1 flex flex-col">
                        <h3 className="text-base md:text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 transition leading-snug line-clamp-3">{post.title}</h3>
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">{dStr} &bull; {post.author || 'Admin'}</p>
                    </div>
                </Link>
            )})}
        </div>

        {visiblePosts.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 mt-6 transition-colors duration-300">
                <span className="text-4xl mb-4 block">🔍</span>
                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg">Tidak ada berita yang cocok dengan <strong>"{searchQuery}"</strong>.</p>
            </div>
        )}

        {filteredPosts.length > visibleCount && (
            <div className="text-center mt-10 md:mt-14">
                <button 
                    onClick={() => setVisibleCount(prev => prev + 6)} 
                    className="px-8 py-3.5 md:px-10 md:py-4 bg-emerald-600 text-white font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-full hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 hover:-translate-y-1 transition-all duration-300 shadow-lg"
                >
                    Muat Lebih Banyak &darr;
                </button>
            </div>
        )}
    </>
  );
}

// Kerangka Utama Halaman
export default function SemuaBeritaPage() {
  const [settings, setSettings] = useState({});
  const [partners, setPartners] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Ambil Data Pengaturan & Partners untuk Footer
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
      if(snap.exists()) setSettings(snap.data());
    });
    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => {
        setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubSettings(); unsubPartners(); };
  }, []);

  const rawPhone = settings.phone || "6285185639375";
  let waNumber = rawPhone.replace(/[^0-9]/g, '');
  if (waNumber.startsWith('0')) waNumber = '62' + waNumber.substring(1);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-200 selection:bg-emerald-500 selection:text-white flex flex-col transition-colors duration-300">
      
      {/* HEADER SOLID (Sama navigasinya dengan Home, tapi background solid) */}
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
            <Link href="/#layanan" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Service</Link>
            <Link href="/tentang-kami" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">About Us</Link>
            <Link href="/#tim" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Our Team</Link>
            <Link href="/#insight" className="text-emerald-500 hover:-translate-y-1 transition-all">Insight</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/admin" className="text-xs font-bold text-slate-400 hover:text-slate-800 dark:hover:text-white uppercase tracking-widest mr-4 transition">Admin</Link>
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
        <div className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 py-4 opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'}`}>
            <nav className="flex flex-col items-center gap-4 font-bold text-sm tracking-widest uppercase text-slate-600 dark:text-slate-300 px-4">
                <Link href="/#layanan" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Service</Link>
                <Link href="/tentang-kami" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">About Us</Link>
                <Link href="/#tim" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Our Team</Link>
                <Link href="/#insight" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Insight</Link>
                <div className="flex flex-col items-center gap-3 mt-2 w-full">
                    <Link href="/#kontak" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-4 py-3 bg-emerald-600 text-white font-bold text-xs rounded-full hover:bg-slate-900 transition-all tracking-widest uppercase">Join Us</Link>
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Login</Link>
                </div>
            </nav>
        </div>
      </header>

      {/* KONTEN ARSIP BERITA */}
      <main className="flex-grow container mx-auto px-4 md:px-12 lg:px-16 py-10 md:py-16 max-w-7xl">
        <div className="text-center mb-10 md:mb-14">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-3 md:mb-4">Wawasan & Perspektif</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg">Temukan artikel, berita terbaru, dan pandangan pakar kami.</p>
        </div>

        {/* Suspense digunakan agar website tidak error saat mendeteksi parameter URL (?tag=) */}
        <Suspense fallback={<div className="py-20 text-center text-slate-400 animate-pulse font-bold tracking-widest text-xs">MEMUAT KONTEN...</div>}>
            <BeritaContent />
        </Suspense>
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