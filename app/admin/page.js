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
  
  const [activeTab, setActiveTab] = useState('umum');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => { 
        setUser(currentUser); 
        setAuthLoading(false); 
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async (e) => { 
      e.preventDefault(); setLoading(true); 
      try { await signInWithEmailAndPassword(auth, email, password); alert("Login Berhasil!"); } 
      catch (err) { alert("Email/Password salah!"); } 
      setLoading(false); 
  };
  
  const handleLogout = async () => { await signOut(auth); alert("Logout Berhasil"); };
  const switchTab = (tabId) => { setActiveTab(tabId); setIsSidebarOpen(false); };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><p className="animate-pulse font-bold tracking-widest">MENGECEK OTORITAS...</p></div>;
  
  if (!user) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
          <form onSubmit={handleLogin} className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md">
              <h1 className="text-2xl font-black text-slate-900 mb-2">Admin Login</h1>
              <div className="space-y-4 mt-6">
                  <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email</label>
                      <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border-2 p-3 rounded-xl focus:border-orange-500 outline-none" />
                  </div>
                  <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</label>
                      <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border-2 p-3 rounded-xl focus:border-orange-500 outline-none" />
                  </div>
                  <button disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition">{loading ? 'Loading...' : 'MASUK'}</button>
              </div>
          </form>
      </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      <div className="md:hidden absolute top-0 left-0 w-full bg-slate-950 text-white p-4 flex justify-between items-center z-20 shadow-md">
          <h1 className="text-sm font-black text-orange-500 tracking-widest uppercase">Admin Panel</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="focus:outline-none bg-slate-800 p-2 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg>
          </button>
      </div>
      
      {isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-20" onClick={() => setIsSidebarOpen(false)}></div>}
      
      <aside className={`fixed md:relative top-0 left-0 w-64 h-full bg-slate-900 text-slate-300 flex flex-col shadow-xl z-30 transition-transform duration-300 border-r border-slate-800 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5 border-b border-slate-800 bg-slate-950 mt-14 md:mt-0 flex justify-between items-center">
            <div>
                <h1 className="text-lg font-black text-orange-500 tracking-widest uppercase hidden md:block">Admin Panel</h1>
                <p className="text-[10px] font-bold text-slate-500 mt-1 tracking-widest truncate">{user.email}</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 px-2">Konten Utama</p>
                <nav className="space-y-1">
                    {[
                        { id: 'blog', label: 'Wawasan (Blog)' }, 
                        { id: 'events', label: 'Jadwal / Events' }, 
                        { id: 'layanan', label: 'Kelola Layanan' }, 
                        { id: 'sublayanan', label: 'Sub-Layanan' }, 
                        { id: 'mitra', label: 'Mitra & Klien' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => switchTab(tab.id)} className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>
            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 px-2">Halaman Depan</p>
                <nav className="space-y-1">
                    {[
                        { id: 'umum', label: 'Teks & Logo Utama' }, 
                        { id: 'tentang', label: 'Halaman Tentang Kami' }, 
                        { id: 'slider', label: 'Hero Slider' }, 
                        { id: 'products', label: 'Produk & Portofolio' }, 
                        { id: 'tim', label: 'Tim Pakar' }, 
                        { id: 'testimoni', label: 'Testimoni' }, 
                        { id: 'faq', label: 'F.A.Q' }, 
                        { id: 'footer', label: 'Pengaturan Footer' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => switchTab(tab.id)} className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2 pb-6 md:pb-4">
            <Link href="/" target="_blank" className="flex-1 text-center py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold transition">WEB ↗</Link>
            <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white rounded text-[10px] font-bold transition">LOGOUT</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-full bg-slate-50">
        <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">
                {activeTab === 'blog' ? 'Kelola Wawasan (Blog)' : activeTab === 'products' ? 'Produk & Portofolio' : `Kelola ${activeTab}`}
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
      </main>
    </div>
  );
}