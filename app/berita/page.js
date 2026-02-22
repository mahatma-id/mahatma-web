"use client";
import { useEffect, useState, Suspense } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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

  if (loading) return <div className="py-20 flex justify-center items-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-white p-4 rounded-2xl md:rounded-full shadow-sm border border-slate-100">
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar justify-center md:justify-start">
                {['Semua', 'News', 'Opini'].map(f => (
                    <button 
                        key={f} 
                        onClick={() => {setFilter(f); setVisibleCount(6);}} 
                        className={`whitespace-nowrap px-5 py-2 md:px-6 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-100'}`}
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
                    className="w-full pl-10 pr-4 py-2.5 md:py-3 rounded-full border border-slate-200 text-xs md:text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-slate-50"
                />
                <svg className="w-4 h-4 md:w-5 md:h-5 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {visiblePosts.map(post => {
                let dStr = ""; if(post.createdAt) dStr = post.createdAt.toDate().toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' });
                return (
                <Link href={`/berita/${post.id}`} key={post.id} className="group flex flex-col bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border border-slate-100">
                    <div className="w-full h-48 md:h-56 bg-slate-200 rounded-xl md:rounded-2xl overflow-hidden mb-4 relative">
                        <img src={post.coverUrl || 'https://placehold.co/600x400'} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
                        <span className="absolute top-3 left-3 bg-white px-3 py-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-full shadow-md text-slate-900">{post.category}</span>
                    </div>
                    <div className="px-2 flex-1 flex flex-col">
                        <h3 className="text-base md:text-xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition leading-snug line-clamp-3">{post.title}</h3>
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-auto pt-4 border-t border-slate-100">{dStr} &bull; {post.author || 'Admin'}</p>
                    </div>
                </Link>
            )})}
        </div>

        {visiblePosts.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 mt-6">
                <span className="text-4xl mb-4 block">🔍</span>
                <p className="text-slate-500 text-sm md:text-lg">Tidak ada berita yang cocok dengan <strong>"{searchQuery}"</strong>.</p>
            </div>
        )}

        {filteredPosts.length > visibleCount && (
            <div className="text-center mt-10 md:mt-14">
                <button 
                    onClick={() => setVisibleCount(prev => prev + 6)} 
                    className="px-8 py-3.5 md:px-10 md:py-4 bg-orange-600 text-white font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-full hover:bg-slate-900 hover:-translate-y-1 transition-all duration-300 shadow-lg"
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
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 selection:bg-orange-500 selection:text-white">
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-12 lg:px-16 py-3 md:py-4 flex justify-between items-center max-w-7xl">
          <Link href="/" className="font-extrabold text-lg md:text-xl tracking-tight text-slate-900 hover:text-orange-600 transition">
            MAHATMA <span className="text-orange-600">ACADEMY</span>
          </Link>
          <Link href="/#insight" className="text-[10px] md:text-xs font-bold text-slate-500 hover:text-orange-600 uppercase tracking-widest transition">&larr; Beranda</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-12 lg:px-16 py-10 md:py-16 max-w-7xl">
        <div className="text-center mb-10 md:mb-14">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-3 md:mb-4">Wawasan & Perspektif</h1>
            <p className="text-slate-500 text-sm md:text-lg">Temukan artikel, berita terbaru, dan pandangan pakar kami.</p>
        </div>

        {/* Suspense digunakan agar website tidak error saat mendeteksi parameter URL (?tag=) */}
        <Suspense fallback={<div className="py-20 text-center text-slate-400 animate-pulse font-bold tracking-widest text-xs">MEMUAT KONTEN...</div>}>
            <BeritaContent />
        </Suspense>

      </main>
    </div>
  );
}