"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function SemuaBerita() {
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Semua');

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => { if(snap.exists()) setSettings(snap.data()); });
    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => {
        setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    });
    return () => { unsubSettings(); unsubPosts(); };
  }, []);

  const filteredPosts = posts.filter(post => filter === 'Semua' ? true : post.category === filter);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><p className="font-bold text-slate-500 animate-pulse tracking-widest text-xs">Memuat Berita...</p></div>;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {/* NAVBAR */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-12 lg:px-16 py-3 md:py-4 flex justify-between items-center max-w-7xl">
          <Link href="/" className="font-extrabold text-lg md:text-xl tracking-tight text-slate-900">
            MAHATMA <span className="text-orange-600">ACADEMY</span>
          </Link>
          <Link href="/#insight" className="text-[10px] md:text-xs font-bold text-slate-500 hover:text-orange-600 uppercase tracking-widest">&larr; Kembali</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-12 lg:px-16 py-12 max-w-7xl">
        <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">Wawasan & Perspektif</h1>
            <p className="text-slate-500 text-sm md:text-base">Temukan artikel, berita terbaru, dan pandangan pakar kami.</p>
        </div>

        {/* FILTER BUTTONS */}
        <div className="flex justify-center gap-3 mb-10">
            {['Semua', 'News', 'Opini'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                    {f}
                </button>
            ))}
        </div>

        {/* GRID BERITA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredPosts.map(post => {
                let dStr = ""; if(post.createdAt) dStr = post.createdAt.toDate().toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' });
                return (
                <Link href={`/berita/${post.id}`} key={post.id} className="group flex flex-col bg-white rounded-3xl p-4 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border border-slate-100">
                    <div className="w-full h-48 md:h-56 bg-slate-200 rounded-2xl overflow-hidden mb-4 relative">
                        <img src={post.coverUrl || 'https://placehold.co/600x400'} className="w-full h-full object-cover group-hover:scale-110 transition duration-700"/>
                        <span className="absolute top-3 left-3 bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-full shadow-md text-slate-900">{post.category}</span>
                    </div>
                    <div className="px-2 flex-1 flex flex-col">
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition leading-snug line-clamp-3">{post.title}</h3>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-auto pt-4 border-t border-slate-100">{dStr} &bull; {post.author || 'Admin'}</p>
                    </div>
                </Link>
            )})}
            {filteredPosts.length === 0 && <p className="col-span-full text-center text-slate-500 py-10">Belum ada berita di kategori ini.</p>}
        </div>
      </main>
    </div>
  );
}