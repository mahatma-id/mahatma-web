"use client";
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

// Import Tab Konten Utama
import TabUmum from './tabs/TabUmum';
import TabSlider from './tabs/TabSlider';
import TabPartners from './tabs/TabMitra';
import TabServices from './tabs/TabLayanan';
import TabSubServices from './tabs/TabSubLayanan';
import TabTeams from './tabs/TabTim';
import TabTestimonials from './tabs/TabTestimoni';
import TabFaqs from './tabs/TabFaq';
import TabPosts from './tabs/TabBlog';
import TabEvents from './tabs/TabEvents';
import TabProducts from './tabs/TabProducts';
import TabTentang from './tabs/TabTentang';
import TabFooter from './tabs/TabFooter';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    if (saved !== null) {
      setIsSidebarCollapsed(saved === 'true');
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('adminSidebarCollapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => { 
        if (currentUser) {
            const loginTime = localStorage.getItem('adminLoginTime');
            if (loginTime) {
                const now = Date.now();
                const diff = now - parseInt(loginTime, 10);
                
                // 24 jam = 86.400.000 ms
                if (diff > 86400000) {
                    await signOut(auth);
                    localStorage.removeItem('adminLoginTime');
                    setUser(null);
                    setErrorMessage("Sesi login Anda telah habis (24 jam). Silakan login kembali.");
                } else {
                    setUser(currentUser);
                }
            } else {
                localStorage.setItem('adminLoginTime', Date.now().toString());
                setUser(currentUser);
            }
        } else {
            setUser(null);
            localStorage.removeItem('adminLoginTime');
        }
        setAuthLoading(false); 
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async (e) => { 
      e.preventDefault(); 
      setLoading(true); 
      setErrorMessage('');
      try { 
          await signInWithEmailAndPassword(auth, email, password); 
          localStorage.setItem('adminLoginTime', Date.now().toString());
      } catch (err) { 
          setErrorMessage("Email atau kata sandi yang Anda masukkan salah."); 
      } 
      setLoading(false); 
  };
  
  const handleLogout = async () => { 
      if (confirm("Apakah Anda yakin ingin keluar dari Admin Panel?")) {
          await signOut(auth); 
          localStorage.removeItem('adminLoginTime');
      }
  };
  
  const switchTab = (tabId) => { 
      setActiveTab(tabId); 
      setIsSidebarOpen(false); 
  };

  const navItems = [
    {
      group: 'KONTEN UTAMA',
      items: [
        { 
          id: 'events', 
          label: 'Jadwal / Events', 
          badge: 'Form & HTM',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ) 
        },
        { 
          id: 'blog', 
          label: 'Insight (Berita & Opini)', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          ) 
        },
        { 
          id: 'layanan', 
          label: 'Kelola Layanan', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ) 
        },
        { 
          id: 'sublayanan', 
          label: 'Sub-Layanan', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ) 
        },
        { 
          id: 'mitra', 
          label: 'Mitra & Klien', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ) 
        }
      ]
    },
    {
      group: 'HALAMAN DEPAN & BRANDING',
      items: [
        { 
          id: 'umum', 
          label: 'Teks & Logo Utama', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          ) 
        },
        { 
          id: 'tentang', 
          label: 'Halaman Tentang Kami', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) 
        },
        { 
          id: 'slider', 
          label: 'Hero Slider', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ) 
        },
        { 
          id: 'products', 
          label: 'Produk & Portofolio', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ) 
        },
        { 
          id: 'tim', 
          label: 'Tim Pakar', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) 
        },
        { 
          id: 'testimoni', 
          label: 'Testimoni', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ) 
        },
        { 
          id: 'faq', 
          label: 'F.A.Q', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) 
        },
        { 
          id: 'footer', 
          label: 'Pengaturan Footer', 
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ) 
        }
      ]
    }
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white/95 p-3 shadow-2xl flex items-center justify-center border border-white/20 animate-pulse">
            <img src="/Logo Mahatma.png" alt="Logo Mahatma" className="w-full h-full object-contain" />
          </div>
          <div className="absolute -inset-2 border-2 border-emerald-500/30 border-t-emerald-500 rounded-3xl animate-spin"></div>
        </div>
        <p className="font-mono text-xs tracking-widest text-emerald-400 uppercase animate-pulse">Memverifikasi Otoritas Admin...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
        {/* Glow ambient background elements */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Card Container */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-3xl p-7 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
            
            {/* Top Brand Logo Paten dari Public */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-2xl shadow-xl border border-white/20 inline-block hover:scale-105 transition-transform duration-300">
                  <img src="/Logo Mahatma.png" alt="Mahatma Academy" className="h-12 w-auto object-contain" />
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Mahatma Admin Portal
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Selamat Datang</h1>
              <p className="text-xs text-slate-400 mt-1">Masuk untuk mengelola konten, jadwal event & sistem pendaftaran</p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2.5">
                <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">Alamat Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input 
                    type="email" 
                    required 
                    placeholder="admin@mahatmaacademy.id" 
                    value={email} 
                    onChange={(e)=>setEmail(e.target.value)} 
                    className="w-full bg-slate-950/60 border border-slate-700/80 pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e)=>setPassword(e.target.value)} 
                    className="w-full bg-slate-950/60 border border-slate-700/80 pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>MASUK KE PANEL ADMIN</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Halaman Web Utama
              </Link>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-600 mt-6 font-mono">
            Mahatma Academy &copy; {new Date().getFullYear()} &bull; Sesi Enkripsi 24 Jam
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-slate-800 overflow-hidden relative">
      
      {/* Mobile Top Header */}
      <div className="md:hidden absolute top-0 left-0 w-full bg-slate-950 text-white p-4 flex justify-between items-center z-40 border-b border-slate-800 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-md">
              <img src="/Logo Mahatma.png" alt="Logo Mahatma" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xs font-black text-white tracking-wider uppercase">Mahatma Admin</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg>
          </button>
      </div>
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      
      {/* Sleek Modern Sidebar */}
      <aside className={`fixed md:relative top-0 left-0 ${
        isSidebarCollapsed ? "md:w-20" : "md:w-72"
      } w-72 h-full bg-slate-950 text-slate-300 flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out border-r border-slate-800/80 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}>
        
        {/* Sidebar Header dengan Logo Paten dari Public */}
        <div className={`p-4 border-b border-slate-800/80 bg-slate-950 mt-14 md:mt-0 flex items-center ${
          isSidebarCollapsed ? "md:justify-center" : "justify-between"
        }`}>
            <div className={`flex items-center ${isSidebarCollapsed ? "md:justify-center" : "gap-3"} min-w-0`}>
                <button
                  type="button"
                  onClick={toggleSidebarCollapse}
                  title={isSidebarCollapsed ? "Perluas Sidebar" : "Persempit Sidebar (Hanya Ikon)"}
                  className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-white/5 border border-white/20 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                >
                  <img src="/Logo Mahatma.png" alt="Logo Mahatma" className="w-full h-full object-contain" />
                </button>
                {!isSidebarCollapsed && (
                  <div className="min-w-0">
                    <h1 className="text-sm font-black text-white tracking-wide leading-none truncate">Mahatma Academy</h1>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CMS Control Panel</span>
                    </div>
                  </div>
                )}
            </div>

            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={toggleSidebarCollapse} 
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title={isSidebarCollapsed ? "Perluas Sidebar" : "Persempit Sidebar (Hanya Ikon)"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isSidebarCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  )}
                </svg>
              </button>

              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
        </div>

        {/* Navigation Menus */}
        <div className={`flex-1 overflow-y-auto ${isSidebarCollapsed ? "px-2 py-4 space-y-4" : "px-3 py-5 space-y-6"} scrollbar-thin scrollbar-thumb-slate-800`}>
            {navItems.map((group, gIdx) => (
              <div key={gIdx}>
                {!isSidebarCollapsed ? (
                  <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-2 px-3">{group.group}</p>
                ) : (
                  <div className="my-2 border-t border-slate-800/80 mx-2"></div>
                )}
                <nav className="space-y-1">
                    {group.items.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                          <button 
                            key={tab.id} 
                            onClick={() => switchTab(tab.id)} 
                            title={tab.label}
                            className={`w-full flex items-center ${
                              isSidebarCollapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"
                            } rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer relative group ${
                              isActive 
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30' 
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}>{tab.icon}</span>
                              {!isSidebarCollapsed && <span>{tab.label}</span>}
                            </div>
                            {!isSidebarCollapsed && tab.badge && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-emerald-400'}`}>
                                {tab.badge}
                              </span>
                            )}
                            {isSidebarCollapsed && tab.badge && (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400"></span>
                            )}
                          </button>
                        );
                    })}
                </nav>
              </div>
            ))}
        </div>

        {/* User Card & Bottom Controls */}
        <div className={`border-t border-slate-800/80 bg-slate-950/70 ${isSidebarCollapsed ? "p-2.5" : "p-4"}`}>
            {!isSidebarCollapsed ? (
              <>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 mb-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-white truncate">{user.email}</p>
                        <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Administrator
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <Link 
                      href="/" 
                      target="_blank" 
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-[11px] font-bold transition shadow-sm"
                    >
                      <span>Lihat Web</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-950/40 hover:bg-red-600/90 text-red-300 hover:text-white border border-red-900/30 hover:border-transparent rounded-xl text-[11px] font-bold transition shadow-sm cursor-pointer"
                    >
                      <span>Keluar</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div 
                  title={user.email} 
                  className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm shrink-0 cursor-default"
                >
                  {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
                </div>
                <Link 
                  href="/" 
                  target="_blank" 
                  title="Buka Website"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </Link>
                <button 
                  onClick={handleLogout} 
                  title="Keluar (Logout)"
                  className="p-2.5 rounded-xl bg-red-950/50 hover:bg-red-600 text-red-400 hover:text-white transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 hidden md:flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              title={isSidebarCollapsed ? "Perluas Sidebar Menu" : "Sembunyikan / Perkecil Sidebar (Hanya Ikon)"}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center justify-center cursor-pointer shadow-2xs"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h10" />
              </svg>
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-emerald-700 uppercase font-black">
                {activeTab === 'events' ? 'Kelola Jadwal, Formulir & HTM Event' : activeTab === 'blog' ? 'Kelola Insight (Berita & Opini)' : `Kelola ${activeTab}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full border border-emerald-200">
              ● Sistem Aktif
            </span>
            <div className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-6">
          <div className={`${isSidebarCollapsed ? 'max-w-7xl' : 'max-w-6xl'} mx-auto transition-all duration-300`}>
            {/* Tab Title Header on Mobile */}
            <div className="md:hidden mb-4 border-b border-slate-200 pb-3">
              <h2 className="text-lg font-black text-slate-900 uppercase">
                {activeTab === 'events' ? 'Jadwal & Event' : `Kelola ${activeTab}`}
              </h2>
            </div>
            
            {/* Render Active Tab */}
            {activeTab === 'blog' && <TabPosts />}
            {activeTab === 'events' && <TabEvents />}
            {activeTab === 'layanan' && <TabServices />}
            {activeTab === 'sublayanan' && <TabSubServices />}
            {activeTab === 'mitra' && <TabPartners />}
            {activeTab === 'umum' && <TabUmum />}
            {activeTab === 'tentang' && <TabTentang />}
            {activeTab === 'slider' && <TabSlider />}
            {activeTab === 'products' && <TabProducts />}
            {activeTab === 'tim' && <TabTeams />}
            {activeTab === 'testimoni' && <TabTestimonials />}
            {activeTab === 'faq' && <TabFaqs />}
            {activeTab === 'footer' && <TabFooter />}
          </div>
        </div>
      </main>

    </div>
  );
}
