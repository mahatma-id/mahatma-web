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
  
  const [partners, setPartners] = useState([]);
  const [teams, setTeams] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => { setOpenFaq(openFaq === index ? null : index); };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => { if(snap.exists()) setSettings(snap.data()); });
    const unsubSliders = onSnapshot(query(collection(db, "sliders"), orderBy("createdAt", "asc")), snap => { setSliders(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    
    // PERUBAHAN: Tarik lebih banyak berita, filter yang bukan draf, lalu ambil 3
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

    return () => { unsubSettings(); unsubSliders(); unsubPost(); unsubService(); unsubPartners(); unsubTeams(); unsubTestimonials(); unsubFaqs(); };
  }, []);

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

  return (
    <div className="text-slate-800 bg-white overflow-x-hidden selection:bg-orange-500 selection:text-white relative">

      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 transition-all">
        <div className="container mx-auto px-4 md:px-12 lg:px-16 py-3 md:py-4 flex justify-between items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-2 group z-50">
            {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-8 md:h-10 object-contain group-hover:scale-105 transition-transform" />
            ) : (
                <span className="font-extrabold text-base md:text-xl tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                    MAHATMA <span className="text-orange-600">ACADEMY</span>
                </span>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-10 font-bold text-xs tracking-widest uppercase text-slate-600">
            <a href="#layanan" className="hover:text-orange-600 hover:-translate-y-1 transition-all">Service</a>
            <Link href="/tentang-kami" className="hover:text-orange-600 hover:-translate-y-1 transition-all">About Us</Link>
            <a href="#tim" className="hover:text-orange-600 hover:-translate-y-1 transition-all">Our Team</a>
            <a href="#insight" className="hover:text-orange-600 hover:-translate-y-1 transition-all">Insight</a>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <Link href="/admin" className="text-xs font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest mr-4 transition">Admin</Link>
            <a href="#kontak" className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-full hover:bg-orange-600 hover:-translate-y-1 hover:shadow-lg transition-all tracking-widest uppercase">
              Join Us
            </a>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-slate-900 focus:outline-none z-50 p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />}
            </svg>
          </button>
        </div>

        <div className={`lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96 py-4 opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'}`}>
            <nav className="flex flex-col items-center gap-4 font-bold text-sm tracking-widest uppercase text-slate-600 px-4">
                <a href="#layanan" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-600 w-full text-center pb-2 border-b border-slate-50">Service</a>
                <Link href="/tentang-kami" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-600 w-full text-center pb-2 border-b border-slate-50">About Us</Link>
                <a href="#tim" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-600 w-full text-center pb-2 border-b border-slate-50">Our Team</a>
                <a href="#insight" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-600 w-full text-center pb-2 border-b border-slate-50">Insight</a>
                
                <div className="flex flex-col items-center gap-3 mt-2 w-full">
                    <a href="#kontak" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-4 py-3 bg-orange-600 text-white font-bold text-xs rounded-full hover:bg-slate-900 transition-all tracking-widest uppercase">Join Us</a>
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest">Admin Login</Link>
                </div>
            </nav>
        </div>
      </header>

      {/* 1. HERO SECTION (DIPERBAIKI POSISI TEKSNYA) */}
      <section className="relative h-[65vh] md:min-h-[90vh] bg-slate-900 overflow-hidden flex items-center justify-center">
        {sliders.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white"><p className="animate-pulse">Menyiapkan Visual...</p></div>
        ) : (
            sliders.map((slide, index) => (
                <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none -z-10'}`}>
                    
                    {/* Gambar dikunci posisinya sebagai background */}
                    <img src={slide.imageUrl} className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 animate-[kenburns_20s_ease-out_infinite] z-0" alt="Hero Background"/>
                    
                    {/* Overlay hitam agar teks terbaca */}
                    <div className="absolute inset-0 bg-black/60 md:bg-black/50 z-10"></div>
                    
                    {/* Teks dikunci posisinya di atas segalanya (z-20) dan ditaruh di tengah layar */}
                    <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center px-4 md:px-12 lg:px-16 max-w-5xl mx-auto">
                        <span className="text-orange-500 font-bold tracking-widest uppercase text-[10px] md:text-sm mb-2 md:mb-4 block drop-shadow-md">
                            Reach The Future
                        </span>
                        
                        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-extrabold text-white leading-tight md:leading-[1.2] mb-3 md:mb-6 drop-shadow-xl">
                            {slide.title || "Driving Change, Navigating Sustainable Future"}
                        </h1>
                        
                        <p className="text-xs sm:text-sm md:text-xl text-gray-200 mb-6 md:mb-10 leading-relaxed font-light drop-shadow-md max-w-3xl px-2">
                            {slide.subtitle || "Our range of services is tailored individually for each company. No matter how complex the case is, we inspire confidence and empower in all we do."}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 w-full px-4">
                            {(slide.btnText || slide.btn1Text) && (
                                <a href={slide.btnLink || slide.btn1Link || '#layanan'} className="w-full sm:w-auto px-6 py-3.5 md:px-10 md:py-4 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-500 hover:scale-105 transition-all duration-300 uppercase tracking-widest text-[10px] md:text-sm shadow-lg">
                                    {slide.btnText || slide.btn1Text || "Learn More"}
                                </a>
                            )}
                            {slide.btn2Text && (
                                <a href={slide.btn2Link || '#kontak'} className="w-full sm:w-auto px-6 py-3.5 md:px-10 md:py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white hover:text-slate-900 transition-all duration-300 backdrop-blur-sm border border-white/20 uppercase tracking-widest text-[10px] md:text-sm shadow-lg">
                                    {slide.btn2Text}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))
        )}
        
        {/* Navigasi Titik-Titik di bagian paling bawah layar */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2 md:gap-3">
            {sliders.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1 md:h-1.5 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-6 md:w-8 bg-orange-500' : 'w-2 bg-white/50 hover:bg-white'}`}></button>
            ))}
        </div>
      </section>

      {/* 2. OUR MISSION */}
      <section className="py-12 md:py-20 bg-slate-50 text-center px-4 md:px-12 lg:px-16 border-b border-slate-100">
        <div className="container mx-auto max-w-4xl">
            <span className="text-orange-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 block">Our Mission</span>
            <h2 className="text-xl md:text-4xl font-bold text-slate-900 mb-4 md:mb-6 leading-snug px-2">{settings.missionTitle || "Solusi Terintegrasi Untuk Bisnis Anda."}</h2>
            <p className="text-sm md:text-xl text-slate-500 leading-relaxed mb-8 md:mb-12 font-light max-w-2xl mx-auto px-2">{settings.missionDesc || "Kami memiliki misi untuk mendorong perubahan berkelanjutan dengan memberdayakan individu dan organisasi."}</p>
            
            <div className="flex justify-center gap-8 md:gap-20 font-bold text-xs md:text-lg text-slate-800 uppercase tracking-widest">
                {[1, 2, 3].map(num => (
                    <div key={num} className="flex flex-col items-center hover:scale-110 transition-transform">
                        {settings[`mission${num}Img`] ? (
                            <img src={settings[`mission${num}Img`]} className="w-10 h-10 md:w-16 md:h-16 mb-2 md:mb-4 object-contain drop-shadow-sm" alt="Mission Icon" />
                        ) : (
                            <span className="text-orange-500 text-3xl md:text-5xl mb-2 md:mb-4 drop-shadow-sm">{num === 1 ? '🌍' : num === 2 ? '🌱' : '🚀'}</span>
                        )}
                        {settings[`mission${num}Title`] || (num === 1 ? 'People' : num === 2 ? 'Planet' : 'Progress')}
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 3. OUR SERVICE */}
      <section id="layanan" className="py-12 md:py-24 bg-white px-4 md:px-12 lg:px-16">
        <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-12 mb-10 md:mb-16">
                <div className="lg:w-1/2 text-center lg:text-left">
                    <span className="text-orange-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 block">Our Service</span>
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight">{settings.serviceTitle || "Layanan Terbaik Untuk Anda."}</h2>
                    <p className="text-slate-600 text-sm md:text-lg leading-relaxed font-light">{settings.serviceDesc || "Jelajahi layanan konsultasi dan pelatihan kami yang dirancang untuk mengkatalisasi pertumbuhan."}</p>
                </div>
                {settings.serviceImageUrl && (
                    <div className="lg:w-1/2 w-full mt-2 lg:mt-0">
                        <img src={settings.serviceImageUrl} alt="Our Service" className="w-full h-40 md:h-80 object-cover rounded-2xl md:rounded-[2rem] shadow-md md:shadow-xl" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {services.map(svc => (
                    <div key={svc.id} className="bg-slate-50 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group flex flex-col h-full cursor-pointer">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white shadow-sm text-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-orange-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500">
                            <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <h3 className="text-base md:text-2xl font-bold text-slate-900 mb-2 md:mb-4 group-hover:text-orange-600 transition-colors">{svc.name}</h3>
                        <p className="text-slate-600 text-xs md:text-base mb-4 md:mb-8 line-clamp-3 md:line-clamp-4 leading-relaxed flex-grow font-light">{svc.desc}</p>
                        <Link href={`/layanan/${svc.id}`} className="inline-flex items-center font-bold text-slate-900 uppercase tracking-widest text-[9px] md:text-xs group-hover:text-orange-600 transition mt-auto">
                            Eksplorasi <span className="ml-2 text-sm md:text-base leading-none transform group-hover:translate-x-2 transition-transform">→</span>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 4. TIM PAKAR */}
      {teams.length > 0 && (
          <section id="tim" className="py-12 md:py-20 bg-slate-900 text-white px-4 md:px-12 lg:px-16">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-8 md:mb-12">
                    <span className="text-orange-500 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 block">Meet The Experts</span>
                    <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">Orang-Orang Hebat di Balik Mahatma</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {teams.map(member => (
                        <div key={member.id} className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-800">
                            <img src={member.img} alt={member.name} className="w-full h-48 md:h-80 object-cover group-hover:scale-110 group-hover:opacity-60 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-3 md:p-6 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                <h3 className="text-sm md:text-xl font-bold mb-0.5 md:mb-1 text-white">{member.name}</h3>
                                <p className="text-orange-400 text-[8px] md:text-[10px] font-bold tracking-widest uppercase line-clamp-1">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* 5. OUR INSIGHT (BLOG) */}
      <section id="insight" className="py-12 md:py-20 bg-white px-4 md:px-12 lg:px-16 border-b border-slate-100">
        <div className="container mx-auto max-w-7xl">
            <div className="mb-8 md:mb-12 text-center md:text-left">
                <span className="text-orange-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 block">Our Insight</span>
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 md:mb-4 leading-tight">Wawasan & Perspektif Terbaru</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {posts.map(post => {
                    let dStr = "";
                    if(post.createdAt) dStr = post.createdAt.toDate().toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' });
                    
                    return (
                    <Link href={`/berita/${post.id}`} key={post.id} className="group flex flex-col cursor-pointer bg-slate-50 rounded-2xl md:rounded-3xl p-3 md:p-4 hover:bg-white hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-slate-100">
                        <div className="w-full h-40 md:h-60 bg-slate-200 rounded-xl md:rounded-2xl overflow-hidden mb-3 md:mb-5 relative">
                            <img src={post.coverUrl || 'https://placehold.co/600x400'} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
                            <span className="absolute top-3 left-3 bg-white px-2 py-1 text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md text-slate-900">{post.category}</span>
                        </div>
                        <div className="px-1 md:px-3 pb-1 flex-1 flex flex-col">
                            <h3 className="text-sm md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 group-hover:text-orange-600 transition leading-snug line-clamp-2">{post.title}</h3>
                            <p className="text-[8px] md:text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-auto pt-3 md:pt-4 border-t border-slate-200">{dStr} <span className="mx-1 md:mx-2 text-orange-300">•</span> {post.author || 'Admin'}</p>
                        </div>
                    </Link>
                )})}
            </div>

            <div className="mt-10 md:mt-14 text-center">
                <Link href="/berita" className="inline-block px-8 py-3.5 md:px-10 md:py-4 bg-slate-100 text-slate-800 font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-slate-900 hover:text-white transition duration-300 shadow-sm border border-slate-200">
                    Lihat Semua Berita &rarr;
                </Link>
            </div>
        </div>
      </section>

      {/* 6. TESTIMONI */}
      {testimonials.length > 0 && (
          <section className="py-12 md:py-20 bg-slate-50 px-4 md:px-12 lg:px-16 overflow-hidden">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-8 md:mb-12">
                    <span className="text-orange-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 block">Testimonials</span>
                    <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2 md:mb-4">Apa Kata Mereka Tentang Kami</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                    {testimonials.map(testi => (
                        <div key={testi.id} className="bg-white p-5 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 relative group hover:-translate-y-2 transition-all duration-300">
                            <span className="absolute top-2 right-4 md:top-4 md:right-6 text-3xl md:text-5xl text-slate-100 font-serif group-hover:text-orange-100 transition-colors">"</span>
                            <p className="text-slate-600 text-xs md:text-base italic leading-relaxed mb-4 md:mb-8 relative z-10">{testi.text}</p>
                            <div className="flex items-center gap-3 md:gap-4 border-t border-slate-100 pt-4 md:pt-6">
                                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-slate-900 text-white flex justify-center items-center font-bold text-xs md:text-base">{testi.name[0]}</div>
                                <div><h4 className="font-bold text-slate-900 text-xs md:text-base">{testi.name}</h4><p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 line-clamp-1">{testi.company}</p></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* 7. FAQ */}
      {faqs.length > 0 && (
          <section className="py-12 md:py-20 bg-white px-4 md:px-12 lg:px-16 border-t border-slate-100">
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-8 md:mb-12">
                    <span className="text-orange-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 block">F.A.Q</span>
                    <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2 md:mb-4">Pertanyaan Paling Sering Diajukan</h2>
                </div>
                <div className="space-y-3 md:space-y-4">
                    {faqs.map((faq, idx) => (
                        <div key={faq.id} className="border border-slate-200 rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300">
                            <button onClick={() => toggleFaq(idx)} className={`w-full text-left p-4 md:p-8 font-bold text-sm md:text-lg flex justify-between items-center transition-colors ${openFaq === idx ? 'bg-orange-50 text-orange-600' : 'bg-white text-slate-900 hover:bg-slate-50'}`}>
                                {faq.q} <span className={`transform transition-transform text-base md:text-xl ${openFaq === idx ? 'rotate-45' : ''}`}>+</span>
                            </button>
                            <div className={`px-4 md:px-8 overflow-hidden transition-all duration-500 ease-in-out ${openFaq === idx ? 'max-h-96 py-4 md:py-6 border-t border-orange-100' : 'max-h-0 py-0'}`}><p className="text-slate-600 text-xs md:text-base leading-relaxed font-light">{faq.a}</p></div>
                        </div>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* CALL TO ACTION DARI FIREBASE SETTINGS */}
      <section id="kontak" className="bg-slate-900 text-white pt-16 pb-12 md:pt-24 md:pb-20 px-4 md:px-12 lg:px-16 border-t-[6px] md:border-t-[8px] border-orange-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 md:-mr-20 md:-mt-20 w-40 h-40 md:w-80 md:h-80 bg-orange-600/20 rounded-full blur-2xl md:blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 md:-ml-20 md:-mb-20 w-40 h-40 md:w-80 md:h-80 bg-indigo-600/20 rounded-full blur-2xl md:blur-3xl pointer-events-none"></div>
        <div className="container mx-auto max-w-3xl text-center relative z-10">
            {settings.ctaTitle ? (
                <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-6 leading-[1.2]">{settings.ctaTitle}</h2>
            ) : (
                <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-6 leading-[1.2]">Siap Untuk <br className="md:hidden"/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Berubah?</span></h2>
            )}
            <p className="text-xs md:text-xl text-slate-300 max-w-2xl mx-auto mb-6 md:mb-10 font-light leading-relaxed px-4">
                {settings.ctaDesc || "Bergabunglah dalam perjalanan pertumbuhan, keberlanjutan, dan perubahan positif. Wujudkan masa depan di mana organisasi Anda berkembang dengan cepat."}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 px-4">
                <button className="w-full sm:w-auto px-6 py-3.5 md:px-10 md:py-5 bg-orange-600 text-white font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-orange-500 hover:-translate-y-1 transition duration-300 shadow-lg">Pesan Layanan</button>
                <a href={`https://wa.me/${waNumber}`} target="_blank" className="w-full sm:w-auto px-6 py-3.5 md:px-10 md:py-5 bg-white/10 text-white font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-white hover:text-slate-900 transition duration-300 backdrop-blur-sm border border-white/20">Hubungi WhatsApp</a>
            </div>
        </div>
      </section>

      {/* FOOTER DINAMIS */}
      <footer className="bg-white pt-12 pb-6 md:pt-20 md:pb-10 px-4 md:px-12 lg:px-16 border-t border-slate-200">
        <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 mb-8 md:mb-16 text-center md:text-left">
                <div className="lg:col-span-4 lg:pr-8 flex flex-col items-center md:items-start">
                    <Link href="/" className="inline-block mb-4 md:mb-8">
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="h-8 md:h-14 object-contain" />
                        ) : (
                            <span className="font-extrabold text-xl md:text-3xl tracking-tight text-slate-900">
                                MAHATMA <span className="text-orange-600">ACADEMY</span>
                            </span>
                        )}
                    </Link>
                    <p className="text-slate-500 text-xs md:text-base leading-relaxed md:leading-loose mb-4 md:mb-8 max-w-xs md:max-w-none">
                        {settings.footerDesc || "Mempersiapkan diri menghadapi perubahan zaman dan membuat bisnis Anda tetap relevan di masa depan."}
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 mb-1 md:mb-2">
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        <span className="text-[10px] md:text-sm font-bold">Speak to our expert at</span>
                    </div>
                    <a href={`https://wa.me/${waNumber}`} target="_blank" className="text-lg md:text-2xl font-bold text-orange-600 hover:text-orange-700 transition">
                        {rawPhone}
                    </a>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-slate-900 mb-3 md:mb-6 uppercase tracking-wider text-[10px] md:text-sm">Follow Us</h4>
                    <div className="flex justify-center md:justify-start gap-3 md:gap-4">
                        <a href={settings.linkedin || "#"} target="_blank" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-orange-600 hover:text-orange-600 transition"><span className="text-xs md:text-sm font-bold">in</span></a>
                        <a href={settings.youtube || "#"} target="_blank" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-red-600 hover:text-red-600 transition"><span className="text-xs md:text-sm font-bold">yt</span></a>
                        <a href={settings.instagram || "#"} target="_blank" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 hover:border-pink-600 hover:text-pink-600 transition"><span className="text-xs md:text-sm font-bold">ig</span></a>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="font-bold text-slate-900 mb-3 md:mb-6 uppercase tracking-wider text-[10px] md:text-sm">Pages</h4>
                    <ul className="space-y-2 md:space-y-4 text-xs md:text-base text-slate-500">
                        <li><Link href="/" className="hover:text-orange-600 transition">Homepage</Link></li>
                        <li><Link href="/tentang-kami" className="hover:text-orange-600 transition">About Us</Link></li>
                        <li><a href="#insight" className="hover:text-orange-600 transition">Our Insight</a></li>
                        <li><a href="#tim" className="hover:text-orange-600 transition">Our Team</a></li>
                        <li><a href="#kontak" className="hover:text-orange-600 transition">Contact Us</a></li>
                    </ul>
                </div>

                <div className="lg:col-span-4">
                    <h4 className="font-bold text-slate-900 mb-3 md:mb-6 uppercase tracking-wider text-[10px] md:text-sm">Mitra Kerja</h4>
                    {partners.length > 0 ? (
                        <div className="flex flex-col items-center md:items-start">
                            <div className="grid grid-cols-4 lg:grid-cols-3 gap-2 md:gap-3 opacity-80 w-full max-w-[200px] md:max-w-xs">
                                {partners.slice(0, 12).map(p => (
                                    <div key={p.id} className="w-full aspect-square flex items-center justify-center bg-white rounded border border-slate-100 hover:border-orange-200 p-1 md:p-2 transition-colors">
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
                                    <Link href="/mitra-kerja" className="text-[10px] md:text-sm text-orange-600 hover:text-orange-700 font-bold transition">
                                        Selengkapnya &rarr;
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">Belum ada mitra.</p>
                    )}
                </div>

            </div>

            <div className="border-t border-slate-200 pt-6 md:pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-[9px] md:text-[11px] font-bold tracking-widest uppercase text-slate-400">
                <p className="mb-3 md:mb-0">&copy; 2026 Mahatma Academy. All rights reserved.</p>
                <div className="flex justify-center gap-4 md:gap-6">
                    <a href="#" className="hover:text-orange-600 transition">Privacy Policy</a>
                    <a href="#" className="hover:text-orange-600 transition">Terms of Service</a>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}