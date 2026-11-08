"use client";
import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ProdukPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unsubProducts(); };
  }, []);

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[ping_1.5s_infinite]"></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-[ping_1.5s_infinite_200ms]"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[ping_1.5s_infinite_400ms]"></div>
              </div>
          </div>
      );
  }

  return (
    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 min-h-screen flex flex-col transition-colors duration-300">
      
      <Navbar />

      {/* HEADER SECTION */}
      <section className="bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-20 px-4 md:px-12 lg:px-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
            <span className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-500/30">
                Katalog Lengkap
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg">
                Products & Portfolio
            </h1>
            <p className="text-slate-300 md:text-lg max-w-2xl mx-auto font-light">
                Eksplorasi modul pelatihan, layanan siap pakai, dan jejak keberhasilan kami mendampingi organisasi Anda mencapai standar tertinggi.
            </p>
        </div>
      </section>

      {/* KONTEN PRODUK (SEMUA) */}
      <main className="flex-grow py-16 px-4 md:px-12 lg:px-16 -mt-10 relative z-20">
        <div className="container mx-auto max-w-7xl">
            {products.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Katalog sedang dalam persiapan. Silakan kembali lagi nanti.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {products.map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-950 rounded-2xl md:rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group flex flex-col">
                            <div className="w-full h-48 md:h-60 bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                                <img src={p.imgUrl || 'https://placehold.co/600x400?text=No+Image'} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                {p.label && (
                                    <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm text-emerald-600 dark:text-emerald-400">
                                        {p.label}
                                    </span>
                                )}
                            </div>
                            <div className="p-6 md:p-8 flex flex-col flex-grow">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 leading-snug group-hover:text-emerald-600 transition-colors">{p.name}</h3>
                                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-4 mb-6 flex-grow font-light leading-relaxed">{p.desc}</p>
                                
                                <a 
                                    href={p.btnLink || `https://wa.me/${waNumber}?text=Halo%20tim%20Mahatma,%20saya%20tertarik%20dengan%20produk/portofolio%20*${p.name}*.%20Boleh%20minta%20info%20lebih%20lanjut?`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block w-full text-center px-6 py-3.5 md:py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all duration-300 shadow-sm"
                                >
                                    {p.btnText || 'Tanya Project Ini'}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      <Footer />
    </div>
  );
}