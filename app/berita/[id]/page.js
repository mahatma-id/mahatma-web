"use client";
import { useEffect, useState, use } from 'react';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

export default function BeritaDetail({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  // State Utama
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [partners, setPartners] = useState([]); // Untuk Footer
  
  // State Sidebar & Rekomendasi
  const [latestPosts, setLatestPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [teams, setTeams] = useState([]); // Untuk mencari foto penulis
  
  // State Komentar
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

  // State Header
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Ambil Data Pengaturan & Partners
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
        if(snap.exists()) setSettings(snap.data());
    });
    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => {
        setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 1. Fetch Berita Utama & Tambah View Count
    const fetchPost = async () => {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setPost(docSnap.data());
            // Tambahkan jumlah views otomatis +1 setiap kali halaman dibuka
            try { await updateDoc(docRef, { views: increment(1) }); } catch (error) { console.log("View counter init"); }
        }
        setLoading(false);
    };
    fetchPost();

    // 2. Fetch Komentar Real-time
    const unsubComments = onSnapshot(query(collection(db, "posts", id, "comments"), orderBy("createdAt", "desc")), snap => {
        setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Fetch Berita Terbaru (Sidebar)
    const unsubLatest = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(6)), snap => {
        setLatestPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Fetch Berita Terpopuler (Sidebar)
    const unsubPopular = onSnapshot(query(collection(db, "posts"), orderBy("views", "desc"), limit(6)), snap => {
        setPopularPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Fetch Data Tim Pakar (Untuk Foto Penulis)
    const unsubTeams = onSnapshot(query(collection(db, "teams")), snap => {
        setTeams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubSettings(); unsubPartners(); unsubComments(); unsubLatest(); unsubPopular(); unsubTeams(); };
  }, [id]);

  const submitComment = async (e) => {
      e.preventDefault(); setLoadingComment(true);
      try {
          await addDoc(collection(db, "posts", id, "comments"), { name: name, text: text, createdAt: serverTimestamp() });
          setName(''); setText('');
      } catch (err) { alert("Gagal kirim komentar."); }
      setLoadingComment(false);
  };

  const rawPhone = settings.phone || "6285185639375";
  let waNumber = rawPhone.replace(/[^0-9]/g, '');
  if (waNumber.startsWith('0')) waNumber = '62' + waNumber.substring(1);

  // Tampilan Loading
  if (loading) return (
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

  if (!post) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center px-4 transition-colors duration-300"><h1 className="text-5xl font-bold text-slate-800 dark:text-white mb-2">404</h1><p className="text-slate-500 mb-6 text-sm">Berita tidak ditemukan.</p><Link href="/berita" className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition">Kembali ke Berita</Link></div>;

  let publishDate = "Baru saja";
  if (post.createdAt) {
      publishDate = post.createdAt.toDate().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // CARI DATA PENULIS DI DATABASE TIM
  const authorName = post.author || 'Tim Redaksi';
  const authorProfile = teams.find(t => t.name.toLowerCase() === authorName.toLowerCase());

  // PEMBERSIH SPASI KAKU & ENTER KOSONG DARI EDITOR
  let finalContent = post.content || '';
  finalContent = finalContent.replace(/&nbsp;/g, ' '); 
  finalContent = finalContent.replace(/^(<p><br><\/p>\s*)+/g, ''); 
  finalContent = finalContent.replace(/^(<p>\s*<\/p>\s*)+/g, ''); 

  // SISIPKAN DATELINE
  if (post.dateline) {
      const datelineHtml = `<strong class="font-black mr-2 uppercase">${post.dateline} &mdash;</strong>`;
      if (finalContent.includes('<p>')) finalContent = finalContent.replace(/<p>/, `<p>${datelineHtml} `);
      else finalContent = `<p>${datelineHtml} ${finalContent}</p>`;
  }

  // MENGHITUNG ESTIMASI WAKTU BACA
  const plainText = finalContent.replace(/<[^>]+>/g, ''); 
  const wordCount = plainText.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200)); 

  const formatDateSidebar = (timestamp) => timestamp ? timestamp.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "Baru saja";

  // DATA UNTUK SIDEBAR & BACA JUGA (Hanya tampilkan yang bukan DRAF)
  const validLatestPosts = latestPosts.filter(p => !p.isDraft && p.id !== id).slice(0, 4);
  const validPopularPosts = popularPosts.filter(p => !p.isDraft && p.id !== id).slice(0, 5);
  const bacaJugaPosts = latestPosts.filter(p => !p.isDraft && p.id !== id).slice(0, 2);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-800 dark:text-slate-200 flex flex-col overflow-x-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      
      {/* CSS KHUSUS EDITOR TEKS - DIUPDATE UNTUK DARK MODE */}
      <style jsx global>{`
        .article-content { text-align: left; width: 100%; transition: color 0.3s; }
        .article-content p { margin-bottom: 1.25rem; line-height: 1.8; font-size: 1rem; word-break: normal; overflow-wrap: break-word; }
        @media (min-width: 768px) { .article-content p { font-size: 1.125rem; } }
        
        .article-content strong, .article-content b { font-weight: 800; color: #111827; }
        .dark .article-content strong, .dark .article-content b { color: #f9fafb; }
        
        .article-content h2, .article-content h3 { font-weight: 800; color: #111827; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.4; }
        .dark .article-content h2, .dark .article-content h3 { color: #f9fafb; }
        
        .article-content h2 { font-size: 1.5rem; } .article-content h3 { font-size: 1.25rem; }
        @media (min-width: 768px) { .article-content h2 { font-size: 1.875rem; margin-top: 2.5rem; } .article-content h3 { font-size: 1.5rem; } }
        
        .article-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; line-height: 1.8; font-size: 1rem; }
        .article-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.5rem; line-height: 1.8; font-size: 1rem; }
        @media (min-width: 768px) { .article-content ul, .article-content ol { font-size: 1.125rem; } }
        .article-content li { margin-bottom: 0.5rem; }
        
        .article-content a { color: #059669; text-decoration: underline; font-weight:bold; }
        .dark .article-content a { color: #34d399; }
        
        .article-content blockquote { border-left: 4px solid #059669; padding-left: 1rem; font-style: italic; background: #ecfdf5; padding: 1rem; border-radius: 0 0.5rem 0.5rem 0; margin-bottom: 1.5rem; font-size: 0.9rem;}
        .dark .article-content blockquote { background: #064e3b; border-left-color: #34d399; color: #d1fae5; }
        @media (min-width: 768px) { .article-content blockquote { padding-left: 1.5rem; padding: 1.5rem; margin-bottom: 2rem; font-size: 1rem;} }
        
        .article-content img { 
            border-radius: 0.75rem; 
            margin: 2.5rem auto; 
            max-width: 100%; 
            height: auto; 
            display: block; 
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
        }
      `}</style>

      {/* HEADER SOLID (UPDATE DESAIN TOMBOL) */}
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
            <Link href="/berita" className="text-[10px] md:text-sm font-bold text-slate-500 hover:text-emerald-600 transition flex items-center gap-2 uppercase tracking-widest">&larr; Berita Lainnya</Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            
            {/* UPDATE: Tombol Portal ISO & Join Us Dijejer */}
            <div className="flex items-center gap-2 ml-2">
                <Link href="/portal" className="px-5 py-2.5 font-bold text-[10px] md:text-xs rounded-full hover:-translate-y-1 hover:shadow-lg transition-all tracking-widest uppercase bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50">
                    Portal ISO
                </Link>
                <Link href="/#kontak" className="px-6 py-2.5 font-bold text-[10px] md:text-xs rounded-full hover:-translate-y-1 hover:shadow-lg transition-all tracking-widest uppercase bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_15px_rgba(0,0,0,0.1)]">
                    Join Us
                </Link>
            </div>

            {/* UPDATE: Login Admin cuma Icon di ujung kanan */}
            <Link href="/admin" title="Login Admin" className="p-2 ml-1 rounded-full transition-all text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
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
                <Link href="/berita" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Semua Berita</Link>
                <Link href="/#layanan" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-600 w-full text-center pb-2 border-b border-slate-50 dark:border-slate-800">Service</Link>
                
                <div className="flex flex-col items-center gap-3 mt-2 w-full">
                    {/* UPDATE: Menu Mobile Menyesuaikan Desain */}
                    <Link href="/portal" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-4 py-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 font-bold text-xs rounded-full border border-orange-200 transition-all tracking-widest uppercase">Portal ISO</Link>
                    <Link href="/#kontak" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-center px-4 py-3 bg-emerald-600 text-white font-bold text-xs rounded-full hover:bg-slate-900 transition-all tracking-widest uppercase">Join Us</Link>
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="mt-2 text-slate-400 hover:text-emerald-600 transition p-2 bg-slate-50 dark:bg-slate-800 rounded-full" title="Admin Login">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </Link>
                </div>
            </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 md:px-8 lg:px-16 py-10 max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
        
        {/* KOLOM KIRI: ARTIKEL UTAMA (8 Kolom) */}
        <article className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 md:p-10 lg:p-12 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 h-fit transition-colors duration-300">
            
            {/* Header Berita */}
            <div className="mb-6 md:mb-8">
                <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[9px] md:text-xs font-bold uppercase tracking-widest mb-3 md:mb-4 transition-colors">
                    {post.category || 'Berita'}
                </span>
                
                {post.isDraft && (
                    <span className="ml-2 inline-block px-3 py-1 md:px-4 md:py-1.5 bg-red-600 text-white rounded-full text-[9px] md:text-xs font-bold uppercase tracking-widest mb-3 md:mb-4">
                        STATUS: DRAF (TIDAK PUBLIK)
                    </span>
                )}
                
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-[1.3] md:leading-[1.25] mb-4 md:mb-6 transition-colors">
                    {post.title}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-b border-slate-100 dark:border-slate-800 py-3 md:py-5 mt-4 transition-colors">
                    
                    {/* BAGIAN AUTHOR */}
                    <div className="flex items-center gap-3 md:gap-4">
                        {authorProfile ? (
                            <img src={authorProfile.img} alt={authorName} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-sm border border-slate-100 dark:border-slate-700" />
                        ) : (
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center font-bold text-sm md:text-lg transition-colors">
                                {authorName[0].toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-xs md:text-sm text-slate-900 dark:text-white transition-colors">{authorName}</p>
                            {authorProfile && <p className="text-[9px] md:text-[10px] text-emerald-600 dark:text-emerald-500 font-bold mb-0.5 line-clamp-1">{authorProfile.role}</p>}
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                                {publishDate} • ⏱️ {readTime} MNT BACA • 👀 {post.views || 0} DIBACA
                            </p>
                        </div>
                    </div>

                    {/* Tombol Share */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => {navigator.clipboard.writeText(window.location.href); alert('Link Tersalin!')}} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition text-xs">🔗</button>
                        <a href={`https://api.whatsapp.com/send?text=${post.title} - ${typeof window !== 'undefined' ? window.location.href : ''}`} target="_blank" className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-600 hover:text-white transition font-bold text-[10px] md:text-xs">WA</a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== 'undefined' ? window.location.href : ''}`} target="_blank" className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition font-bold text-[10px] md:text-xs">FB</a>
                    </div>
                </div>
            </div>

            {/* Gambar Sampul */}
            {post.coverUrl && (
                <div className="w-full h-48 md:h-auto md:aspect-[2/1] bg-slate-200 dark:bg-slate-800 rounded-xl md:rounded-2xl overflow-hidden mb-8 md:mb-10 shadow-sm transition-colors">
                    <img src={post.coverUrl} alt={post.title} className="w-full h-full object-cover" />
                </div>
            )}

            {/* Isi Berita */}
            <div className="article-content text-slate-600 dark:text-slate-300 w-full" dangerouslySetInnerHTML={{ __html: finalContent }}></div>

            {/* BAGIAN "BACA JUGA" */}
            {bacaJugaPosts.length > 0 && (
                <div className="mt-12 mb-8 bg-emerald-50/50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-5 md:p-6 rounded-r-xl transition-colors duration-300">
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs md:text-sm mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                        Baca Juga
                    </h4>
                    <ul className="space-y-3">
                        {bacaJugaPosts.map(bp => (
                            <li key={bp.id}>
                                <Link href={`/berita/${bp.id}`} className="text-sm md:text-base font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition leading-snug flex items-start group">
                                    <span className="mr-2 opacity-50 group-hover:opacity-100 transition">&rarr;</span> 
                                    <span className="group-hover:underline underline-offset-4">{bp.title}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* TAGS */}
            {post.tags && (
                <div className="mt-8 md:mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 transition-colors">
                    {post.tags.split(',').map((tag, index) => (
                        <Link 
                            href={`/berita?tag=${tag.trim()}`} 
                            key={index} 
                            className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-white dark:hover:text-slate-900 hover:text-white border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            #{tag.trim()}
                        </Link>
                    ))}
                </div>
            )}

            {/* Komentar */}
            <div className="mt-10 md:mt-16 bg-slate-50 dark:bg-slate-900/50 p-5 md:p-8 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mb-4 md:mb-6">Komentar ({comments.length})</h3>
                <form onSubmit={submitComment} className="mb-8 md:mb-10 bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
                    <input type="text" required placeholder="Nama Anda" className="w-full mb-3 md:mb-4 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white p-2.5 md:p-3 rounded-lg outline-none focus:border-emerald-500 font-medium text-xs md:text-sm transition-colors" value={name} onChange={e => setName(e.target.value)} />
                    <textarea required rows="3" placeholder="Tulis pendapat Anda tentang berita ini..." className="w-full mb-3 md:mb-4 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white p-2.5 md:p-3 rounded-lg outline-none focus:border-emerald-500 text-xs md:text-sm transition-colors" value={text} onChange={e => setText(e.target.value)}></textarea>
                    <button disabled={loadingComment} type="submit" className="bg-slate-900 dark:bg-emerald-600 text-white font-bold py-2.5 px-6 md:py-3 md:px-8 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-500 transition disabled:opacity-50 text-xs md:text-sm w-full md:w-auto">
                        {loadingComment ? 'Mengirim...' : 'Kirim Komentar'}
                    </button>
                </form>

                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-slate-400 italic text-xs md:text-sm text-center py-4">Belum ada komentar jadilah yang pertama.</p>
                    ) : (
                        comments.map(c => {
                            let cDate = 'Baru saja';
                            if(c.createdAt) cDate = c.createdAt.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
                            return (
                                <div key={c.id} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                                    <div className="flex justify-between items-center mb-2 md:mb-3">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-6 h-6 md:w-8 md:h-8 bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs">{c.name.charAt(0).toUpperCase()}</div>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm">{c.name}</span>
                                        </div>
                                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{cDate}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm leading-relaxed">{c.text}</p>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </article>

        {/* KOLOM KANAN: SIDEBAR */}
        <aside className="lg:col-span-4 space-y-6 md:space-y-8">
            
            {/* Widget: Berita Terbaru */}
            <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
                <h3 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white mb-4 md:mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center">
                    <span className="w-2 h-5 md:h-6 bg-emerald-500 rounded-full mr-2 md:mr-3"></span> Berita Terbaru
                </h3>
                <div className="flex flex-col gap-4 md:gap-5">
                    {validLatestPosts.map(p => (
                        <Link href={`/berita/${p.id}`} key={p.id} className="flex gap-3 md:gap-4 group items-center">
                            <div className="w-20 h-16 md:w-24 md:h-20 flex-shrink-0 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm transition-colors">
                                <img src={p.coverUrl || 'https://placehold.co/600x400'} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            </div>
                            <div className="flex-1">
                                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-0.5 md:mb-1 block">{p.category}</span>
                                <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition line-clamp-2 leading-snug">{p.title}</h4>
                                <span className="text-[9px] md:text-[10px] text-slate-400 mt-1 font-medium block">{formatDateSidebar(p.createdAt)}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Widget: Berita Terpopuler */}
            <div className="bg-slate-900 dark:bg-black p-5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-lg border border-slate-800 dark:border-slate-900 transition-colors duration-300">
                <h3 className="font-extrabold text-base md:text-lg text-white mb-4 md:mb-6 border-b border-slate-800 pb-3 flex items-center">
                    <span className="w-2 h-5 md:h-6 bg-emerald-500 rounded-full mr-2 md:mr-3"></span> Terpopuler
                </h3>
                <div className="flex flex-col gap-4 md:gap-5">
                    {validPopularPosts.map((p, index) => (
                        <Link href={`/berita/${p.id}`} key={p.id} className="flex gap-3 md:gap-4 group items-center">
                            <div className="w-6 md:w-8 flex-shrink-0 flex items-center justify-center font-black text-2xl md:text-3xl text-slate-700 dark:text-slate-800 group-hover:text-emerald-500 transition italic">
                                {index + 1}
                            </div>
                            <div className="flex-1 border-b border-slate-800 pb-3 md:pb-4 group-last:border-0 group-last:pb-0">
                                <h4 className="font-bold text-xs md:text-sm text-gray-200 group-hover:text-white transition line-clamp-2 leading-snug">{p.title}</h4>
                                <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{p.category}</span>
                                    <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">👀 {p.views || 0}x</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>

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