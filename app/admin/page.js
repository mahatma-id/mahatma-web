"use client";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import 'react-quill-new/dist/quill.snow.css';
import Link from 'next/link';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeTab, setActiveTab] = useState('umum');
  const [loading, setLoading] = useState(false);

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

  // TAMBAHAN: serviceImageUrl untuk menampung gambar
  const [settings, setSettings] = useState({ 
      logoUrl: '', missionTitle: '', missionDesc: '', serviceTitle: '', serviceDesc: '', serviceImageUrl: '',
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
          await setDoc(doc(db, "posts", slug), { title: postTitle, category: postCategory, content: postContent, coverUrl: postCoverUrl, dateline: postDateline, author: postAuthor || 'Tim Redaksi', tags: postTags, views: 0, createdAt: serverTimestamp() });
          alert('Berita Diterbitkan!'); setPostTitle(''); setPostContent(''); setPostCoverUrl(''); setPostDateline(''); setPostAuthor(''); setPostTags('');
      } catch(err) { alert(err.message); } setLoading(false);
  };

  const deleteItem = async (col, id) => { if(confirm(`Hapus data ini permanen?`)) await deleteDoc(doc(db, col, id)); };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><p className="animate-pulse font-bold tracking-widest">MENGECEK OTORITAS...</p></div>;
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-60 h-full bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10 border-r border-slate-800">
        <div className="p-5 border-b border-slate-800 bg-slate-950">
            <h1 className="text-lg font-black text-orange-500 tracking-widest uppercase">Admin Panel</h1>
            <p className="text-[9px] font-bold text-slate-500 mt-1 tracking-widest truncate">{user.email}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 px-2">Konten Utama</p>
                <nav className="space-y-1">
                    {[{ id: 'blog', label: 'Wawasan (Blog)' }, { id: 'layanan', label: 'Kelola Layanan' }, { id: 'mitra', label: 'Mitra & Klien' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-3 py-2 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>
            <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 px-2">Halaman Depan</p>
                <nav className="space-y-1">
                    {[{ id: 'umum', label: 'Teks & Logo Utama' }, { id: 'slider', label: 'Hero Slider' }, { id: 'tim', label: 'Tim Pakar' }, { id: 'testimoni', label: 'Testimoni' }, { id: 'faq', label: 'F.A.Q' }, { id: 'footer', label: 'Pengaturan Footer' }].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-3 py-2 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>
                    ))}
                </nav>
            </div>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
            <Link href="/" target="_blank" className="flex-1 text-center py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold transition">WEB ↗</Link>
            <button onClick={handleLogout} className="flex-1 py-2 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white rounded text-[10px] font-bold transition">LOGOUT</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto h-full bg-slate-50">
        <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-black text-slate-900 uppercase">
                {activeTab === 'blog' ? 'Kelola Wawasan (Blog)' : activeTab === 'tim' ? 'Kelola Tim Pakar' : activeTab === 'faq' ? 'Kelola F.A.Q' : activeTab === 'umum' ? 'Pengaturan Teks & Logo' : `Kelola ${activeTab}`}
            </h2>
        </div>
        
        {activeTab === 'umum' && (
            <form onSubmit={saveSettings} className="space-y-6 max-w-4xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div><label className="font-bold text-slate-700">URL Logo Utama</label><input type="url" value={settings.logoUrl || ''} onChange={e=>setSettings({...settings, logoUrl: e.target.value})} className="w-full border p-3 rounded-lg mt-2 focus:border-orange-500 outline-none" placeholder="https://..." /></div>
                
                <div className="p-4 bg-slate-50 rounded-xl border"><h3 className="font-bold mb-4 text-orange-600 border-b pb-2">Our Mission</h3><input type="text" value={settings.missionTitle || ''} onChange={e=>setSettings({...settings, missionTitle: e.target.value})} className="w-full border p-3 rounded-lg mb-3" placeholder="Judul Mission" /><textarea value={settings.missionDesc || ''} onChange={e=>setSettings({...settings, missionDesc: e.target.value})} className="w-full border p-3 rounded-lg" rows="2" placeholder="Deskripsi Mission"></textarea></div>
                
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2">Our Service</h3>
                    <input type="text" value={settings.serviceTitle || ''} onChange={e=>setSettings({...settings, serviceTitle: e.target.value})} className="w-full border p-3 rounded-lg mb-3" placeholder="Judul Service" />
                    <textarea value={settings.serviceDesc || ''} onChange={e=>setSettings({...settings, serviceDesc: e.target.value})} className="w-full border p-3 rounded-lg mb-4" rows="3" placeholder="Deskripsi Service"></textarea>
                    
                    {/* BAGIAN UPLOAD GAMBAR LAYANAN */}
                    <div className="border border-slate-200 p-4 rounded-lg bg-white">
                        <label className="text-sm font-bold text-slate-700 block mb-2">Upload Gambar Ilustrasi Layanan (Sisi Kanan)</label>
                        <div className="flex items-center gap-4">
                            <input type="file" onChange={async (e) => { 
                                if(e.target.files[0]) { 
                                    setLoading(true); 
                                    try { 
                                        const url = await uploadToCloudinary(e.target.files[0]); 
                                        setSettings({...settings, serviceImageUrl: url}); 
                                        alert("Gambar diunggah! Jangan lupa klik tombol 'Simpan Pengaturan' di bawah."); 
                                    } catch(err) { alert(err.message); } 
                                    setLoading(false); 
                                } 
                            }} accept="image/*" className="text-sm border p-2 rounded w-full" />
                            {settings.serviceImageUrl && <img src={settings.serviceImageUrl} className="h-16 w-16 object-cover rounded border" alt="Preview"/>}
                        </div>
                    </div>
                </div>
                
                <button disabled={loading} className="bg-orange-600 text-white px-8 py-3 rounded-lg font-bold">Simpan Pengaturan</button>
            </form>
        )}

        {/* TAB LAINNYA TETAP SAMA SEPERTI SEBELUMNYA */}
        {activeTab === 'footer' && (
            <form onSubmit={saveSettings} className="space-y-6 max-w-4xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="p-4 bg-slate-50 rounded-xl border"><h3 className="font-bold mb-4 text-orange-600 border-b pb-2">Profil & Kontak Footer</h3><label className="text-sm font-bold text-slate-700">Deskripsi Singkat</label><textarea value={settings.footerDesc || ''} onChange={e=>setSettings({...settings, footerDesc: e.target.value})} className="w-full border p-3 rounded-lg mt-2 mb-4" rows="3"></textarea><label className="text-sm font-bold text-slate-700">Telepon / WhatsApp</label><input type="text" value={settings.phone || ''} onChange={e=>setSettings({...settings, phone: e.target.value})} className="w-full border p-3 rounded-lg mt-2" /></div>
                <div className="p-4 bg-slate-50 rounded-xl border"><h3 className="font-bold mb-4 text-orange-600 border-b pb-2">Social Media</h3><label className="text-sm font-bold text-slate-700">LinkedIn</label><input type="url" value={settings.linkedin || ''} onChange={e=>setSettings({...settings, linkedin: e.target.value})} className="w-full border p-3 rounded-lg mt-2 mb-3" /><label className="text-sm font-bold text-slate-700">YouTube</label><input type="url" value={settings.youtube || ''} onChange={e=>setSettings({...settings, youtube: e.target.value})} className="w-full border p-3 rounded-lg mt-2 mb-3" /><label className="text-sm font-bold text-slate-700">Instagram</label><input type="url" value={settings.instagram || ''} onChange={e=>setSettings({...settings, instagram: e.target.value})} className="w-full border p-3 rounded-lg mt-2" /></div>
                <button disabled={loading} className="bg-orange-600 text-white px-8 py-3 rounded-lg font-bold">Simpan Pengaturan Footer</button>
            </form>
        )}

        {activeTab === 'slider' && (
            <div className="max-w-4xl"><form onSubmit={addSlider} className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="file" onChange={e=>setSlideImageFile(e.target.files[0])} accept="image/*" className="w-full border p-3 rounded-lg bg-slate-50" /><input type="text" placeholder="Judul Slider Utama" value={slideTitle} onChange={e=>setSlideTitle(e.target.value)} className="w-full border p-3 rounded-lg font-bold" required/><input type="text" placeholder="Deskripsi Pendek" value={slideSubtitle} onChange={e=>setSlideSubtitle(e.target.value)} className="w-full border p-3 rounded-lg" /><div className="flex gap-4"><input type="text" placeholder="Teks Tombol" value={slideBtnText} onChange={e=>setSlideBtnText(e.target.value)} className="w-full border p-3 rounded-lg" /><input type="text" placeholder="Link Tombol" value={slideBtnLink} onChange={e=>setSlideBtnLink(e.target.value)} className="w-full border p-3 rounded-lg" /></div><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold">Tambah Slider</button></form><div className="grid gap-4">{sliders.map(s => (<div key={s.id} className="flex bg-white p-4 rounded-xl border items-center gap-4"><img src={s.imageUrl} className="w-24 h-16 object-cover rounded-lg" /><div className="flex-1"><h4 className="font-bold">{s.title}</h4></div><button onClick={()=>deleteItem('sliders', s.id)} className="text-red-500 font-bold px-4">Hapus</button></div>))}</div></div>
        )}

        {activeTab === 'mitra' && (
            <div className="max-w-4xl"><form onSubmit={addPartner} className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><p className="text-sm text-slate-500 mb-2">Tambahkan Logo/Gambar (Opsional), Nama Perusahaan, dan Bidangnya.</p><input id="partnerFileInput" type="file" onChange={e=>setPartnerImgFile(e.target.files[0])} accept="image/*" className="w-full border p-3 rounded-lg bg-slate-50" /><input type="text" placeholder="Nama Perusahaan (Wajib diisi)" value={partnerName} onChange={e=>setPartnerName(e.target.value)} className="w-full border p-3 rounded-lg font-bold uppercase" required/><input type="text" placeholder="Bidang/Layanan (Cth: Pelatihan SDM, Konsultasi ESG)" value={partnerField} onChange={e=>setPartnerField(e.target.value)} className="w-full border p-3 rounded-lg" required/><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold">{loading ? 'Menyimpan...' : 'Tambah Mitra'}</button></form><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{partners.map(p => (<div key={p.id} className="bg-white p-4 rounded-xl border flex flex-col justify-between items-center text-center">{p.imgUrl ? (<img src={p.imgUrl} alt={p.name} className="h-12 w-auto object-contain mb-3" />) : (<div className="h-12 flex items-center justify-center mb-3"><h4 className="font-bold text-slate-600 uppercase">{p.name}</h4></div>)}<button onClick={()=>deleteItem('partners', p.id)} className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded w-full">Hapus</button></div>))}</div></div>
        )}

        {activeTab === 'layanan' && (
            <div className="max-w-4xl"><form onSubmit={addService} className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="text" placeholder="Nama Layanan (Cth: Consulting)" value={serviceName} onChange={e=>setServiceName(e.target.value)} className="w-full border p-3 rounded-lg font-bold" required/><textarea rows="3" placeholder="Deskripsi Singkat..." value={serviceDesc} onChange={e=>setServiceDesc(e.target.value)} className="w-full border p-3 rounded-lg" required></textarea><input type="text" placeholder="Link Detail (Opsional)" value={serviceLink} onChange={e=>setServiceLink(e.target.value)} className="w-full border p-3 rounded-lg" /><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold">Tambah Layanan</button></form><div className="grid grid-cols-2 gap-4">{services.map(s => (<div key={s.id} className="bg-white p-6 rounded-xl border flex flex-col"><h4 className="font-bold text-lg mb-2">{s.name}</h4><button onClick={()=>deleteItem('services', s.id)} className="mt-auto text-red-500 text-sm font-bold bg-red-50 py-2 rounded">Hapus</button></div>))}</div></div>
        )}

        {activeTab === 'tim' && (
            <div className="max-w-4xl"><form onSubmit={addTeam} className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="file" onChange={e=>setTeamImgFile(e.target.files[0])} accept="image/*" className="w-full border p-3 rounded-lg bg-slate-50" required /><input type="text" placeholder="Nama Lengkap & Gelar" value={teamName} onChange={e=>setTeamName(e.target.value)} className="w-full border p-3 rounded-lg font-bold" required/><input type="text" placeholder="Jabatan / Role" value={teamRole} onChange={e=>setTeamRole(e.target.value)} className="w-full border p-3 rounded-lg" required/><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold">{loading ? 'Upload Foto...' : 'Tambah Anggota Tim'}</button></form><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{teams.map(t => (<div key={t.id} className="bg-white p-4 rounded-xl border flex flex-col items-center text-center"><img src={t.img} className="w-16 h-16 rounded-full object-cover mb-3"/><h4 className="font-bold text-sm">{t.name}</h4><p className="text-[10px] text-orange-500 mb-3">{t.role}</p><button onClick={()=>deleteItem('teams', t.id)} className="text-red-500 text-xs font-bold w-full bg-red-50 py-2 rounded">Hapus</button></div>))}</div></div>
        )}

        {activeTab === 'testimoni' && (
            <div className="max-w-4xl"><form onSubmit={addTestimonial} className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="text" placeholder="Nama Klien" value={testiName} onChange={e=>setTestiName(e.target.value)} className="w-full border p-3 rounded-lg font-bold" required/><input type="text" placeholder="Asal Perusahaan / Instansi" value={testiCompany} onChange={e=>setTestiCompany(e.target.value)} className="w-full border p-3 rounded-lg" required/><textarea rows="3" placeholder="Isi testimoni..." value={testiText} onChange={e=>setTestiText(e.target.value)} className="w-full border p-3 rounded-lg" required></textarea><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold">Tambah Testimoni</button></form><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{testimonials.map(t => (<div key={t.id} className="bg-white p-6 rounded-xl border"><p className="italic text-sm text-slate-600 mb-4">"{t.text}"</p><h4 className="font-bold text-sm">{t.name}</h4><p className="text-xs text-slate-400 mb-3">{t.company}</p><button onClick={()=>deleteItem('testimonials', t.id)} className="text-red-500 text-xs font-bold bg-red-50 px-3 py-1.5 rounded">Hapus</button></div>))}</div></div>
        )}

        {activeTab === 'faq' && (
            <div className="max-w-4xl"><form onSubmit={addFaq} className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="text" placeholder="Pertanyaan" value={faqQ} onChange={e=>setFaqQ(e.target.value)} className="w-full border p-3 rounded-lg font-bold" required/><textarea rows="3" placeholder="Jawaban..." value={faqA} onChange={e=>setFaqA(e.target.value)} className="w-full border p-3 rounded-lg" required></textarea><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold">Tambah F.A.Q</button></form><div className="space-y-3">{faqs.map(f => (<div key={f.id} className="bg-white p-4 rounded-xl border flex justify-between"><div className="pr-4"><h4 className="font-bold text-sm mb-1">{f.q}</h4><p className="text-xs text-slate-500">{f.a}</p></div><button onClick={()=>deleteItem('faqs', f.id)} className="text-red-500 text-xs font-bold h-fit bg-red-50 px-3 py-2 rounded">Hapus</button></div>))}</div></div>
        )}

        {activeTab === 'blog' && (
            <div className="max-w-4xl"><form onSubmit={addPost} className="bg-white p-8 rounded-2xl shadow-sm space-y-4 border mb-8"><input type="text" placeholder="Judul Berita" value={postTitle} onChange={e=>setPostTitle(e.target.value)} className="w-full border p-3 rounded-lg font-bold text-lg" required/><div className="grid grid-cols-2 gap-4"><select value={postCategory} onChange={e=>setPostCategory(e.target.value)} className="w-full border p-3 rounded-lg bg-white"><option value="News">News</option><option value="Opini">Opini</option></select><input type="text" placeholder="Dateline (Cth: Jakarta)" value={postDateline} onChange={e=>setPostDateline(e.target.value)} className="w-full border p-3 rounded-lg" /></div><div className="border p-4 rounded-lg bg-slate-50"><p className="mb-2 font-bold text-sm text-slate-700">Upload Sampul</p><input type="file" onChange={async (e) => { if(e.target.files[0]) { setLoading(true); try { const url = await uploadToCloudinary(e.target.files[0]); setPostCoverUrl(url); alert("Gambar Siap!"); } catch(err) { alert(err.message); } setLoading(false); } }} accept="image/*" className="text-sm" /></div><div className="h-64 mb-10"><ReactQuill theme="snow" value={postContent} onChange={setPostContent} className="h-full bg-white" /></div><div className="grid grid-cols-2 gap-4 pt-8"><input type="text" placeholder="Nama Penulis" value={postAuthor} onChange={e=>setPostAuthor(e.target.value)} className="w-full border p-3 rounded-lg" /><input type="text" placeholder="Tags" value={postTags} onChange={e=>setPostTags(e.target.value)} className="w-full border p-3 rounded-lg" /></div><button disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold mt-4 w-full">Terbitkan Berita</button></form><div className="space-y-3">{posts.map(p => (<div key={p.id} className="flex bg-white p-4 rounded-xl border justify-between"><div><h4 className="font-bold">{p.title}</h4></div><button onClick={()=>deleteItem('posts', p.id)} className="text-red-500 font-bold px-4 bg-red-50 rounded-lg">Hapus</button></div>))}</div></div>
        )}

      </main>
    </div>
  );
}