"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle'; 
import { useTheme } from 'next-themes';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCategorySlug } from '@/lib/insight';

export default function Home() {
  const [settings, setSettings] = useState({});
  const [sliders, setSliders] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [posts, setPosts] = useState([]);
  const [services, setServices] = useState([]);
  
  const [products, setProducts] = useState([]);
  const [partners, setPartners] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // STATE BARU UNTUK CAROUSEL TEAM
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => { setOpenFaq(openFaq === index ? null : index); };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); 

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
    const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc"), limit(3)), snap => { setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))); }); 
    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => { setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "asc")), snap => { setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubTestimonials = onSnapshot(query(collection(db, "testimonials"), orderBy("createdAt", "desc")), snap => { setTestimonials(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const unsubFaqs = onSnapshot(query(collection(db, "faqs"), orderBy("createdAt", "asc")), snap => { setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => { 
        unsubSettings(); unsubSliders(); unsubPost(); unsubService(); unsubProducts(); unsubPartners(); unsubTeams(); unsubTestimonials(); unsubFaqs(); 
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // AUTO-SLIDE HERO BANNER
  useEffect(() => {
      if (sliders.length <= 1) return;
      const interval = setInterval(() => { setCurrentSlide(prev => (prev + 1) % sliders.length); }, 5000);
      return () => clearInterval(interval);
  }, [sliders.length]);

  // AUTO-SLIDE OUR TEAM (TIAP 5 DETIK)
  useEffect(() => {
    if (teams.length <= 4) return; // Slider hanya aktif jika jumlah tim lebih dari 4
    const interval = setInterval(() => {
        setCurrentTeamIndex(prev => (prev + 1) % teams.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [teams.length]);

  const rawPhone = settings.phone || "6285185639375";
  let waNumber = rawPhone.replace(/[^0-9]/g, '');
  if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.substring(1);
  }

  // LOGIKA MENAMPILKAN 4 TIM YANG BERGESER (CAROUSEL)
  const displayedTeams = [];
  if (teams.length > 0) {
      const itemsToShow = Math.min(4, teams.length);
      for (let i = 0; i < itemsToShow; i++) {
          displayedTeams.push(teams[(currentTeamIndex + i) % teams.length]);
      }
  }

  return (
    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 overflow-x-hidden selection:bg-emerald-500 selection:text-white relative transition-colors duration-300">

      {/* GLOBAL NAVBAR BERANDA & SELURUH HALAMAN */}
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative h-screen bg-slate-900 overflow-hidden">
        {sliders.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white"><p className="animate-pulse">Menyiapkan Visual...</p></div>
        ) : (
            sliders.map((slide, index) => (
                <div key={slide.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none z-0'}`}>
                    <div className="absolute inset-0 z-0">
                        <img src={slide.imageUrl} className="w-full h-full object-cover object-center transform scale-105 animate-[kenburns_20s_ease-out_infinite]" alt="Hero Background"/>
                        <div className="absolute inset-0 bg-black/60 md:bg-black/50"></div>
                    </div>
                    <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center px-4 md:px-12 lg:px-16 pt-10 md:pt-0">
                        <div className="max-w-5xl mx-auto flex flex-col items-center">
                            {slide.tagline && (<span className="text-yellow-400 font-bold tracking-widest uppercase text-sm md:text-lg mb-4 block drop-shadow-md">{slide.tagline}</span>)}
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-extrabold text-white leading-tight md:leading-[1.2] mb-4 md:mb-6 drop-shadow-xl">{slide.title || "Driving Change, Navigating Sustainable Future"}</h1>
                            {slide.subtitle && (<p className="text-sm sm:text-base md:text-xl text-gray-200 mb-8 md:mb-10 leading-relaxed font-light drop-shadow-md max-w-3xl px-2">{slide.subtitle}</p>)}
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 w-full px-4">
                                {(slide.btn1Text || slide.btnText) && (<a href={slide.btn1Link || slide.btnLink || '#'} className="w-full sm:w-auto px-8 py-3.5 md:px-10 md:py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-slate-900 transition-all duration-300 uppercase tracking-widest text-[10px] md:text-xs shadow-lg">{slide.btn1Text || slide.btnText}</a>)}
                                {slide.btn2Text && (<a href={slide.btn2Link || '#'} className="w-full sm:w-auto px-8 py-3.5 md:px-10 md:py-4 bg-emerald-600 border-2 border-emerald-600 text-white font-bold rounded-full hover:bg-emerald-500 hover:border-emerald-500 hover:scale-105 transition-all duration-300 uppercase tracking-widest text-[10px] md:text-xs shadow-lg">{slide.btn2Text}</a>)}
                            </div>
                        </div>
                    </div>
                </div>
            ))
        )}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2 md:gap-3">
            {sliders.map((_, idx) => (<button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1 md:h-1.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-6 md:w-8 bg-emerald-500' : 'w-2 bg-white/50 hover:bg-white'}`}></button>))}
        </div>
      </section>

      {/* 2. OUR MISSION */}
      <section className="py-12 md:py-24 bg-slate-50 dark:bg-slate-900 px-4 md:px-12 lg:px-16 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center lg:items-stretch">
                <div className="w-full lg:w-5/12">
                    {settings.missionImageUrl ? (
                        <div className="relative w-full aspect-[4/5] md:aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl group">
                            <img src={settings.missionImageUrl} alt="Our Mission" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                        </div>
                    ) : (<div className="w-full aspect-[4/5] rounded-3xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">No Mission Image</div>)}
                </div>
                <div className="w-full lg:w-7/12 flex flex-col justify-center">
                    <div className="text-left mb-8 md:mb-10">
                        <span className="text-emerald-600 font-black tracking-widest uppercase text-[12px] md:text-sm mb-3 block">Our Mission</span>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">{settings.missionTitle || "Integrated Solution for Your Needs"}</h2>
                        {settings.missionDesc && (
                            <p className="text-slate-600 dark:text-slate-400 mt-4 text-sm md:text-base leading-relaxed font-light">{settings.missionDesc}</p>
                        )}
                    </div>
                    
                    {/* DESAIN BARU: Grid Card Elegan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {[1, 2, 3, 4].map((num) => {
                            const desc = settings[`mission${num}Desc`];
                            if (!desc) return null; 
                            return (
                                <div key={num} className="group bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-100 dark:bg-slate-700 group-hover:bg-emerald-500 transition-colors duration-300"></div>
                                    <span className="text-3xl md:text-4xl font-black text-emerald-50 dark:text-slate-700/50 mb-3 group-hover:text-emerald-100 dark:group-hover:text-slate-600 transition-colors duration-300">0{num}</span>
                                    <p className="text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed font-medium relative z-10">{desc}</p>
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
                        ) : (<div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 z-0 transition-colors"></div>)}
                        <div className="relative z-20 flex flex-col h-full">
                            <div className={`w-10 h-10 md:w-14 md:h-14 shadow-sm rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:rotate-12 transition-all duration-500 ${svc.imgUrl ? 'bg-white/20 backdrop-blur-md text-white group-hover:bg-emerald-600' : 'bg-white dark:bg-slate-800 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}><svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div>
                            <h3 className={`text-base md:text-xl font-bold mb-2 md:mb-4 transition-colors ${svc.imgUrl ? 'text-white group-hover:text-yellow-400' : 'text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-500'}`}>{svc.name}</h3>
                            <p className={`text-xs md:text-sm mb-4 md:mb-8 line-clamp-3 md:line-clamp-4 leading-relaxed flex-grow font-light ${svc.imgUrl ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>{svc.desc}</p>
                            <Link href={`/layanan/${svc.id}`} className={`inline-flex items-center font-bold uppercase tracking-widest text-[9px] md:text-xs transition mt-auto ${svc.imgUrl ? 'text-white hover:text-yellow-400' : 'text-slate-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-500'}`}>Read more <span className="ml-2 text-sm md:text-base leading-none transform group-hover:translate-x-2 transition-transform">→</span></Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 4. OUR PRODUCT & PORTOFOLIO */}
      {products.length > 0 && (
          <section id="produk" className="py-12 md:py-24 bg-slate-50 dark:bg-slate-900 px-4 md:px-12 lg:px-16 transition-colors duration-300">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-10 md:mb-16">
                    <span className="text-emerald-600 font-black tracking-widest uppercase text-[12px] md:text-sm mb-3 block">Our Products & Portfolio</span>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-4 md:mb-6 leading-tight">Solusi & Karya Terbaik Kami</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed font-light">Temukan berbagai modul pelatihan, alat pendukung sertifikasi, serta rekam jejak keberhasilan kami dalam mendampingi klien.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {products.map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-950 rounded-2xl md:rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group flex flex-col">
                            <div className="w-full h-48 md:h-56 bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                                <img src={p.imgUrl || 'https://placehold.co/600x400?text=No+Image'} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                {p.label && (
                                    <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm text-emerald-600 dark:text-emerald-400">
                                        {p.label}
                                    </span>
                                )}
                            </div>
                            <div className="p-6 md:p-8 flex flex-col flex-grow">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 leading-snug group-hover:text-emerald-600 transition-colors">{p.name}</h3>
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-6 flex-grow font-light leading-relaxed">{p.desc}</p>
                                
                                <a 
                                    href={p.btnLink || `https://wa.me/${waNumber}?text=Halo%20tim%20Mahatma,%20saya%20tertarik%20dengan%20produk/portofolio%20*${p.name}*.%20Boleh%20minta%20info%20lebih%20lanjut?`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full text-center px-6 py-3 md:py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all duration-300 shadow-sm"
                                >
                                    {p.btnText || 'Tanya Project Ini'}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 md:mt-14 text-center">
                    <Link href="/produk" className="inline-block px-8 py-3.5 md:px-10 md:py-4 bg-emerald-600 text-white font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white transition duration-300 shadow-md">
                        Lihat Semua Katalog &rarr;
                    </Link>
                </div>

            </div>
          </section>
      )}

      {/* 5. TIM PAKAR (REVISI AUTO-SLIDE) */}
      {teams.length > 0 && (
          <section id="tim" className="py-12 md:py-20 bg-slate-900 dark:bg-slate-950 text-white px-4 md:px-12 lg:px-16 border-t border-slate-800 transition-colors duration-300">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-8 md:mb-12">
                    <span className="text-emerald-500 font-black tracking-widest uppercase text-[12px] md:text-sm mb-3 block">Our Team</span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 md:mb-4"></h2>
                </div>
                
                {/* Carousel Container */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {displayedTeams.map((member, index) => (
                        <div key={`${member.id}-${currentTeamIndex}-${index}`} className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-800 dark:bg-slate-900 aspect-[3/4] animate-[fadeIn_1s_ease-in-out]">
                            <img src={member.img} alt={member.name} className="w-full h-full object-cover object-center group-hover:scale-110 group-hover:opacity-60 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 dark:from-slate-950 via-slate-900/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-2 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 w-full text-center">
                                <h3 className="text-[10px] md:text-lg font-bold mb-0.5 md:mb-1 text-white leading-tight">{member.name}</h3>
                                <p className="text-yellow-400 text-[8px] md:text-[10px] font-bold tracking-widest uppercase line-clamp-1">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tambahkan style CSS animasi manual khusus untuk slider team */}
                <style jsx>{`
                    @keyframes fadeIn {
                        from { opacity: 0.8; transform: scale(0.98); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `}</style>

                <div className="mt-8 md:mt-12 text-center">
                    <Link href="/tim" className="inline-block px-8 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-500 transition shadow-lg text-xs md:text-sm uppercase tracking-widest">See More →</Link>
                </div>
            </div>
          </section>
      )}

      {/* 6. OUR INSIGHT */}
      <section id="insight" className="py-12 md:py-20 bg-white dark:bg-slate-950 px-4 md:px-12 lg:px-16 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto max-w-7xl">
            <div className="mb-8 md:mb-12 text-center md:text-left">
                <span className="text-emerald-600 font-black tracking-widest uppercase text-[12px] md:text-sm mb-3 block">Our Insight</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 leading-tight">
                    Berita & Kolom Opini Terkini
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm max-w-2xl">
                    Informasi resmi, inovasi berkelanjutan, dan pemikiran strategis untuk transformasi institusi pendidikan.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {posts.map(post => {
                    const catSlug = getCategorySlug(post.category);
                    const isOpini = catSlug === 'opini';
                    let dStr = "";
                    if(post.createdAt) dStr = post.createdAt.toDate().toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' });
                    return (
                    <Link href={`/insight/${catSlug}/${post.id}`} key={post.id} className="group flex flex-col cursor-pointer bg-slate-50 dark:bg-slate-900 rounded-2xl md:rounded-3xl p-3 md:p-4 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl dark:hover:shadow-slate-900/50 hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                        <div className="w-full h-40 md:h-60 bg-slate-200 dark:bg-slate-800 rounded-xl md:rounded-2xl overflow-hidden mb-3 md:mb-5 relative">
                            <img src={post.coverUrl || 'https://placehold.co/600x400'} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 dark:opacity-90" alt={post.title}/>
                            <span className={`absolute top-3 left-3 px-2.5 py-1 text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md text-white ${isOpini ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                                {isOpini ? 'Opini' : 'Berita'}
                            </span>
                        </div>
                        <div className="px-1 md:px-3 pb-1 flex-1 flex flex-col">
                            <h3 className="text-sm md:text-2xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-500 transition leading-snug line-clamp-2">{post.title}</h3>
                            <p className="text-[8px] md:text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase mt-auto pt-3 md:pt-4 border-t border-slate-200 dark:border-slate-700">{dStr} <span className="mx-1 md:mx-2 text-yellow-500 dark:text-yellow-600">•</span> {post.author || 'Admin'}</p>
                        </div>
                    </Link>
                )})}
            </div>
            <div className="mt-10 md:mt-14 text-center">
                <Link href="/insight" className="inline-block px-8 py-3.5 md:px-10 md:py-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white transition duration-300 shadow-sm border border-slate-200 dark:border-slate-800">
                    Lihat Semua Insight →
                </Link>
            </div>
        </div>
      </section>

      {/* 7. TESTIMONI */}
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

      {/* 8. FAQ */}
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

      {/* GLOBAL FOOTER BERANDA & SELURUH HALAMAN */}
      <Footer />
    </div>
  );
}