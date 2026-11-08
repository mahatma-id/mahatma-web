"use client";
import { useEffect, useState, Suspense } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCategorySlug, getExcerpt, estimateReadingTime } from '@/lib/insight';

function InsightContent() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState(''); 
  const [visibleCount, setVisibleCount] = useState(9); 
  
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get('tag');
  const catFromUrl = searchParams.get('kategori');

  useEffect(() => {
    if (tagFromUrl) {
      setSearchQuery(tagFromUrl);
    }
  }, [tagFromUrl]);

  useEffect(() => {
    if (catFromUrl) {
      const slug = catFromUrl.toLowerCase();
      if (slug === 'berita' || slug === 'news') setFilter('Berita');
      else if (slug === 'opini' || slug === 'opinion') setFilter('Opini');
    }
  }, [catFromUrl]);

  useEffect(() => {
    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => {
      const allFetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(allFetched.filter(p => !p.isDraft)); 
      setLoading(false);
    });
    return () => unsubPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const postSlug = getCategorySlug(post.category);
    let matchCategory = true;
    if (filter === 'Berita') {
      matchCategory = postSlug === 'berita';
    } else if (filter === 'Opini') {
      matchCategory = postSlug === 'opini';
    }

    const titleMatch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const tagsMatch = post.tags && post.tags.toLowerCase().includes(searchQuery.toLowerCase());
    const authorMatch = post.author && post.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSearch = !searchQuery || titleMatch || tagsMatch || authorMatch;

    return matchCategory && matchSearch;
  });

  const featuredPost = filteredPosts.length > 0 && !searchQuery && filter === 'Semua' ? filteredPosts[0] : null;
  const gridPosts = featuredPost ? filteredPosts.slice(1, visibleCount + 1) : filteredPosts.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Memuat Insight...</p>
      </div>
    );
  }

  return (
    <>
      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar justify-start">
          {[
            { id: 'Semua', label: 'Semua Insight' },
            { id: 'Berita', label: '📰 Berita & Liputan' },
            { id: 'Opini', label: '💡 Kolom Opini' }
          ].map(item => {
            const isActive = filter === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => { setFilter(item.id); setVisibleCount(9); }} 
                className={`whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                    : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Cari berita, opini, topik, penulis..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(9); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs md:text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* FEATURED / HIGHLIGHT ARTICLE (Muncul jika tidak sedang mencari) */}
      {featuredPost && (
        <div className="mb-12">
          <Link 
            href={`/insight/${getCategorySlug(featuredPost.category)}/${featuredPost.id}`} 
            className="group grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-6 border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-500"
          >
            <div className="lg:col-span-7 h-64 md:h-96 rounded-2xl overflow-hidden relative bg-slate-100 dark:bg-slate-800">
              <img 
                src={featuredPost.coverUrl || 'https://placehold.co/1200x800/0f172a/white?text=Mahatma+Insight'} 
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <span className={`absolute top-4 left-4 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-md ${
                getCategorySlug(featuredPost.category) === 'opini' ? 'bg-amber-600' : 'bg-emerald-600'
              }`}>
                {getCategorySlug(featuredPost.category) === 'opini' ? 'KOLOM OPINI' : 'BERITA UTAMA'}
              </span>
            </div>
            <div className="lg:col-span-5 flex flex-col justify-center py-2 lg:px-4">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-3">
                <span>{featuredPost.createdAt ? featuredPost.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Terbaru'}</span>
                <span>•</span>
                <span>⏱️ {estimateReadingTime(featuredPost.content)} MENIT BACA</span>
              </div>
              <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 transition leading-snug">
                {featuredPost.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm line-clamp-3 leading-relaxed mb-6">
                {featuredPost.excerpt || getExcerpt(featuredPost.content, 180)}
              </p>
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ✍️ {featuredPost.author || 'Tim Redaksi'}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Baca Selengkapnya &rarr;
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ARTICLE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {gridPosts.map(post => {
          const categorySlug = getCategorySlug(post.category);
          const isOpini = categorySlug === 'opini';
          const dStr = post.createdAt ? post.createdAt.toDate().toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const readTime = estimateReadingTime(post.content);

          return (
            <Link 
              href={`/insight/${categorySlug}/${post.id}`} 
              key={post.id} 
              className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl p-4 hover:shadow-xl dark:hover:shadow-emerald-950/30 hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 dark:border-slate-800"
            >
              <div className="w-full h-48 md:h-52 bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden mb-4 relative">
                <img 
                  src={post.coverUrl || 'https://placehold.co/600x400/0f172a/white?text=Mahatma+Insight'} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={post.title}
                />
                <span className={`absolute top-3 left-3 px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm text-white ${
                  isOpini ? 'bg-amber-600' : 'bg-emerald-600'
                }`}>
                  {isOpini ? 'Opini' : 'Berita'}
                </span>
              </div>
              <div className="px-1 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>{dStr}</span>
                  <span>•</span>
                  <span>⏱️ {readTime} min</span>
                </div>
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition leading-snug line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {post.excerpt || getExcerpt(post.content, 110)}
                </p>
                <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>✍️ {post.author || 'Tim Redaksi'}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 mt-6">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-bold mb-2">Tidak ada artikel yang cocok</p>
          <p className="text-slate-400 text-xs md:text-sm mb-6">Coba kata kunci lain atau pilih kategori yang berbeda.</p>
          <button 
            onClick={() => { setSearchQuery(''); setFilter('Semua'); }}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
          >
            Reset Pencarian
          </button>
        </div>
      )}

      {/* LOAD MORE BUTTON */}
      {filteredPosts.length > (featuredPost ? visibleCount + 1 : visibleCount) && (
        <div className="mt-12 text-center">
          <button 
            onClick={() => setVisibleCount(prev => prev + 6)} 
            className="px-8 py-3.5 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 dark:hover:bg-emerald-600 transition-colors shadow-md"
          >
            Muat Lebih Banyak Artikel
          </button>
        </div>
      )}
    </>
  );
}

export default function InsightArchivePage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col font-sans transition-colors duration-300">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 md:px-12 lg:px-16 pt-32 md:pt-40 pb-20 max-w-7xl">
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] md:text-xs font-extrabold uppercase tracking-widest mb-4 border border-emerald-200/50 dark:border-emerald-800/50">
            MAHATMA INSIGHT
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
            Berita & Kolom Opini Terkini
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base leading-relaxed">
            Menyajikan wawasan strategis, pembaruan kabar resmi, dan analisis kritis dari para akademisi serta praktisi untuk masa depan pendidikan yang berkelanjutan.
          </p>
        </div>

        {/* SUSPENSE CONTAINER */}
        <Suspense fallback={
          <div className="py-20 flex justify-center items-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <InsightContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
