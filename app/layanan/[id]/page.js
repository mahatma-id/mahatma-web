"use client";
import { useEffect, useState, use } from 'react';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LayananDetail({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  const [service, setService] = useState(null);
  const [subServices, setSubServices] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => { 
        if(snap.exists()) setSettings(snap.data()); 
    });

    const fetchService = async () => {
      try {
        const docRef = doc(db, "services", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() });
        } else {
          setService(null);
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();

    const subServicesQuery = query(collection(db, "subservices"), where("parentId", "==", id));
    const unsubSubServices = onSnapshot(subServicesQuery, snap => {
        const subs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        subs.sort((a, b) => b.createdAt - a.createdAt); 
        setSubServices(subs);
    });

    return () => { 
        unsubSettings(); 
        unsubSubServices();
    };
  }, [id]);

  const rawPhone = settings.phone || "6285185639375";
  let waNumber = rawPhone.replace(/[^0-9]/g, '');
  if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.substring(1);
  }

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

  if (!service) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center px-4 transition-colors duration-300">
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-4">404</h1>
              <p className="text-slate-500 dark:text-slate-400 mb-6 md:mb-8 text-sm md:text-lg">Layanan tidak ditemukan.</p>
              <Link href="/#layanan" className="px-6 py-3 md:px-8 bg-emerald-600 text-white font-bold rounded-full text-[10px] md:text-xs tracking-widest uppercase hover:bg-emerald-700 transition">
                  Kembali ke Beranda
              </Link>
          </div>
      );
  }

  return (
    <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 min-h-screen flex flex-col selection:bg-emerald-500 selection:text-white relative transition-colors duration-300">
      
      <Navbar />

      {/* HEADER LAYANAN - Background Gelap */}
      <section className="bg-slate-900 text-white pt-32 pb-16 md:pt-40 md:pb-20 px-4 md:px-12 lg:px-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 md:-mr-20 md:-mt-20 w-40 h-40 md:w-80 md:h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="container mx-auto max-w-5xl text-center relative z-10">
            <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6 border border-emerald-500/30">
                Detail Layanan Utama
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6 drop-shadow-lg">
                {service.name}
            </h1>
        </div>
      </section>

      {/* KONTEN LAYANAN & SUB-LAYANAN */}
      <main className="flex-grow py-10 md:py-16 px-4 md:px-12 lg:px-16 -mt-10 md:-mt-12 relative z-20">
        <div className="container mx-auto max-w-6xl bg-white dark:bg-slate-900 p-6 md:p-12 lg:p-16 rounded-2xl md:rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors duration-300">
            
            {/* Bagian Deskripsi Utama */}
            <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 dark:bg-slate-800 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8 mx-auto transition-colors">
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 md:mb-6 transition-colors">Tentang Program Utama</h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm md:text-lg leading-relaxed md:leading-loose font-light whitespace-pre-line transition-colors">
                    {service.desc}
                </p>
            </div>

            {/* --- GRID KARTU SUB-LAYANAN --- */}
            {subServices.length > 0 && (
                <div className="mb-12 md:mb-20 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-center mb-10">
                        <span className="text-emerald-600 font-black tracking-widest uppercase text-[10px] md:text-xs mb-2 block">Pilihan Program</span>
                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">Kategori {service.name}</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {subServices.map(sub => (
                            <div key={sub.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group flex flex-col">
                                {sub.imgUrl ? (
                                    <div className="w-full h-40 md:h-52 overflow-hidden bg-slate-200 dark:bg-slate-800">
                                        <img src={sub.imgUrl} alt={sub.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                ) : (
                                    <div className="w-full h-2 bg-emerald-500"></div> // Garis warna jika tidak ada gambar
                                )}
                                <div className="p-6 md:p-8 flex flex-col flex-grow">
                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 transition-colors">{sub.title}</h3>
                                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed flex-grow font-light">
                                        {sub.desc}
                                    </p>
                                    <a 
                                        href={`https://wa.me/${waNumber}?text=Halo%20tim%20Mahatma,%20saya%20ingin%20info%20lebih%20lanjut%20tentang%20program%20*${sub.title}*%20(Kategori:%20${service.name}).`} 
                                        target="_blank" 
                                        className="inline-flex items-center text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest text-[10px] hover:text-orange-600 transition mt-auto"
                                    >
                                        Ask This Program <span className="ml-2 transform group-hover:translate-x-2 transition-transform">→</span>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CALL TO ACTION UMUM */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-10 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 text-center transition-colors duration-300">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3">Butuh program yang disesuaikan?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-5 md:mb-6">Tim pakar kami siap mendiskusikan kebutuhan spesifik organisasi Anda.</p>
                <a 
                    href={`https://wa.me/${waNumber}?text=Halo%20tim%20Mahatma,%20saya%20tertarik%20untuk%20berdiskusi%20lebih%20lanjut%20mengenai%20layanan%20*${service.name}*.`} 
                    target="_blank" 
                    className="inline-block px-8 py-3.5 md:px-10 md:py-4 bg-emerald-600 text-white font-bold tracking-widest uppercase rounded-full text-[10px] md:text-xs hover:bg-emerald-500 hover:-translate-y-1 transition duration-300 shadow-md"
                >
                    Konsultasi via WhatsApp
                </a>
            </div>
            
        </div>
      </main>

      <Footer />
    </div>
  );
}