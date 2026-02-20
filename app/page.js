"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function Home() {
  const [settings, setSettings] = useState({});
  const [sliders, setSliders] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [posts, setPosts] = useState([]);
  const [services, setServices] = useState([]);

  // FETCH SEMUA DATA DINAMIS DARI FIREBASE
  useEffect(() => {
    // 1. Fetch Pengaturan Umum (Teks & Logo)
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
        if(snap.exists()) setSettings(snap.data());
    });
    // 2. Fetch Sliders
    const unsubSliders = onSnapshot(query(collection(db, "sliders"), orderBy("createdAt", "asc")), snap => {
        setSliders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    // 3. Fetch Berita
    const unsubPost = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(3)), snap => {
        setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    // 4. Fetch Layanan
    const unsubService = onSnapshot(query(collection(db, "services"), orderBy("createdAt", "desc")), snap => {
        setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubSettings(); unsubSliders(); unsubPost(); unsubService(); };
  }, []);

  // LOGIKA AUTO-SLIDER (Berpindah otomatis tiap 5 detik)
  useEffect(() => {
      if (sliders.length <= 1) return;
      const interval = setInterval(() => {
          setCurrentSlide(prev => (prev + 1) % sliders.length);
      }, 5000);
      return () => clearInterval(interval);
  }, [sliders.length]);

  return (
    <div className="font-sans text-slate-800 bg-white overflow-x-hidden selection:bg-orange-500 selection:text-white">
      
      {/* NAVBAR */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 transition-all">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-2 group">
            {/* Logo Dinamis */}
            {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-10 object-contain group-hover:scale-105 transition-transform" />
            ) : (
                <span className="font-extrabold text-2xl tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                    Mahatma<span className="text-orange-600">.id</span>
                </span>
            )}
          </Link>
          <nav className="hidden lg:flex items-center gap-10 font-bold text-sm tracking-widest uppercase text-slate-600">
            <a href="#layanan" className="hover:text-orange-600 hover:-translate-y-1 transition-all">What We Do</a>
            <a href="#prioritas" className="hover:text-orange-600 hover:-translate-y-1 transition-all">Priorities</a>
            <a href="#insight" className="hover:text-orange-600 hover:-translate-y-1 transition-all">Insight</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hidden md:block text-xs font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest mr-4 transition">Admin</Link>
            <a href="#kontak" className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-full hover:bg-orange-600 hover:-translate-y-1 hover:shadow-lg transition-all tracking-widest uppercase">
              Join Us
            </a>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION (SLIDER DINAMIS) */}
      <section className="relative min-h-[90vh] bg-slate-900 overflow-hidden flex items-center justify-center">
        {sliders.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white"><p className="animate-pulse">Menyiapkan Visual...</p></div>
        ) : (
            sliders.map((slide, index) => (
                <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img src={slide.imageUrl} className="w-full h-full object-cover transform scale-105 animate-[kenburns_20s_ease-out_infinite]" alt="Hero Background"/>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                    
                    <div className="relative z-20 flex flex-col justify-center h-full px-6 max-w-7xl mx-auto">
                        <div className="max-w-3xl transform transition-all duration-1000 translate-y-0 opacity-100">
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[1.1] mb-6 drop-shadow-2xl">
                                {slide.title}
                            </h1>
                            <p className="text-lg md:text-2xl text-gray-200 mb-10 leading-relaxed font-light drop-shadow-md">
                                {slide.subtitle}
                            </p>
                            {slide.btnText && (
                                <a href={slide.btnLink || '#'} className="inline-block px-10 py-4 bg-orange-600 text-white font-extrabold rounded-full hover:bg-orange-500 hover:scale-105 hover:shadow-[0_10px_40px_rgba(234,88,12,0.4)] transition-all duration-300 uppercase tracking-widest text-sm">
                                    {slide.btnText}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))
        )}
        
        {/* Titik Navigasi Slider */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {sliders.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-2 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-10 bg-orange-500' : 'w-2 bg-white/50 hover:bg-white'}`}></button>
            ))}
        </div>
      </section>

      {/* 2. OUR MISSION (TEKS DINAMIS) */}
      <section className="py-24 bg-white text-center px-4 border-b border-slate-100">
        <div className="container mx-auto max-w-4xl">
            <span className="text-orange-600 font-bold tracking-widest uppercase text-sm mb-4 block animate-bounce">Our Mission</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">
                {settings.missionTitle || "Solusi Terintegrasi Untuk Bisnis Anda."}
            </h2>
            <p className="text-xl text-slate-500 leading-relaxed mb-12 font-light">
                {settings.missionDesc || "Kami memiliki misi untuk mendorong perubahan berkelanjutan dengan memberdayakan individu dan organisasi."}
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 font-extrabold text-xl md:text-2xl text-slate-800 uppercase tracking-widest">
                <div className="flex flex-col items-center hover:scale-110 transition-transform cursor-default"><span className="text-orange-500 text-5xl mb-3 drop-shadow-md">🌍</span> People</div>
                <div className="flex flex-col items-center hover:scale-110 transition-transform cursor-default"><span className="text-orange-500 text-5xl mb-3 drop-shadow-md">🌱</span> Planet</div>
                <div className="flex flex-col items-center hover:scale-110 transition-transform cursor-default"><span className="text-orange-500 text-5xl mb-3 drop-shadow-md">🚀</span> Progress</div>
            </div>
        </div>
      </section>

      {/* 3. OUR SERVICE (TEKS & ITEM DINAMIS) */}
      <section id="layanan" className="py-24 bg-slate-50 px-4">
        <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                <div className="max-w-2xl">
                    <span className="text-orange-600 font-bold tracking-widest uppercase text-sm mb-4 block">Our Service</span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                        {settings.serviceTitle || "Layanan Terbaik Untuk Anda."}
                    </h2>
                    <p className="text-slate-600 text-lg leading-relaxed font-light">
                        {settings.serviceDesc || "Jelajahi layanan konsultasi dan pelatihan kami yang dirancang untuk mengkatalisasi pertumbuhan."}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map(svc => (
                    <div key={svc.id} className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col h-full cursor-pointer">
                        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900 mb-4 group-hover:text-orange-600 transition-colors">{svc.name}</h3>
                        <p className="text-slate-500 mb-10 line-clamp-3 leading-relaxed flex-grow font-light">{svc.desc}</p>
                        <a href={svc.link} target="_blank" className="inline-flex items-center font-bold text-slate-900 uppercase tracking-widest text-xs group-hover:text-orange-600 transition mt-auto">
                            Eksplorasi <span className="ml-2 text-lg leading-none transform group-hover:translate-x-3 transition-transform">→</span>
                        </a>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 4. OUR INSIGHT (BLOG DINAMIS) */}
      <section id="insight" className="py-24 md:py-32 bg-white px-4">
        <div className="container mx-auto max-w-7xl">
            <div className="mb-16">
                <span className="text-orange-600 font-bold tracking-widest uppercase text-sm mb-4 block">Our Insight</span>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">Wawasan & Perspektif Terbaru</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {posts.map(post => {
                    let dStr = "";
                    if(post.createdAt) dStr = post.createdAt.toDate().toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' });
                    
                    return (
                    <Link href={`/berita/${post.id}`} key={post.id} className="group flex flex-col cursor-pointer bg-slate-50 rounded-[2rem] p-4 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-slate-100">
                        <div className="w-full h-64 bg-slate-200 rounded-3xl overflow-hidden mb-6 relative">
                            <img src={post.coverUrl || 'https://placehold.co/600x400'} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
                            <span className="absolute top-4 left-4 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full shadow-md text-slate-900">{post.category}</span>
                        </div>
                        <div className="px-4 pb-4 flex-1 flex flex-col">
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-4 group-hover:text-orange-600 transition leading-[1.3]">{post.title}</h3>
                            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-auto pt-4 border-t border-slate-200">{dStr} <span className="mx-2 text-orange-300">•</span> {post.author || 'Admin'}</p>
                        </div>
                    </Link>
                )})}
            </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-12 text-center text-slate-500 text-sm font-bold tracking-widest uppercase border-t-[10px] border-orange-600">
          <p>&copy; 2026 Mahatma.id - Navigating Digital Future.</p>
      </footer>

    </div>
  );
}