"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import 'react-quill-new/dist/quill.snow.css';
import Link from 'next/link';

// Import Quill secara dinamis agar tidak error di sisi Server Next.js
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeTab, setActiveTab] = useState('umum');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Referensi untuk Quill Editor
  const quillRef = useRef(null);

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'mahatma_upload'); 
    const cloudName = 'dgexjl9sf'; 

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || "Gagal upload gambar");
  };

  // Handler khusus untuk menyisipkan gambar langsung ke dalam editor teks
  const imageHandler = () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = async () => {
          const file = input.files[0];
          if (file) {
              setLoading(true);
              try {
                  const url = await uploadToCloudinary(file);
                  const quill = quillRef.current.getEditor();
                  const range = quill.getSelection(true);
                  // Sisipkan gambar ke posisi kursor
                  quill.insertEmbed(range.index, 'image', url);
                  // Pindahkan kursor ke setelah gambar
                  quill.setSelection(range.index + 1);
              } catch (error) {
                  alert("Gagal mengunggah gambar ke dalam teks.");
              }
              setLoading(false);
          }
      };
  };

  // Konfigurasi Toolbar Editor Berita (dengan dukungan gambar)
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'], // Tambahkan opsi 'image'
        ['clean']
      ],
      handlers: {
        image: imageHandler // Gunakan fungsi kustom kita untuk upload
      }
    }
  }), []);

  const [settings, setSettings] = useState({ 
      logoUrl: '', missionTitle: '', missionDesc: '', serviceTitle: '', serviceDesc: '', serviceImageUrl: '',
      aboutTitle: '', aboutDesc: '', ctaTitle: '', ctaDesc: '',
      footerDesc: '', phone: '', linkedin: '', youtube: '', instagram: ''
  });
  
  const [sliders, setSliders] = useState([]);
  const [slideTitle, setSlideTitle] = useState(''); const [slideSubtitle, setSlideSubtitle] = useState(''); const [slideBtnText, setSlideBtnText] = useState(''); const [slideBtnLink, setSlideBtnLink] = useState(''); const [slideImageFile, setSlideImageFile] = useState(null);

  const [partners, setPartners] = useState([]);
  const [partnerName, setPartnerName] = useState('');
  const [partnerImgFile, setPartnerImgFile] = useState(null);
  const [partnerField, setPartnerField] = useState(''); 

  const [services, setServices] = useState([]);
  const [serviceName, setServiceName] = useState(''); const [serviceDesc, setServiceDesc] = useState(''); const [serviceLink, setServiceLink] = useState('');

  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState(''); const [teamRole, setTeamRole] = useState(''); const [teamImgFile, setTeamImgFile] = useState(null);

  const [testimonials, setTestimonials] = useState([]);
  const [testiName, setTestiName] = useState(''); const [testiCompany, setTestiCompany] = useState(''); const [testiText, setTestiText] = useState('');

  const [faqs, setFaqs] = useState([]);
  const [faqQ, setFaqQ] = useState(''); const [faqA, setFaqA] = useState('');

  const [posts, setPosts] = useState([]);
  const [postTitle, setPostTitle] = useState(''); const [postContent, setPostContent] = useState(''); const [postCategory, setPostCategory] = useState('News'); const [postCoverUrl, setPostCoverUrl] = useState(''); const [postDateline, setPostDateline] = useState(''); const [postAuthor, setPostAuthor] = useState(''); const [postTags, setPostTags] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); setAuthLoading(false);
    });

    getDoc(doc(db, "settings", "general")).then(snap => { if(snap.exists()) setSettings(snap.data()); });
    const unsubSliders = onSnapshot(query(collection(db, "sliders"), orderBy("createdAt", "desc")), snap => setSliders(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPartners = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => setPartners(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubServices = onSnapshot(query(collection(db, "services"), orderBy("createdAt", "desc")), snap => setServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "asc")), snap => setTeams(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubTestimonials = onSnapshot(query(collection(db, "testimonials"), orderBy("createdAt", "desc")), snap => setTestimonials(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubFaqs = onSnapshot(query(collection(db, "faqs"), orderBy("createdAt", "asc")), snap => setFaqs(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => setPosts(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubscribeAuth(); unsubSliders(); unsubPartners(); unsubServices(); unsubTeams(); unsubTestimonials(); unsubFaqs(); unsubPosts(); };
  }, []);

  const handleLogin = async (e) => { e.preventDefault(); setLoading(true); try { await signInWithEmailAndPassword(auth, email, password); alert("Login Berhasil!"); } catch (err) { alert("Email/Password salah!"); } setLoading(false); };
  const handleLogout = async () => { await signOut(auth); alert("Logout Berhasil"); };

  const saveSettings = async (e) => { e.preventDefault(); setLoading(true); try { await setDoc(doc(db, "settings", "general"), settings, { merge: true }); alert("Tersimpan!"); } catch(err) { alert(err.message); } setLoading(false); };
  
  const addSlider = async (e) => { e.preventDefault(); if(!slideImageFile) return alert("Pilih gambar!"); setLoading(true); try { const imageUrl = await uploadToCloudinary(slideImageFile); await addDoc(collection(db, "sliders"), { title: slideTitle, subtitle: slideSubtitle, btnText: slideBtnText, btnLink: slideBtnLink, imageUrl, createdAt: serverTimestamp() }); alert("Berhasil!"); setSlideTitle(''); setSlideSubtitle(''); setSlideBtnText(''); setSlideBtnLink(''); setSlideImageFile(null); } catch(err) { alert(err.message); } setLoading(false); };
  
  const addPartner = async (e) => { 
      e.preventDefault(); setLoading(true); 
      try { 
          let imgUrl = null; if (partnerImgFile) imgUrl = await uploadToCloudinary(partnerImgFile);
          await addDoc(collection(db, "partners"), { name: partnerName, imgUrl: imgUrl, field: partnerField, createdAt: serverTimestamp() }); 
          alert("Berhasil!"); setPartnerName(''); setPartnerField(''); setPartnerImgFile(null); document.getElementById('partnerFileInput').value = '';
      } catch(err) { alert(err.message); } setLoading(false); 
  };

  const addService = async (e) => { e.preventDefault(); setLoading(true); try { await addDoc(collection(db, "services"), { name: serviceName, desc: serviceDesc, link: serviceLink || "#", createdAt: serverTimestamp() }); alert('Berhasil!'); setServiceName(''); setServiceDesc(''); setServiceLink(''); } catch(err) { alert(err.message); } setLoading(false); };
  const addTeam = async (e) => { e.preventDefault(); if(!teamImgFile) return alert("Pilih foto!"); setLoading(true); try { const img = await uploadToCloudinary(teamImgFile); await addDoc(collection(db, "teams"), { name: teamName, role: teamRole, img, createdAt: serverTimestamp() }); alert("Berhasil!"); setTeamName(''); setTeamRole(''); setTeamImgFile(null); } catch(err) { alert(err.message); } setLoading(false); };
  const addTestimonial = async (e) => { e.preventDefault(); setLoading(true); try { await addDoc(collection(db, "testimonials"), { name: testiName, company: testiCompany, text: testiText, createdAt: serverTimestamp() }); alert("Berhasil!"); setTestiName(''); setTestiCompany(''); setTestiText(''); } catch(err) { alert(err.message); } setLoading(false); };
  const addFaq = async (e) => { e.preventDefault(); setLoading(true); try { await addDoc(collection(db, "faqs"), { q: faqQ, a: faqA, createdAt: serverTimestamp() }); alert("Berhasil!"); setFaqQ(''); setFaqA(''); } catch(err) { alert(err.message); } setLoading(false); };
  
  const addPost = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
          let slug = postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          if (!slug) slug = 'berita-' + Date.now();
          const docSnap = await getDoc(doc(db, "posts", slug));
          if (docSnap.exists()) slug = slug + '-' + Math.floor(Math.random() * 1000);
          
          await setDoc(doc(db, "posts", slug), { 
              title: postTitle, 
              category: postCategory, 
              content: postContent, // Konten dari Quill (Bisa memuat tag <img src="...">)
              coverUrl: postCoverUrl, 
              dateline: postDateline, 
              author: postAuthor || 'Tim Redaksi', 
              tags: postTags, 
              views: 0, 
              createdAt: serverTimestamp() 
          });
          
          alert('Berita Diterbitkan!'); 
          setPostTitle(''); setPostContent(''); setPostCoverUrl(''); setPostDateline(''); setPostAuthor(''); setPostTags('');
      } catch(err) { alert(err.message); } setLoading(false);
  };

  const deleteItem = async (col, id) => { if(confirm(`Hapus data ini permanen?`)) await deleteDoc(doc(db, col, id)); };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><p className="animate-pulse font-bold tracking-widest">MENGECEK OTORITAS...</p></div>;
  
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <form onSubmit={handleLogin} className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Admin Login</h1>
        <div className="space-y-4 mt-6">
          <div><label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email</label><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border-2 p-3 rounded-xl focus:border-orange-500 outline-none" /></div>
          <div><label className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</label><input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border-2 p-3 rounded-xl focus:border-orange-500 outline-none" /></div>
          <button disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition">{loading ? 'Loading...' : 'MASUK'}</button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden absolute top-0 left-0 w-full bg-slate-950 text-white p-4 flex justify-between items-center z-20 shadow-md">
          <h1 className="text-sm font-black text-orange-500 tracking-widest uppercase">Admin Panel</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="focus:outline-none bg-slate-800 p-2 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg>
          </button>
      </div>

      {/* OVERLAY */}
      {isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-20" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
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
                    {[{ id: 'blog', label: 'Wawasan (Blog)' }, { id: 'layanan', label: 'Kelola Layanan' }, { id: 'mitra', label: 'Mitra & Klien' }].map(tab => (
                        <button key={tab.id} onClick={() => {setActiveTab(tab.id); setIsSidebarOpen(false);}} className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>
            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 px-2">Halaman Depan</p>
                <nav className="space-y-1">
                    {[{ id: 'umum', label: 'Teks & Logo Utama' }, { id: 'slider', label: 'Hero Slider' }, { id: 'tim', label: 'Tim Pakar' }, { id: 'testimoni', label: 'Testimoni' }, { id: 'faq', label: 'F.A.Q' }, { id: 'footer', label: 'Pengaturan Footer' }].map(tab => (
                        <button key={tab.id} onClick={() => {setActiveTab(tab.id); setIsSidebarOpen(false);}} className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2 pb-6 md:pb-4">
            <Link href="/" target="_blank" className="flex-1 text-center py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold transition">WEB ↗</Link>
            <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white rounded text-[10px] font-bold transition">LOGOUT</button>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-full bg-slate-50">
        <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">
                {activeTab === 'blog' ? 'Kelola Wawasan (Blog)' : activeTab === 'tim' ? 'Kelola Tim Pakar' : activeTab === 'faq' ? 'Kelola F.A.Q' : activeTab === 'umum' ? 'Pengaturan Teks & Logo' : `Kelola ${activeTab}`}
            </h2>
        </div>
        
        {/* TAB UMUM */}
        {activeTab === 'umum' && (
            <form onSubmit={saveSettings} className="space-y-6 max-w-4xl bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div><label className="font-bold text-slate-700 text-sm">URL Logo Utama</label><input type="url" value={settings.logoUrl || ''} onChange={e=>setSettings({...settings, logoUrl: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 focus:border-orange-500 outline-none text-sm" placeholder="https://..." /></div>
                
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Bagian: Our Mission</h3>
                    <input type="text" value={settings.missionTitle || ''} onChange={e=>setSettings({...settings, missionTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Judul Mission" />
                    <textarea value={settings.missionDesc || ''} onChange={e=>setSettings({...settings, missionDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" rows="3" placeholder="Deskripsi Mission"></textarea>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Bagian: Our Service</h3>
                    <input type="text" value={settings.serviceTitle || ''} onChange={e=>setSettings({...settings, serviceTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Judul Service" />
                    <textarea value={settings.serviceDesc || ''} onChange={e=>setSettings({...settings, serviceDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-4 text-sm" rows="3" placeholder="Deskripsi Service"></textarea>
                    
                    <div className="border border-slate-200 p-3 md:p-4 rounded-lg bg-white">
                        <label className="text-xs md:text-sm font-bold text-slate-700 block mb-2">Upload Gambar Ilustrasi Layanan</label>
                        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                            <input type="file" onChange={async (e) => { 
                                if(e.target.files[0]) { 
                                    setLoading(true); 
                                    try { 
                                        const url = await uploadToCloudinary(e.target.files[0]); 
                                        setSettings({...settings, serviceImageUrl: url}); 
                                        alert("Gambar diunggah! Jangan lupa klik Simpan Pengaturan."); 
                                    } catch(err) { alert(err.message); } 
                                    setLoading(false); 
                                } 
                            }} accept="image/*" className="text-xs border p-2 rounded w-full" />
                            {settings.serviceImageUrl && <img src={settings.serviceImageUrl} className="h-16 w-16 object-cover rounded border" alt="Preview"/>}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-indigo-600 border-b pb-2 text-sm md:text-base">Halaman: Tentang Kami (About Us)</h3>
                    <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">Judul Utama (Hero)</label>
                    <input type="text" value={settings.aboutTitle || ''} onChange={e=>setSettings({...settings, aboutTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Cth: Membangun Masa Depan yang Berkelanjutan." />
                    <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
                    <textarea value={settings.aboutDesc || ''} onChange={e=>setSettings({...settings, aboutDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" rows="3" placeholder="Deskripsi singkat..."></textarea>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-red-600 border-b pb-2 text-sm md:text-base">Bagian: Call To Action (Siap Untuk Berubah?)</h3>
                    <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">Judul Call To Action</label>
                    <input type="text" value={settings.ctaTitle || ''} onChange={e=>setSettings({...settings, ctaTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Cth: Siap Untuk Berubah?" />
                    <label className="text-xs md:text-sm font-bold text-slate-700 block mb-1">Deskripsi</label>
                    <textarea value={settings.ctaDesc || ''} onChange={e=>setSettings({...settings, ctaDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" rows="3" placeholder="Deskripsi ajakan..."></textarea>
                </div>
                
                <button disabled={loading} className="bg-orange-600 text-white px-6 md:px-8 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Simpan Pengaturan</button>
            </form>
        )}

        {/* TAB FOOTER */}
        {activeTab === 'footer' && (
            <form onSubmit={saveSettings} className="space-y-6 max-w-4xl bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="p-4 bg-slate-50 rounded-xl border"><h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Profil & Kontak Footer</h3><label className="text-xs md:text-sm font-bold text-slate-700">Deskripsi Singkat</label><textarea value={settings.footerDesc || ''} onChange={e=>setSettings({...settings, footerDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-4 text-sm" rows="3"></textarea><label className="text-xs md:text-sm font-bold text-slate-700">Telepon / WhatsApp</label><input type="text" value={settings.phone || ''} onChange={e=>setSettings({...settings, phone: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" /></div>
                <div className="p-4 bg-slate-50 rounded-xl border"><h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Social Media</h3><label className="text-xs md:text-sm font-bold text-slate-700">LinkedIn</label><input type="url" value={settings.linkedin || ''} onChange={e=>setSettings({...settings, linkedin: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" /><label className="text-xs md:text-sm font-bold text-slate-700">YouTube</label><input type="url" value={settings.youtube || ''} onChange={e=>setSettings({...settings, youtube: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" /><label className="text-xs md:text-sm font-bold text-slate-700">Instagram</label><input type="url" value={settings.instagram || ''} onChange={e=>setSettings({...settings, instagram: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" /></div>
                <button disabled={loading} className="bg-orange-600 text-white px-6 md:px-8 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Simpan Pengaturan Footer</button>
            </form>
        )}

        {/* TAB SLIDER */}
        {activeTab === 'slider' && (
            <div className="max-w-4xl"><form onSubmit={addSlider} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="file" onChange={e=>setSlideImageFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" /><input type="text" placeholder="Judul Slider Utama" value={slideTitle} onChange={e=>setSlideTitle(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/><input type="text" placeholder="Deskripsi Pendek" value={slideSubtitle} onChange={e=>setSlideSubtitle(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" /><div className="flex flex-col md:flex-row gap-3 md:gap-4"><input type="text" placeholder="Teks Tombol" value={slideBtnText} onChange={e=>setSlideBtnText(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" /><input type="text" placeholder="Link Tombol" value={slideBtnLink} onChange={e=>setSlideBtnLink(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" /></div><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Tambah Slider</button></form><div className="grid gap-4">{sliders.map(s => (<div key={s.id} className="flex flex-col md:flex-row bg-white p-4 rounded-xl border md:items-center gap-4"><img src={s.imageUrl} className="w-full md:w-24 h-32 md:h-16 object-cover rounded-lg" /><div className="flex-1 text-center md:text-left"><h4 className="font-bold text-sm">{s.title}</h4></div><button onClick={()=>deleteItem('sliders', s.id)} className="text-red-500 font-bold px-4 py-2 border border-red-100 rounded md:border-none md:p-0 w-full md:w-auto">Hapus</button></div>))}</div></div>
        )}

        {/* TAB MITRA */}
        {activeTab === 'mitra' && (
            <div className="max-w-4xl"><form onSubmit={addPartner} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><p className="text-xs md:text-sm text-slate-500 mb-2">Tambahkan Logo/Gambar (Opsional), Nama Perusahaan, dan Bidangnya.</p><input id="partnerFileInput" type="file" onChange={e=>setPartnerImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" /><input type="text" placeholder="Nama Perusahaan (Wajib diisi)" value={partnerName} onChange={e=>setPartnerName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold uppercase text-sm" required/><input type="text" placeholder="Bidang/Layanan (Cth: Pelatihan SDM)" value={partnerField} onChange={e=>setPartnerField(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required/><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">{loading ? 'Menyimpan...' : 'Tambah Mitra'}</button></form><div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">{partners.map(p => (<div key={p.id} className="bg-white p-3 md:p-4 rounded-xl border flex flex-col justify-between items-center text-center">{p.imgUrl ? (<img src={p.imgUrl} alt={p.name} className="h-10 md:h-12 w-auto object-contain mb-3" />) : (<div className="h-10 md:h-12 flex items-center justify-center mb-3"><h4 className="font-bold text-slate-600 uppercase text-xs">{p.name}</h4></div>)}<button onClick={()=>deleteItem('partners', p.id)} className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded w-full mt-auto">Hapus</button></div>))}</div></div>
        )}

        {/* TAB LAYANAN */}
        {activeTab === 'layanan' && (
            <div className="max-w-4xl"><form onSubmit={addService} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="text" placeholder="Nama Layanan (Cth: Consulting)" value={serviceName} onChange={e=>setServiceName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/><textarea rows="3" placeholder="Deskripsi Singkat..." value={serviceDesc} onChange={e=>setServiceDesc(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea><input type="text" placeholder="Link Detail (Opsional)" value={serviceLink} onChange={e=>setServiceLink(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" /><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Tambah Layanan</button></form><div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">{services.map(s => (<div key={s.id} className="bg-white p-4 md:p-6 rounded-xl border flex flex-col"><h4 className="font-bold text-base md:text-lg mb-2">{s.name}</h4><button onClick={()=>deleteItem('services', s.id)} className="mt-auto text-red-500 text-xs md:text-sm font-bold bg-red-50 py-2 rounded">Hapus</button></div>))}</div></div>
        )}

        {/* TAB TIM */}
        {activeTab === 'tim' && (
            <div className="max-w-4xl"><form onSubmit={addTeam} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="file" onChange={e=>setTeamImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" required /><input type="text" placeholder="Nama Lengkap & Gelar" value={teamName} onChange={e=>setTeamName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/><input type="text" placeholder="Jabatan / Role" value={teamRole} onChange={e=>setTeamRole(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required/><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">{loading ? 'Upload Foto...' : 'Tambah Anggota Tim'}</button></form><div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">{teams.map(t => (<div key={t.id} className="bg-white p-3 md:p-4 rounded-xl border flex flex-col items-center text-center"><img src={t.img} className="w-16 h-16 rounded-full object-cover mb-3"/><h4 className="font-bold text-xs md:text-sm">{t.name}</h4><p className="text-[9px] md:text-[10px] text-orange-500 mb-3 line-clamp-1">{t.role}</p><button onClick={()=>deleteItem('teams', t.id)} className="text-red-500 text-xs font-bold w-full bg-red-50 py-1.5 md:py-2 rounded mt-auto">Hapus</button></div>))}</div></div>
        )}

        {/* TAB TESTIMONI */}
        {activeTab === 'testimoni' && (
            <div className="max-w-4xl"><form onSubmit={addTestimonial} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="text" placeholder="Nama Klien" value={testiName} onChange={e=>setTestiName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/><input type="text" placeholder="Asal Perusahaan / Instansi" value={testiCompany} onChange={e=>setTestiCompany(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required/><textarea rows="3" placeholder="Isi testimoni..." value={testiText} onChange={e=>setTestiText(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Tambah Testimoni</button></form><div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">{testimonials.map(t => (<div key={t.id} className="bg-white p-4 md:p-6 rounded-xl border"><p className="italic text-xs md:text-sm text-slate-600 mb-4">"{t.text}"</p><h4 className="font-bold text-xs md:text-sm">{t.name}</h4><p className="text-[10px] md:text-xs text-slate-400 mb-3">{t.company}</p><button onClick={()=>deleteItem('testimonials', t.id)} className="text-red-500 text-xs font-bold bg-red-50 px-3 py-1.5 rounded">Hapus</button></div>))}</div></div>
        )}

        {/* TAB FAQ */}
        {activeTab === 'faq' && (
            <div className="max-w-4xl"><form onSubmit={addFaq} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="text" placeholder="Pertanyaan" value={faqQ} onChange={e=>setFaqQ(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/><textarea rows="3" placeholder="Jawaban..." value={faqA} onChange={e=>setFaqA(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Tambah F.A.Q</button></form><div className="space-y-3">{faqs.map(f => (<div key={f.id} className="bg-white p-4 rounded-xl border flex flex-col md:flex-row justify-between md:items-start gap-4"><div className="pr-4"><h4 className="font-bold text-xs md:text-sm mb-1">{f.q}</h4><p className="text-[10px] md:text-xs text-slate-500">{f.a}</p></div><button onClick={()=>deleteItem('faqs', f.id)} className="text-red-500 text-xs font-bold w-full md:w-fit bg-red-50 px-3 py-2 rounded">Hapus</button></div>))}</div></div>
        )}

        {/* TAB BLOG / WAWASAN DENGAN EDITOR GAMBAR */}
        {activeTab === 'blog' && (
            <div className="max-w-4xl">
                <form onSubmit={addPost} className="bg-white p-4 md:p-8 rounded-2xl shadow-sm space-y-4 border mb-8">
                    <input type="text" placeholder="Judul Berita" value={postTitle} onChange={e=>setPostTitle(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-base md:text-lg" required/>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <select value={postCategory} onChange={e=>setPostCategory(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg bg-white text-sm">
                            <option value="News">News</option>
                            <option value="Opini">Opini</option>
                        </select>
                        <input type="text" placeholder="Dateline (Cth: Jakarta)" value={postDateline} onChange={e=>setPostDateline(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" />
                    </div>
                    
                    <div className="border p-3 md:p-4 rounded-lg bg-slate-50">
                        <p className="mb-2 font-bold text-xs md:text-sm text-slate-700">Upload Sampul Berita</p>
                        <input type="file" onChange={async (e) => { 
                            if(e.target.files[0]) { 
                                setLoading(true); 
                                try { 
                                    const url = await uploadToCloudinary(e.target.files[0]); 
                                    setPostCoverUrl(url); 
                                    alert("Gambar Sampul Siap!"); 
                                } catch(err) { alert(err.message); } 
                                setLoading(false); 
                            } 
                        }} accept="image/*" className="text-xs md:text-sm w-full" />
                    </div>

                    {/* QUILL EDITOR DENGAN KONFIGURASI GAMBAR */}
                    <div className="h-64 mb-14 md:mb-10 mt-2">
                        <ReactQuill 
                            ref={quillRef}
                            theme="snow" 
                            value={postContent} 
                            onChange={setPostContent} 
                            modules={modules}
                            className="h-full bg-white rounded-b-lg" 
                            placeholder="Tulis isi berita di sini... Gunakan ikon gambar di toolbar untuk menyisipkan gambar ke tengah paragraf."
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-8 md:pt-12">
                        <input type="text" placeholder="Nama Penulis" value={postAuthor} onChange={e=>setPostAuthor(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" />
                        <input type="text" placeholder="Tags (Pisahkan koma)" value={postTags} onChange={e=>setPostTags(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" />
                    </div>
                    
                    <button disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold mt-4 w-full text-sm">
                        {loading ? 'Mengunggah...' : 'Terbitkan Berita'}
                    </button>
                </form>
                
                <div className="space-y-3">
                    {posts.map(p => (
                        <div key={p.id} className="flex flex-col md:flex-row bg-white p-4 rounded-xl border justify-between gap-3">
                            <div className="flex-1"><h4 className="font-bold text-sm line-clamp-2">{p.title}</h4></div>
                            <button onClick={()=>deleteItem('posts', p.id)} className="text-red-500 text-xs font-bold px-4 py-2 bg-red-50 rounded-lg w-full md:w-auto">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}