"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const isHomePage = pathname === '/';
  const isTransparent = isHomePage && !isScrolled && !isMobileMenuOpen;
  const isDarkBackground = isTransparent || (mounted && resolvedTheme === 'dark');
  const logoSrc = isDarkBackground ? "/Logo Mode Gelap.png" : "/Logo Mode Terang.png";

  const navLinks = [
    { 
      label: 'ABOUT', 
      href: '/tentang-kami',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      desc: 'Visi, misi & nilai lembaga'
    },
    { 
      label: 'SERVICE', 
      href: isHomePage ? '#layanan' : '/#layanan',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      desc: 'Program konsultasi & transformasi'
    },
    { 
      label: 'PRODUCT', 
      href: '/produk',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      desc: 'Solusi & modul pendidikan'
    },
    { 
      label: 'TEAM', 
      href: '/tim',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      desc: 'Dewan pakar & konsultan'
    },
    { 
      label: 'INSIGHT', 
      href: '/insight',
      badge: 'Baru',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      desc: 'Berita resmi & kolom opini'
    },
    { 
      label: 'EVENTS', 
      href: '/events',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      desc: 'Seminar, workshop & HTM'
    },
    { 
      label: 'MITRA', 
      href: '/mitra-kerja',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      desc: 'Kolaborasi & jejaring kerja'
    },
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${
        isTransparent 
          ? 'bg-transparent py-4 md:py-6' 
          : 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm border-b border-slate-200/60 dark:border-slate-800/60 py-3 md:py-3.5'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 flex justify-between items-center max-w-7xl">
          
          {/* LOGO MAHATMA ACADEMY */}
          <Link href="/" className="flex items-center gap-2 group z-50 shrink-0">
            {mounted ? (
              <img 
                src={logoSrc} 
                alt="Mahatma Academy for Sustainable Education" 
                className="h-9 sm:h-11 md:h-12 w-auto aspect-[4/1] object-contain object-left transition-transform duration-300 group-hover:scale-102" 
              />
            ) : (
              <div className="h-9 sm:h-11 md:h-12 w-36 bg-slate-200/20 animate-pulse rounded"></div>
            )}
          </Link>

          {/* DESKTOP NAVIGATION MENU (Muncul di layar besar XL ke atas) */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-500/5 dark:bg-white/5 p-1 rounded-full border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
            {navLinks.map((item, idx) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link 
                  key={idx} 
                  href={item.href} 
                  className={`relative px-4 py-2 rounded-full font-extrabold text-[11px] tracking-wider uppercase transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black' 
                      : isTransparent
                        ? 'text-white/90 hover:text-white hover:bg-white/10'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-amber-500 text-white text-[8px] font-black rounded-full shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT CONTROLS: THEME TOGGLE, CTA & SHIELD ADMIN LINK */}
          <div className="hidden xl:flex items-center gap-3">
            <div className={`p-1 rounded-full ${isTransparent ? 'text-white' : ''}`}>
              <ThemeToggle />
            </div>
                   
            {/* Admin Portal Shortcut (Shield Icon) */}
            <Link 
              href="/admin" 
              title="Admin Portal" 
              className={`p-2 rounded-full transition-all border ${
                isTransparent 
                  ? 'text-white/90 border-white/20 hover:bg-white/10' 
                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </Link>
          </div>

          {/* TABLET & MOBILE TRIGGER (Layar HP & Tab / iPad < 1280px) */}
          <div className="xl:hidden flex items-center gap-2 z-50">
            <div className={!isTransparent ? '' : 'text-white'}>
              <ThemeToggle />
            </div>

            <Link 
              href="/admin" 
              title="Admin Portal"
              className={`p-2 rounded-full border transition ${
                isTransparent 
                  ? 'text-white border-white/20 hover:bg-white/10' 
                  : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </Link>

            {/* Hamburger Button with Sleek Design */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              aria-label="Menu Navigasi"
              className={`p-2 rounded-xl border transition-all ${
                isMobileMenuOpen
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : isTransparent
                    ? 'text-white border-white/30 bg-white/10 hover:bg-white/20'
                    : 'text-slate-800 dark:text-white border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
              }`}
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* MODERN SLIDE-OVER DRAWER KHUSUS HP & TABLET/IPAD */}
      <div 
        className={`xl:hidden fixed inset-0 z-[110] transition-all duration-300 ${
          isMobileMenuOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none delay-150'
        }`}
      >
        {/* Dark Backdrop */}
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Floating Menu Card / Sheet */}
        <aside 
          className={`absolute right-0 top-0 h-full w-full sm:w-[420px] md:w-[460px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img 
                src={logoSrc} 
                alt="Mahatma Logo" 
                className="h-9 w-auto object-contain" 
              />
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              aria-label="Tutup Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Content: Navigation Cards (Sangat keren di Tablet & HP) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-2">
              Menu Navigasi
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {navLinks.map((item, idx) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link 
                    key={idx} 
                    href={item.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                      isActive 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 shadow-xs' 
                        : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl transition ${
                      isActive 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-600 group-hover:text-white shadow-xs'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-black text-xs uppercase tracking-wider ${
                          isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'
                        }`}>
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[8px] font-black rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Banner Khusus Kolom Opini & Berita Insight */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md">
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                MAHATMA INSIGHT
              </span>
              <h4 className="text-sm font-black mt-2 leading-snug">
                Baca Wawasan, Berita Resmi &amp; Opini Pakar
              </h4>
              <p className="text-[11px] text-white/80 mt-1 mb-3">
                Kumpulan pemikiran strategis dan update kegiatan pendidikan berkelanjutan.
              </p>
              <Link 
                href="/insight"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-block px-4 py-1.5 bg-white text-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:bg-slate-100 transition"
              >
                Buka Insight &rarr;
              </Link>
            </div>
          </div>

          {/* Drawer Footer: Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
            <Link 
              href="/#kontak" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition text-center uppercase tracking-widest shadow-md flex items-center justify-center gap-2"
            >
              <span>Konsultasi &amp; Kerjasama</span>
              <span>&rarr;</span>
            </Link>

            <div className="flex items-center justify-between text-xs text-slate-500 px-2 pt-1 font-semibold">
              <Link 
                href="/admin" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-1.5 hover:text-emerald-600 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Portal Redaksi Admin</span>
              </Link>
              <span>v1.0</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
