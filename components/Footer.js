"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from 'next-themes';

export default function Footer() {
  const [settings, setSettings] = useState({});
  const [partners, setPartners] = useState([]);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
      if (snap.exists()) setSettings(snap.data());
    });

    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => {
      setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubSettings();
      unsubPartners();
    };
  }, []);

  const rawPhone = settings.phone || "6285185639375";
  let waNumber = rawPhone.replace(/[^0-9]/g, '');
  if (waNumber.startsWith('0')) waNumber = '62' + waNumber.substring(1);

  const isDark = mounted && resolvedTheme === 'dark';
  const logoSrc = isDark ? "/Logo Mode Gelap.png" : "/Logo Mode Terang.png";

  return (
    <footer className="bg-white dark:bg-slate-950 pt-12 pb-6 md:pt-20 md:pb-10 px-4 md:px-12 lg:px-16 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300 mt-auto">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 mb-8 md:mb-16 text-center md:text-left">
          
          {/* KOLOM 1: LOGO & DESKRIPSI */}
          <div className="lg:col-span-4 lg:pr-8 flex flex-col items-center md:items-start">
            <Link href="/" className="inline-block mb-4 md:mb-8">
              {mounted ? (
                <img 
                  src={logoSrc} 
                  alt="Mahatma Academy" 
                  className="h-10 md:h-14 w-auto aspect-[4/1] object-contain object-left" 
                />
              ) : (
                <div className="h-10 md:h-14 w-36 bg-slate-200/20 rounded animate-pulse"></div>
              )}
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base leading-relaxed md:leading-loose mb-4 md:mb-8 max-w-xs md:max-w-none">
              {settings.footerDesc || "Mempersiapkan diri menghadapi perubahan zaman dan membuat bisnis Anda tetap relevan di masa depan."}
            </p>
            <div className="flex flex-col gap-2 w-full">
              <a 
                href={`https://wa.me/${waNumber}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center md:justify-start gap-2 text-emerald-600 hover:text-emerald-700 transition"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm font-bold">{rawPhone}</span>
              </a>
              {settings.email && (
                <a 
                  href={`mailto:${settings.email}`} 
                  className="flex items-center justify-center md:justify-start gap-2 text-slate-500 hover:text-emerald-600 transition"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">{settings.email}</span>
                </a>
              )}
              {settings.address && (
                <div className="flex items-start justify-center md:justify-start gap-2 text-slate-500">
                  <svg className="w-4 h-4 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-left">{settings.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* KOLOM 2: SOSIAL MEDIA */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 md:mb-6 uppercase tracking-wider text-[10px] md:text-sm">Follow Us</h4>
            <div className="flex justify-center md:justify-start gap-3 md:gap-4">
              <a href={settings.linkedin || "#"} target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-emerald-600 hover:text-emerald-600 transition"><span className="text-xs md:text-sm font-bold">in</span></a>
              <a href={settings.youtube || "#"} target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-red-600 hover:text-red-600 transition"><span className="text-xs md:text-sm font-bold">yt</span></a>
              <a href={settings.instagram || "#"} target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-pink-600 hover:text-pink-600 transition"><span className="text-xs md:text-sm font-bold">ig</span></a>
            </div>
          </div>

          {/* KOLOM 3: LOKASI / MAPS */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-slate-900 dark:text-white mb-3 md:mb-6 uppercase tracking-wider text-[10px] md:text-sm">Location</h4>
            {settings.mapUrl ? (
              <a href={settings.mapLink || "#"} target="_blank" rel="noopener noreferrer" className="block w-full aspect-square rounded-xl overflow-hidden border border-slate-200 hover:opacity-80 transition">
                <img src={settings.mapUrl} className="w-full h-full object-cover" alt="Lokasi Kami" />
              </a>
            ) : (
              <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400">Maps belum diatur</div>
            )}
          </div>

          {/* KOLOM 4: MITRA KERJA */}
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
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada mitra.</p>
            )}
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 md:pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-[9px] md:text-[11px] font-bold tracking-widest uppercase text-slate-400">
          <p className="mb-3 md:mb-0">&copy; {new Date().getFullYear()} Mahatma Academy. All rights reserved.</p>
          <div className="flex justify-center gap-4 md:gap-6">
            <Link href="/privacy-policy" className="hover:text-emerald-600 transition">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-emerald-600 transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
