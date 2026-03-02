"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle'; 
import { useTheme } from 'next-themes';

export default function Home() {
  const [settings, setSettings] = useState({});
  const [sliders, setSliders] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [posts, setPosts] = useState([]);
  const [services, setServices] = useState([]);
  
  const [partners, setPartners] = useState([]);
  const [teams, setTeams] = useState([]);
  
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => { setOpenFaq(openFaq === index ? null : index); };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // State baru untuk deteksi scroll

  useEffect(() => {
    setMounted(true);

    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => { if(snap.exists()) setSettings(snap.data()); });
    const unsubSliders = onSnapshot(query(collection(db, "sliders"), orderBy("createdAt", "asc")), snap => { setSliders(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    
    const unsubPost = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(10)), snap => { 
        const allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const publishedPosts = allPosts.filter(p => !p.isDraft).slice(0,3);
        setPosts(publishedPosts); 
    });
    
    const unsubService = onSnapshot(query(collection(db, "services"), orderBy("createdAt", "desc")), snap => { setServices(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => { setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "asc")), snap => { setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubTestimonials = onSnapshot(query(collection(db, "testimonials"), orderBy("createdAt", "desc")), snap => { setTestimonials(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubFaqs = onSnapshot(query(collection(db, "faqs"), orderBy("createdAt", "asc")), snap => { setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });

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
        unsubSettings(); unsubSliders(); unsubPost(); unsubService(); unsubPartners(); unsubTeams(); unsubTestimonials(); unsubFaqs(); 
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // DURASI SLIDER HERO: 5 Detik
  useEffect(() => {
      if (sliders.length <= 1) return;
      const interval = setInterval(() => { setCurrentSlide(prev => (prev + 1) % sliders.length); }, 5000);
      return () => clearInterval(interval);
  }, [sliders.length]);

  const rawPhone = settings.phone || "6285185639375";
  let waNumber = rawPhone.replace(/[^0-9]/g, '');
  if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.substring(1);
  }

  // LIMIT TAMPILAN TIM (HANYA 4 PERTAMA)
  const displayedTeams = teams.slice(0, 4);

  return (
    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 overflow-x-hidden selection:bg-emerald-500 selection:text-white relative transition-colors duration-300">

      {/* HEADER DIPERBARUI: Posisi absolute, transparan saat di atas, solid saat discroll */}
      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-white dark:bg-slate-950 shadow-md border-b border-slate-100 dark:border-slate-800 py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-4 md:px-12 lg:px-16 flex justify-between items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-2 group z-50">
            {/* LOGIKA LOGO DIPERBARUI: Jika belum scroll (transparan), paksa pakai logoDark (putih). Jika sudah scroll, ikuti tema */}
            {settings.logoUrl ? (
                <img 
                    src={mounted && ( (!isScrolled && settings.logoDarkUrl) || (resolvedTheme === 'dark' && settings.logoDarkUrl) ) ? settings.logoDarkUrl : settings.logoUrl} 
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

          {/* Navigasi Desktop */}
          <nav className={`hidden lg:flex items-center gap-10 font-bold text-xs tracking-widest uppercase transition-colors ${isScrolled ? 'text-slate-600 dark:text-slate-300' : 'text-white drop-shadow-md'}`}>
            <a href="#layanan" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Service</a>
            <Link href="/tentang-kami" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">About Us</Link>
            <a href="#tim" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Our Team</a>
            <a href="#insight" className="hover:text-emerald-500 hover:-translate-y-1 transition-all">Insight</a>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <div className={isScrolled ? '' : 'text-white'}>
                 <ThemeToggle />
            </div>
            <Link href="/admin" className={`text-xs font-bold uppercase tracking-widest mr-4 transition ${isScrolled ? 'text-slate-400 hover:text-slate-800 dark:hover:text-white' : 'text-white/80 hover:text-white drop-shadow-md'}`}>Admin</Link>
            <a href="#kontak" className={`px-6 py-2.5 font-bold text-xs rounded-full hover:-translate-y-1 hover:shadow-lg transition-all tracking-widest uppercase ${isScrolled ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(0,0,0,0.3)]'}`}>
              Join Us
            </a>
          </div>

          <div className="lg:hidden flex items-center gap-3 z-50">
            <div className={isScrolled || isMobileMenuOpen ? '' : 'text-white'}>
                <ThemeToggle />
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`focus:outline-none p-2 ${isScrolled || isMobileMenuOpen ? 'text-slate-900 dark:text-white' : 'text-white drop-shadow-md'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />}
                </svg>
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        <div className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 py-4 opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'}`}>
            <nav className="flex flex-col items-center gap-4 font-bold text-sm tracking-widest uppercase text-slate-600 dark:text-slate-300 px-4">
                <a href="#layanan" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Service</a>
                <Link href="/tentang-kami" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">About Us</Link>
                <a href="#tim" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Our Team</a>
                <a href="#insight" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Insight</a>
                
                <div className="flex flex-col items-center gap-3 mt-2 w-full">
                    <a href="#kontak" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-4 py-3 bg-emerald-600 text-white font-bold text-xs rounded-full hover:bg-slate-900 transition-all tracking-widest uppercase">Join Us</a>
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Login</Link>
                </div>
            </nav>
        </div>
      </header>

      {/* 1. HERO SECTION - Tinggi diubah jadi 100vh agar penuh */}
      <section className="relative h-screen bg-slate-900 overflow-hidden">
        {sliders.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-50">
                {settings.logoDarkUrl || settings.logoUrl ? (
                    <img 
                        src={settings.logoDarkUrl || settings.logoUrl} 
                        alt="Loading..." 
                        className="h-12 md:h-16 w-auto object-contain animate-pulse mb-6 drop-shadow-lg" 
                    />
                ) : (
                    <span className="font-extrabold text-2xl md:text-3xl tracking-tight animate-pulse mb-6 text-emerald-500">
                        Mahatma <span className="text-white">Academy</span>
                    </span>
                )}
                {/* Animasi titik loading tambahan di bawah logo */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[ping_1.5s_infinite]"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-[ping_1.5s_infinite_200ms]"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[ping_1.5s_infinite_400ms]"></div>
                </div>
            </div>
        ) : (
            sliders.map((slide, index) => (
                <div key={slide.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'}`}>
                    
                    <div className="absolute inset-0 z-0">
                        <img src={slide.imageUrl} className="w-full h-full object-cover object-center transform scale-105 animate-[kenburns_20s_ease-out_infinite]" alt="Hero Background"/>
                        {/* Gradient dari atas agar teks logo tetap terbaca jika header transparan */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
                    </div>
                    
                    {/* Padding atas ditambah agar konten tidak tertutup header transparan */}
                    <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center px-4 md:px-12 lg:px-16 pt-20">
                        <div className="max-w-5xl mx-auto flex flex-col items-center">
                            {slide.tagline && (
                                <span className="text-yellow-400 font-bold tracking-widest uppercase text-sm md:text-lg mb-4 block drop-shadow-md">
                                    {slide.tagline}
                                </span>
                            )}
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-tight md:leading-[1.2] mb-4 md:mb-6 drop-shadow-2xl">
                                {slide.title || "Driving Change, Navigating Sustainable Future"}
                            </h1>
                            {slide.subtitle && (
                                <p className="text-sm sm:text-base md:text-xl text-gray-200 mb-8 md:mb-10 leading-relaxed font-light drop-shadow-md max-w-3xl px-2">
                                    {slide.subtitle}
                                </p>
                            )}
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 w-full px-4">
                                {(slide.btn1Text || slide.btnText) && (
                                    <a href={slide.btn1Link || slide.btnLink || '#'} className="w-full sm:w-auto px-8 py-3.5 md:px-10 md:py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-slate-900 transition-all duration-300 uppercase tracking-widest text-[10px] md:text-xs shadow-lg">
                                        {slide.btn1Text || slide.btnText}
                                    </a>
                                )}
                                {slide.btn2Text && (
                                    <a href={slide.btn2Link || '#'} className="w-full sm:w-auto px-8 py-3.5 md:px-10 md:py-4 bg-emerald-600 border-2 border-emerald-600 text-white font-bold rounded-full hover:bg-emerald-500 hover:border-emerald-500 hover:scale-105 transition-all duration-300 uppercase tracking-widest text-[10px] md:text-xs shadow-lg">
                                        {slide.btn2Text}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            ))
        )}
        
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2 md:gap-3">
            {sliders.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1 md:h-1.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-6 md:w-8 bg-emerald-500' : 'w-2 bg-white/50 hover:bg-white'}`}></button>
            ))}
        </div>
      </section>

      {/* 2. OUR MISSION */}
      <section className="py-12 md:py-24 bg-slate-50 dark:bg-slate-900 px-4 md:px-12 lg:px-16 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
                
                <div className="w-full lg:w-5/12">
                    {settings.missionImageUrl ? (
                        <div className="relative w-full aspect-[3/4] md:aspect-square lg:aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl group">
                            <img 
                                src={settings.missionImageUrl} 
                                alt="Our Mission" 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                        </div>
                    ) : (
                        <div className="w-full aspect-square rounded-3xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            No Mission Image
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-7/12 flex flex-col">
                    
                    <div className="text-left mb-10">
                        <span className="text-emerald-600 font-black tracking-widest uppercase text-[12px] md:text-sm mb-3 block">Our Mission</span>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                            {settings.missionTitle || "Integrated Solution for Your Needs"}
                        </h2>
                    </div>

                    <div className="relative w-full h-[450px]">
                        {[1, 2, 3, 4].map((num, idx) => {
                            const desc = settings[`mission${num}Desc`];
                            if (!desc) return null; 
                            
                            const positions = [
                                "top-0 left-0 z-40 transform hover:scale-105 hover:-translate-y-2 hover:z-50 shadow-xl",
                                "top-12 left-4 md:left-8 z-30 transform rotate-1 hover:rotate-0 hover:scale-105 hover:-translate-y-2 hover:z-50 shadow-lg",
                                "top-24 left-8 md:left-16 z-20 transform -rotate-1 hover:rotate-0 hover:scale-105 hover:-translate-y-2 hover:z-50 shadow-md",
                                "top-36 left-12 md:left-24 z-10 transform rotate-1 hover:rotate-0 hover:scale-105 hover:-translate-y-2 hover:z-50 shadow-sm"
                            ];

                            return (
                                <div key={num} className={`absolute w-full max-w-md bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700 transition-all duration-500 cursor-pointer ${positions[idx]}`}>
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-100 dark:bg-slate-700 group-hover:bg-emerald-500 transition-colors"></div>
                                    <div className="flex items-start gap-4">
                                        <span className="text-3xl md:text-4xl font-black text-emerald-100 dark:text-slate-700">0{num}</span>
                                        <p className="text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed font-semibold">
                                            {desc}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                </div>

            </div>
        </div>
      </section>

      {/* 3. OUR SERVICE */}
      <section id="layanan" className="py-12 md:py-24 bg-white dark:bg-slate-950 px-4 md:px-12 lg:px-16 transition-colors duration-300">
        <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-12 mb-10 md:mb-16">
                <div className="lg:w-1/2 text-center lg:text-left">
                    <span className="text-emerald-600 font-black tracking-widest uppercase text-[12px] md:text-sm mb-3 block">Our Services</span>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-4 md:mb-6 leading-tight">{settings.serviceTitle || "Layanan Terbaik Untuk Anda."}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed font-light">{settings.serviceDesc || "Jelajahi layanan konsultasi dan pelatihan kami yang dirancang untuk mengkatalisasi pertumbuhan."}</p>
                </div>
                {settings.serviceImageUrl && (
                    <div className="lg:w-1/2 w-full mt-2 lg:mt-0">
                        <img src={settings.serviceImageUrl} alt="Our Services" className="w-full h-40 md:h-80 object-cover rounded-2xl md:rounded-[2rem] shadow-md md:shadow-xl dark:opacity-90" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {services.map(svc => (
                    <div key={svc.id} className="relative overflow-hidden p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group flex flex-col h-full cursor-pointer">
                        {svc.imgUrl ? (
                            <>
                                <img src={svc.imgUrl} alt={svc.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-0" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/50 z-10 transition-opacity group-hover:opacity-90"></div>
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 z-0 transition-colors"></div>
                        )}
                        <div className="relative z-20 flex flex-col h-full">
                            <div className={`w-10 h-10 md:w-14 md:h-14 shadow-sm rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:rotate-12 transition-all duration-500 ${svc.imgUrl ? 'bg-white/20 backdrop-blur-md text-white group-hover:bg-emerald-600' : 'bg-white dark:bg-slate-800 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                                <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <h3 className={`text-base md:text-xl font-bold mb-2 md:mb-4 transition-colors ${svc.imgUrl ? 'text-white group-hover:text-yellow-400' : 'text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-500'}`}>{svc.name}</h3>
                            <p className={`text-xs md:text-sm mb-4 md:mb-8 line-clamp-3 md:line-clamp-4 leading-relaxed flex-grow font-light ${svc.imgUrl ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>{svc.desc}</p>
                            <Link href={`/layanan/${svc.id}`} className={`inline-flex items-center font-bold uppercase tracking-widest text-[9px] md:text-xs transition mt-auto ${svc.imgUrl ? 'text-white hover:text-yellow-400' : 'text-slate-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-500'}`}>Read more <span className="ml-2 text-sm md:text-base leading-none transform group-hover:translate-x-2 transition-transform">→</span></Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 4. TIM PAKAR (GRID JEJER 4) */}
      {teams.length > 0 && (
          <section id="tim" className="py-12 md:py-20 bg-slate-900 dark:bg-slate-950 text-white px-4 md:px-12 lg:px-16 border-t border-slate-800 transition-colors duration-300">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-8 md:mb-12">
                    <span className="text-emerald-500 font-black tracking-widest uppercase text-[12px] md:text-sm mb-3 block">Our Team</span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 md:mb-4"></h2>
                </div>

                <div className="grid grid-cols-4 gap-2 md:gap-6">
                    {displayedTeams.map((member) => (
                        <div key={member.id} className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-800 dark:bg-slate-900 aspect-[3/4]">
                            <img src={member.img} alt={member.name} className="w-full h-full object-cover object-center group-hover:scale-110 group-hover:opacity-60 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 dark:from-slate-950 via-slate-900/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-2 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 w-full text-center">
                                <h3 className="text-[10px] md:text-lg font-bold mb-0.5 md:mb-1 text-white leading-tight">{member.name}</h3>
                                <p className="text-yellow-400 text-[8px] md:text-[10px] font-bold tracking-widest uppercase line-clamp-1">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {teams.length > 4 && (
                    <div className="mt-8 md:mt-12 text-center">
                        <Link href="/tim" className="inline-block px-8 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-500 transition shadow-lg text-xs md:text-sm uppercase tracking-widest">
                            See More →
                        </Link>
                    </div>
                )}
            </div>
          </section>
      )}

      {/* 5. OUR INSIGHT (BLOG) */}
      <section id="insight" className="py-12 md:py-20 bg-white dark:bg-slate-950 px-4 md:px-12 lg:px-16 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto max-w-7xl">
            <div className="mb-8 md:mb-12 text-center md:text-left">
                <span className="text-emerald-600 font-black tracking-widest uppercase text-[12px] md:text-sm mb-3 block">Our Insight</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 leading-tight"></h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {posts.map(post => {
                    let dStr = "";
                    if(post.createdAt) dStr = post.createdAt.toDate().toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' });
                    
                    return (
                    <Link href={`/berita/${post.id}`} key={post.id} className="group flex flex-col cursor-pointer bg-slate-50 dark:bg-slate-900 rounded-2xl md:rounded-3xl p-3 md:p-4 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl dark:hover:shadow-slate-900/50 hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                        <div className="w-full h-40 md:h-60 bg-slate-200 dark:bg-slate-800 rounded-xl md:rounded-2xl overflow-hidden mb-3 md:mb-5 relative">
                            <img src={post.coverUrl || 'https://placehold.co/600x400'} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 dark:opacity-90"/>
                            <span className="absolute top-3 left-3 bg-white dark:bg-slate-900 px-2 py-1 text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md text-slate-900 dark:text-white">{post.category}</span>
                        </div>
                        <div className="px-1 md:px-3 pb-1 flex-1 flex flex-col">
                            <h3 className="text-sm md:text-2xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition leading-snug line-clamp-2">{post.title}</h3>
                            <p className="text-[8px] md:text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase mt-auto pt-3 md:pt-4 border-t border-slate-200 dark:border-slate-700">{dStr} <span className="mx-1 md:mx-2 text-yellow-500 dark:text-yellow-600">•</span> {post.author || 'Admin'}</p>
                        </div>
                    </Link>
                )})}
            </div>

            <div className="mt-10 md:mt-14 text-center">
                <Link href="/berita" className="inline-block px-8 py-3.5 md:px-10 md:py-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white transition duration-300 shadow-sm border border-slate-200 dark:border-slate-800">
                    Lihat Semua Berita →
                </Link>
            </div>
        </div>
      </section>

      {/* 6. TESTIMONI */}
      {testimonials.length > 0 && (
          <section className="py-12 md:py-20 bg-slate-50 dark:bg-slate-900 px-4 md:px-12 lg:px-16 overflow-hidden transition-colors duration-300">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-8 md:mb-12">
                    <span className="text-emerald-600 font-black tracking-widest uppercase text-[12px] md:text-sm mb-3 block">Testimonials</span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-2 md:mb-4">Apa Kata Mereka Tentang Kami</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                    {testimonials.map(testi => (
                        <div key={testi.id} className="bg-white dark:bg-slate-950 p-5 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative group hover:-translate-y-2 transition-all duration-300">
                            <span className="absolute top-2 right-4 md:top-4 md:right-6 text-3xl md:text-5xl text-slate-100 dark:text-slate-800 font-serif group-hover:text-yellow-100 dark:group-hover:text-yellow-900 transition-colors">"</span>
                            <p className="text-slate-600 dark:text-slate-400 text-xs md:text-base italic leading-relaxed mb-4 md:mb-8 relative z-10">{testi.text}</p>
                            <div className="flex items-center gap-3 md:gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 md:pt-6">
                                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex justify-center items-center font-bold text-xs md:text-base">{testi.name[0]}</div>
                                <div><h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-base">{testi.name}</h4><p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 line-clamp-1">{testi.company}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* 7. FAQ */}
      {faqs.length > 0 && (
          <section className="py-12 md:py-20 bg-white dark:bg-slate-950 px-4 md:px-12 lg:px-16 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-8 md:mb-12">
                    <span className="text-emerald-600 font-black tracking-widest uppercase text-[30px] md:text-sm mb-3 block">FAQ</span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-2 md:mb-4"></h2>
                </div>
                <div className="space-y-3 md:space-y-4">
                    {faqs.map((faq, idx) => (
                        <div key={faq.id} className="border border-slate-200 dark:border-slate-800 rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300">
                            <button onClick={() => toggleFaq(idx)} className={`w-full text-left p-4 md:p-8 font-bold text-sm md:text-lg flex justify-between items-center transition-colors ${openFaq === idx ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                {faq.q} <span className={`transform transition-transform text-base md:text-xl ${openFaq === idx ? 'rotate-45' : ''}`}>+</span>
                            </button>
                            <div className={`px-4 md:px-8 overflow-hidden transition-all duration-500 ease-in-out ${openFaq === idx ? 'max-h-96 py-4 md:py-6 border-t border-emerald-100 dark:border-emerald-900/30' : 'max-h-0 py-0'}`}><p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed font-light">{faq.a}</p></div>
                        </div>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* CALL TO ACTION */}
      <section id="kontak" className="bg-slate-900 dark:bg-black text-white pt-16 pb-12 md:pt-24 md:pb-20 px-4 md:px-12 lg:px-16 border-t-[6px] md:border-t-[8px] border-emerald-600 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 md:-mr-20 md:-mt-20 w-40 h-40 md:w-80 md:h-80 bg-emerald-600/20 rounded-full blur-2xl md:blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 md:-ml-20 md:-mb-20 w-40 h-40 md:w-80 md:h-80 bg-yellow-600/20 rounded-full blur-2xl md:blur-3xl pointer-events-none"></div>
        <div className="container mx-auto max-w-3xl text-center relative z-10">
            {settings.ctaTitle ? (
                <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-6 leading-[1.2]">{settings.ctaTitle}</h2>
            ) : (
                <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-6 leading-[1.2]">Siap Untuk <br className="md:hidden"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400">Berubah?</span></h2>
            )}
            <p className="text-xs md:text-xl text-slate-300 dark:text-slate-400 max-w-2xl mx-auto mb-6 md:mb-10 font-light leading-relaxed px-4">
                {settings.ctaDesc || "Bergabunglah dalam perjalanan pertumbuhan, keberlanjutan, dan perubahan positif. Wujudkan masa depan di mana organisasi Anda berkembang dengan cepat."}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 px-4">
                <a href={settings.ctaLink || "#"} className="w-full sm:w-auto px-6 py-3.5 md:px-10 md:py-5 bg-emerald-600 text-white font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-emerald-500 hover:-translate-y-1 transition duration-300 shadow-lg text-center">Pesan Layanan</a>
                <a href={`https://wa.me/${waNumber}`} target="_blank" className="w-full sm:w-auto px-6 py-3.5 md:px-10 md:py-5 bg-white/10 text-white font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-white hover:text-slate-900 transition duration-300 backdrop-blur-sm border border-white/20 text-center">Hubungi WhatsApp</a>
            </div>
        </div>
      </section>

      {/* FOOTER DINAMIS (UPDATE LINK PRIVACY) */}
      <footer className="bg-white dark:bg-slate-950 pt-12 pb-6 md:pt-20 md:pb-10 px-4 md:px-12 lg:px-16 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
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