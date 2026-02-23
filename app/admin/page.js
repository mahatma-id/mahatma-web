"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
                  quill.insertEmbed(range.index, 'image', url);
                  quill.setSelection(range.index + 1);
              } catch (error) { alert("Gagal mengunggah gambar ke dalam teks."); }
              setLoading(false);
          }
      };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'], 
        ['clean']
      ],
      handlers: { image: imageHandler } 
    }
  }), []);

  // STATE UMUM & FOOTER (DITAMBAH FIELD BARU: EMAIL, ALAMAT, MAPS, CTA LINK)
  const [settings, setSettings] = useState({ 
      logoUrl: '', missionTitle: '', missionDesc: '', missionMainImg: '', 
      mission1Desc: '', mission2Desc: '', mission3Desc: '', mission4Desc: '',
      serviceTitle: '', serviceDesc: '', serviceImageUrl: '',
      aboutTitle: '', aboutDesc: '', ctaTitle: '', ctaDesc: '', ctaLink: '',
      footerDesc: '', phone: '', email: '', address: '', mapUrl: '', mapLink: '',
      linkedin: '', youtube: '', instagram: ''
  });
  
  // STATE SLIDER
  const [sliders, setSliders] = useState([]);
  const [editSliderId, setEditSliderId] = useState(null);
  const [slideTagline, setSlideTagline] = useState(''); const [slideTitle, setSlideTitle] = useState(''); const [slideSubtitle, setSlideSubtitle] = useState(''); const [slideBtn1Text, setSlideBtn1Text] = useState(''); const [slideBtn1Link, setSlideBtn1Link] = useState(''); const [slideBtn2Text, setSlideBtn2Text] = useState(''); const [slideBtn2Link, setSlideBtn2Link] = useState(''); const [slideImageFile, setSlideImageFile] = useState(null); const [slideImageUrl, setSlideImageUrl] = useState('');

  // STATE LAINNYA
  const [partners, setPartners] = useState([]); const [editPartnerId, setEditPartnerId] = useState(null); const [partnerName, setPartnerName] = useState(''); const [partnerImgFile, setPartnerImgFile] = useState(null); const [partnerField, setPartnerField] = useState(''); const [partnerImgUrl, setPartnerImgUrl] = useState('');
  const [services, setServices] = useState([]); const [editServiceId, setEditServiceId] = useState(null); const [serviceName, setServiceName] = useState(''); const [serviceDesc, setServiceDesc] = useState(''); const [serviceLink, setServiceLink] = useState(''); const [serviceImgFile, setServiceImgFile] = useState(null); const [serviceImgUrl, setServiceImgUrl] = useState('');
  const [teams, setTeams] = useState([]); const [editTeamId, setEditTeamId] = useState(null); const [teamName, setTeamName] = useState(''); const [teamRole, setTeamRole] = useState(''); const [teamImgFile, setTeamImgFile] = useState(null); const [teamImgUrl, setTeamImgUrl] = useState('');
  const [testimonials, setTestimonials] = useState([]); const [editTestiId, setEditTestiId] = useState(null); const [testiName, setTestiName] = useState(''); const [testiCompany, setTestiCompany] = useState(''); const [testiText, setTestiText] = useState('');
  const [faqs, setFaqs] = useState([]); const [editFaqId, setEditFaqId] = useState(null); const [faqQ, setFaqQ] = useState(''); const [faqA, setFaqA] = useState('');
  const [posts, setPosts] = useState([]); const [editPostId, setEditPostId] = useState(null); const [postTitle, setPostTitle] = useState(''); const [postContent, setPostContent] = useState(''); const [postCategory, setPostCategory] = useState('News'); const [postCoverUrl, setPostCoverUrl] = useState(''); const [postDateline, setPostDateline] = useState(''); const [postAuthor, setPostAuthor] = useState(''); const [postTags, setPostTags] = useState(''); const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setAuthLoading(false); });
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
  
  const cancelAllEdits = () => { cancelEditSlider(); cancelEditPartner(); cancelEditService(); cancelEditTeam(); cancelEditTesti(); cancelEditFaq(); cancelEditPost(); };
  const switchTab = (tabId) => { setActiveTab(tabId); setIsSidebarOpen(false); cancelAllEdits(); };
  const deleteItem = async (col, id) => { if(confirm(`Hapus data ini permanen?`)) await deleteDoc(doc(db, col, id)); };

  const cancelEditSlider = () => { setEditSliderId(null); setSlideTagline(''); setSlideTitle(''); setSlideSubtitle(''); setSlideBtn1Text(''); setSlideBtn1Link(''); setSlideBtn2Text(''); setSlideBtn2Link(''); setSlideImageUrl(''); setSlideImageFile(null); };
  const handleEditSlider = (s) => { setEditSliderId(s.id); setSlideTagline(s.tagline || ''); setSlideTitle(s.title || ''); setSlideSubtitle(s.subtitle || ''); setSlideBtn1Text(s.btn1Text || s.btnText || ''); setSlideBtn1Link(s.btn1Link || s.btnLink || ''); setSlideBtn2Text(s.btn2Text || ''); setSlideBtn2Link(s.btn2Link || ''); setSlideImageUrl(s.imageUrl || ''); setSlideImageFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveSlider = async (e) => { e.preventDefault(); setLoading(true); try { let finalImg = slideImageUrl; if (slideImageFile) finalImg = await uploadToCloudinary(slideImageFile); if (!finalImg && !editSliderId) { alert("Pilih gambar!"); setLoading(false); return; } const data = { tagline: slideTagline, title: slideTitle, subtitle: slideSubtitle, btn1Text: slideBtn1Text, btn1Link: slideBtn1Link, btn2Text: slideBtn2Text, btn2Link: slideBtn2Link, imageUrl: finalImg }; if (editSliderId) await updateDoc(doc(db, "sliders", editSliderId), data); else await addDoc(collection(db, "sliders"), { ...data, createdAt: serverTimestamp() }); alert("Berhasil!"); cancelEditSlider(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditPartner = () => { setEditPartnerId(null); setPartnerName(''); setPartnerField(''); setPartnerImgUrl(''); setPartnerImgFile(null); if(document.getElementById('partnerFileInput')) document.getElementById('partnerFileInput').value = ''; };
  const handleEditPartner = (p) => { setEditPartnerId(p.id); setPartnerName(p.name||''); setPartnerField(p.field||''); setPartnerImgUrl(p.imgUrl||''); setPartnerImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const savePartner = async (e) => { e.preventDefault(); setLoading(true); try { let finalImg = partnerImgUrl; if (partnerImgFile) finalImg = await uploadToCloudinary(partnerImgFile); const data = { name: partnerName, imgUrl: finalImg, field: partnerField }; if (editPartnerId) await updateDoc(doc(db, "partners", editPartnerId), data); else await addDoc(collection(db, "partners"), { ...data, createdAt: serverTimestamp() }); alert("Berhasil!"); cancelEditPartner(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditService = () => { setEditServiceId(null); setServiceName(''); setServiceDesc(''); setServiceLink(''); setServiceImgUrl(''); setServiceImgFile(null); };
  const handleEditService = (s) => { setEditServiceId(s.id); setServiceName(s.name||''); setServiceDesc(s.desc||''); setServiceLink(s.link||''); setServiceImgUrl(s.imgUrl||''); setServiceImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveService = async (e) => { e.preventDefault(); setLoading(true); try { let finalImg = serviceImgUrl; if (serviceImgFile) finalImg = await uploadToCloudinary(serviceImgFile); const data = { name: serviceName, desc: serviceDesc, link: serviceLink || "#", imgUrl: finalImg }; if (editServiceId) await updateDoc(doc(db, "services", editServiceId), data); else await addDoc(collection(db, "services"), { ...data, createdAt: serverTimestamp() }); alert('Berhasil!'); cancelEditService(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditTeam = () => { setEditTeamId(null); setTeamName(''); setTeamRole(''); setTeamImgUrl(''); setTeamImgFile(null); };
  const handleEditTeam = (t) => { setEditTeamId(t.id); setTeamName(t.name||''); setTeamRole(t.role||''); setTeamImgUrl(t.img||''); setTeamImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveTeam = async (e) => { e.preventDefault(); setLoading(true); try { let finalImg = teamImgUrl; if (teamImgFile) finalImg = await uploadToCloudinary(teamImgFile); if (!finalImg && !editTeamId) { alert("Pilih foto!"); setLoading(false); return; } const data = { name: teamName, role: teamRole, img: finalImg }; if (editTeamId) await updateDoc(doc(db, "teams", editTeamId), data); else await addDoc(collection(db, "teams"), { ...data, createdAt: serverTimestamp() }); alert("Berhasil!"); cancelEditTeam(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditTesti = () => { setEditTestiId(null); setTestiName(''); setTestiCompany(''); setTestiText(''); };
  const handleEditTesti = (t) => { setEditTestiId(t.id); setTestiName(t.name||''); setTestiCompany(t.company||''); setTestiText(t.text||''); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveTestimonial = async (e) => { e.preventDefault(); setLoading(true); try { const data = { name: testiName, company: testiCompany, text: testiText }; if (editTestiId) await updateDoc(doc(db, "testimonials", editTestiId), data); else await addDoc(collection(db, "testimonials"), { ...data, createdAt: serverTimestamp() }); alert("Berhasil!"); cancelEditTesti(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditFaq = () => { setEditFaqId(null); setFaqQ(''); setFaqA(''); };
  const handleEditFaq = (f) => { setEditFaqId(f.id); setFaqQ(f.q||''); setFaqA(f.a||''); window.scrollTo({top:0, behavior:'smooth'}); };
  const saveFaq = async (e) => { e.preventDefault(); setLoading(true); try { const data = { q: faqQ, a: faqA }; if (editFaqId) await updateDoc(doc(db, "faqs", editFaqId), data); else await addDoc(collection(db, "faqs"), { ...data, createdAt: serverTimestamp() }); alert("Berhasil!"); cancelEditFaq(); } catch(err) { alert(err.message); } setLoading(false); };
  const cancelEditPost = () => { setEditPostId(null); setPostTitle(''); setPostContent(''); setPostCoverUrl(''); setPostDateline(''); setPostAuthor(''); setPostTags(''); setIsDraft(false); };
  const handleEditPost = (post) => { setEditPostId(post.id); setPostTitle(post.title); setPostCategory(post.category); setPostContent(post.content); setPostCoverUrl(post.coverUrl || ''); setPostDateline(post.dateline || ''); setPostAuthor(post.author || ''); setPostTags(post.tags || ''); setIsDraft(post.isDraft || false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const savePost = async (e) => { e.preventDefault(); setLoading(true); try { if (editPostId) { await updateDoc(doc(db, "posts", editPostId), { title: postTitle, category: postCategory, content: postContent, coverUrl: postCoverUrl, dateline: postDateline, author: postAuthor || 'Tim Redaksi', tags: postTags, isDraft: isDraft }); alert(isDraft ? 'Draf Diperbarui!' : 'Berita Diperbarui!'); } else { let slug = postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''); if (!slug) slug = 'berita-' + Date.now(); const docSnap = await getDoc(doc(db, "posts", slug)); if (docSnap.exists()) slug = slug + '-' + Math.floor(Math.random() * 1000); await setDoc(doc(db, "posts", slug), { title: postTitle, category: postCategory, content: postContent, coverUrl: postCoverUrl, dateline: postDateline, author: postAuthor || 'Tim Redaksi', tags: postTags, views: 0, createdAt: serverTimestamp(), isDraft: isDraft }); alert(isDraft ? 'Draf Disimpan!' : 'Berita Diterbitkan!'); } cancelEditPost(); } catch(err) { alert(err.message); } setLoading(false); };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><p className="animate-pulse font-bold tracking-widest">MENGECEK OTORITAS...</p></div>;
  if (!user) return (<div className="min-h-screen flex items-center justify-center bg-slate-900 p-4"><form onSubmit={handleLogin} className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md"><h1 className="text-2xl font-black text-slate-900 mb-2">Admin Login</h1><div className="space-y-4 mt-6"><div><label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email</label><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border-2 p-3 rounded-xl focus:border-orange-500 outline-none" /></div><div><label className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</label><input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border-2 p-3 rounded-xl focus:border-orange-500 outline-none" /></div><button disabled={loading} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition">{loading ? 'Loading...' : 'MASUK'}</button></div></form></div>);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      <div className="md:hidden absolute top-0 left-0 w-full bg-slate-950 text-white p-4 flex justify-between items-center z-20 shadow-md"><h1 className="text-sm font-black text-orange-500 tracking-widest uppercase">Admin Panel</h1><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="focus:outline-none bg-slate-800 p-2 rounded"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg></button></div>
      {isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-20" onClick={() => setIsSidebarOpen(false)}></div>}
      <aside className={`fixed md:relative top-0 left-0 w-64 h-full bg-slate-900 text-slate-300 flex flex-col shadow-xl z-30 transition-transform duration-300 border-r border-slate-800 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5 border-b border-slate-800 bg-slate-950 mt-14 md:mt-0 flex justify-between items-center"><div><h1 className="text-lg font-black text-orange-500 tracking-widest uppercase hidden md:block">Admin Panel</h1><p className="text-[10px] font-bold text-slate-500 mt-1 tracking-widest truncate">{user.email}</p></div><button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            <div><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 px-2">Konten Utama</p><nav className="space-y-1">{[{ id: 'blog', label: 'Wawasan (Blog)' }, { id: 'layanan', label: 'Kelola Layanan' }, { id: 'mitra', label: 'Mitra & Klien' }].map(tab => (<button key={tab.id} onClick={() => switchTab(tab.id)} className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>))}</nav></div>
            <div><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 px-2">Halaman Depan</p><nav className="space-y-1">{[{ id: 'umum', label: 'Teks & Logo Utama' }, { id: 'slider', label: 'Hero Slider' }, { id: 'tim', label: 'Tim Pakar' }, { id: 'testimoni', label: 'Testimoni' }, { id: 'faq', label: 'F.A.Q' }, { id: 'footer', label: 'Pengaturan Footer' }].map(tab => (<button key={tab.id} onClick={() => switchTab(tab.id)} className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold transition ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>{tab.label}</button>))}</nav></div>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2 pb-6 md:pb-4"><Link href="/" target="_blank" className="flex-1 text-center py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold transition">WEB ↗</Link><button onClick={handleLogout} className="flex-1 py-2.5 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white rounded text-[10px] font-bold transition">LOGOUT</button></div>
      </aside>

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-full bg-slate-50">
        <div className="mb-6 border-b border-slate-200 pb-4"><h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">{activeTab === 'blog' ? 'Kelola Wawasan (Blog)' : `Kelola ${activeTab}`}</h2></div>
        
        {/* TAB UMUM */}
        {activeTab === 'umum' && (
            <form onSubmit={saveSettings} className="space-y-6 max-w-4xl bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                
                {/* UPLOAD LOGO */}
                <div className="mb-4 bg-slate-50 p-4 border rounded-xl">
                    <label className="text-sm font-bold block mb-2 text-slate-700">Logo Website (Kiri Atas & Footer)</label>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <input type="file" accept="image/*" onChange={async (e) => {
                            if(e.target.files[0]) {
                                setLoading(true);
                                try {
                                    const url = await uploadToCloudinary(e.target.files[0]);
                                    setSettings({...settings, logoUrl: url});
                                    alert(`Logo Berhasil Diunggah! Silakan klik Simpan.`);
                                } catch(err) { alert(err.message); }
                                setLoading(false);
                            }
                        }} className="text-xs border p-2 rounded bg-white w-full md:w-auto" />
                        {settings.logoUrl && <img src={settings.logoUrl} className="h-12 object-contain bg-white rounded border p-1" alt="logo"/>}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Untuk menghapus gambar dan kembali memakai Teks Merek, hapus link URL ini: 
                        <input type="text" value={settings.logoUrl || ''} onChange={e=>setSettings({...settings, logoUrl: e.target.value})} className="w-full border p-1 mt-1 rounded text-xs text-slate-400" />
                    </p>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Bagian: Our Mission</h3>
                    
                    <div className="mb-4 bg-white p-3 border rounded-lg">
                        <label className="text-xs font-bold block mb-2 text-slate-700">Upload Gambar Utama Misi (Area Kiri)</label>
                        <input type="file" accept="image/*" onChange={async (e) => {
                            if(e.target.files[0]) {
                                setLoading(true);
                                try {
                                    const url = await uploadToCloudinary(e.target.files[0]);
                                    setSettings({...settings, missionMainImg: url});
                                    alert(`Gambar Utama Misi Berhasil Diunggah!`);
                                } catch(err) { alert(err.message); }
                                setLoading(false);
                            }
                        }} className="text-[10px] border p-1 rounded w-full" />
                        {settings.missionMainImg && <img src={settings.missionMainImg} className="h-24 mt-2 object-cover rounded border p-1" alt="preview"/>}
                    </div>

                    <label className="text-xs font-bold block mb-1 text-slate-700">Judul Utama Misi (Area Kanan Atas)</label>
                    <input type="text" value={settings.missionTitle || ''} onChange={e=>setSettings({...settings, missionTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Contoh: Integrated Solution for Your Needs" />
                    <textarea value={settings.missionDesc || ''} onChange={e=>setSettings({...settings, missionDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg text-sm mb-4" rows="3" placeholder="Deskripsi Singkat Misi (Opsional)"></textarea>
                    
                    <h4 className="font-bold text-slate-700 mb-2 mt-6 text-sm border-t pt-4">Kartu Poin Misi (Area Kanan Bawah)</h4>
                    <p className="text-xs text-slate-500 mb-3">Isi paragraf panjang untuk setiap kartu misi. Biarkan kosong jika tidak digunakan.</p>
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3, 4].map(num => (
                            <div key={num} className="border border-slate-200 p-3 rounded-lg bg-white">
                                <label className="text-xs font-bold block mb-1 text-slate-600">Isi Kartu Misi {num}</label>
                                <textarea 
                                    rows="3" 
                                    placeholder={`Isi Poin Misi ${num} (Contoh: 1. Cultivating Leadership...)`} 
                                    value={settings[`mission${num}Desc`] || ''} 
                                    onChange={e=>setSettings({...settings, [`mission${num}Desc`]: e.target.value})} 
                                    className="w-full border p-2 rounded text-sm outline-none focus:border-orange-400" 
                                />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Bagian: Our Service</h3>
                    <input type="text" value={settings.serviceTitle || ''} onChange={e=>setSettings({...settings, serviceTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Judul Service" />
                    <textarea value={settings.serviceDesc || ''} onChange={e=>setSettings({...settings, serviceDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-4 text-sm" rows="3" placeholder="Deskripsi Service"></textarea>
                    <div className="border border-slate-200 p-3 md:p-4 rounded-lg bg-white"><label className="text-xs md:text-sm font-bold text-slate-700 block mb-2">Upload Gambar Ilustrasi Layanan</label><div className="flex flex-col md:flex-row items-center gap-3 md:gap-4"><input type="file" onChange={async (e) => { if(e.target.files[0]) { setLoading(true); try { const url = await uploadToCloudinary(e.target.files[0]); setSettings({...settings, serviceImageUrl: url}); alert("Gambar diunggah! Jangan lupa klik Simpan Pengaturan."); } catch(err) { alert(err.message); } setLoading(false); } }} accept="image/*" className="text-xs border p-2 rounded w-full" />{settings.serviceImageUrl && <img src={settings.serviceImageUrl} className="h-16 w-16 object-cover rounded border" alt="Preview"/>}</div></div>
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
                    
                    {/* INPUT LINK CTA */}
                    <label className="text-xs md:text-sm font-bold text-slate-700 block mt-2 mb-1">Link Tombol "Pesan Layanan"</label>
                    <input type="text" value={settings.ctaLink || ''} onChange={e=>setSettings({...settings, ctaLink: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="https://..." />
                </div>
                
                <button disabled={loading} className="bg-orange-600 text-white px-6 md:px-8 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Simpan Pengaturan</button>
            </form>
        )}

        {/* TAB FOOTER */}
        {activeTab === 'footer' && (
            <form onSubmit={saveSettings} className="space-y-6 max-w-4xl bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Profil & Kontak Footer</h3>
                    <label className="text-xs md:text-sm font-bold text-slate-700">Deskripsi Singkat</label>
                    <textarea value={settings.footerDesc || ''} onChange={e=>setSettings({...settings, footerDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-4 text-sm" rows="3"></textarea>
                    
                    <label className="text-xs md:text-sm font-bold text-slate-700">Telepon / WhatsApp</label>
                    <input type="text" value={settings.phone || ''} onChange={e=>setSettings({...settings, phone: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" />

                    <label className="text-xs md:text-sm font-bold text-slate-700">Email Perusahaan</label>
                    <input type="email" value={settings.email || ''} onChange={e=>setSettings({...settings, email: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" />

                    <label className="text-xs md:text-sm font-bold text-slate-700">Alamat Lengkap</label>
                    <textarea value={settings.address || ''} onChange={e=>setSettings({...settings, address: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" rows="2"></textarea>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Lokasi & Maps</h3>
                    
                    <div className="mb-4 bg-white p-3 border rounded-lg">
                        <label className="text-xs font-bold block mb-2 text-slate-700">Upload Gambar Peta/Lokasi</label>
                        <input type="file" accept="image/*" onChange={async (e) => {
                            if(e.target.files[0]) {
                                setLoading(true);
                                try {
                                    const url = await uploadToCloudinary(e.target.files[0]);
                                    setSettings({...settings, mapUrl: url});
                                    alert(`Gambar Peta Berhasil Diunggah!`);
                                } catch(err) { alert(err.message); }
                                setLoading(false);
                            }
                        }} className="text-xs border p-2 rounded w-full" />
                        {settings.mapUrl && <img src={settings.mapUrl} className="h-24 mt-2 object-cover rounded border p-1" alt="map preview"/>}
                    </div>

                    <label className="text-xs md:text-sm font-bold text-slate-700">Link Google Maps (Saat gambar diklik)</label>
                    <input type="text" value={settings.mapLink || ''} onChange={e=>setSettings({...settings, mapLink: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" placeholder="https://maps.google.com/..." />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border"><h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Social Media</h3><label className="text-xs md:text-sm font-bold text-slate-700">LinkedIn</label><input type="url" value={settings.linkedin || ''} onChange={e=>setSettings({...settings, linkedin: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" /><label className="text-xs md:text-sm font-bold text-slate-700">YouTube</label><input type="url" value={settings.youtube || ''} onChange={e=>setSettings({...settings, youtube: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" /><label className="text-xs md:text-sm font-bold text-slate-700">Instagram</label><input type="url" value={settings.instagram || ''} onChange={e=>setSettings({...settings, instagram: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" /></div>
                <button disabled={loading} className="bg-orange-600 text-white px-6 md:px-8 py-3 rounded-lg font-bold text-sm w-full md:w-auto">Simpan Pengaturan Footer</button>
            </form>
        )}

        {/* TAB SLIDER */}
        {activeTab === 'slider' && (
            <div className="max-w-4xl">
                <form onSubmit={saveSlider} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                    {editSliderId && (<div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200"><span>Sedang Mengedit Slider</span><button type="button" onClick={cancelEditSlider} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button></div>)}
                    <p className="text-xs md:text-sm text-slate-500 mb-2">Upload gambar (Kosongkan jika tidak ingin mengganti gambar lama).</p>
                    <input type="file" onChange={e=>setSlideImageFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />
                    {slideImageUrl && !slideImageFile && <img src={slideImageUrl} className="h-20 rounded object-cover border" alt="Current" />}
                    <input type="text" placeholder="Tagline Kecil (Cth: REACH THE FUTURE)" value={slideTagline} onChange={e=>setSlideTagline(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm text-orange-600" />
                    <input type="text" placeholder="Judul Slider Utama" value={slideTitle} onChange={e=>setSlideTitle(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                    <input type="text" placeholder="Deskripsi Pendek" value={slideSubtitle} onChange={e=>setSlideSubtitle(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-4 border rounded bg-slate-50"><div><label className="text-xs font-bold block mb-1">Tombol 1 (Outline / Kiri)</label><input type="text" placeholder="Teks Tombol 1 (Cth: Preview)" value={slideBtn1Text} onChange={e=>setSlideBtn1Text(e.target.value)} className="w-full border p-2 rounded text-sm mb-2" /><input type="text" placeholder="Link Tombol 1" value={slideBtn1Link} onChange={e=>setSlideBtn1Link(e.target.value)} className="w-full border p-2 rounded text-sm" /></div><div><label className="text-xs font-bold block mb-1">Tombol 2 (Solid / Kanan)</label><input type="text" placeholder="Teks Tombol 2 (Cth: Buy)" value={slideBtn2Text} onChange={e=>setSlideBtn2Text(e.target.value)} className="w-full border p-2 rounded text-sm mb-2" /><input type="text" placeholder="Link Tombol 2" value={slideBtn2Link} onChange={e=>setSlideBtn2Link(e.target.value)} className="w-full border p-2 rounded text-sm" /></div></div>
                    <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">{editSliderId ? 'Perbarui Slider' : 'Tambah Slider'}</button>
                </form>
                <div className="grid gap-4">{sliders.map(s => (<div key={s.id} className={`flex flex-col md:flex-row bg-white p-4 rounded-xl border md:items-center gap-4 ${editSliderId === s.id ? 'ring-2 ring-indigo-500' : ''}`}><img src={s.imageUrl} className="w-full md:w-24 h-32 md:h-16 object-cover rounded-lg" /><div className="flex-1 text-center md:text-left"><h4 className="font-bold text-sm">{s.title}</h4></div><div className="flex gap-2 w-full md:w-auto"><button onClick={() => handleEditSlider(s)} className="flex-1 md:flex-none text-indigo-600 text-xs font-bold px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">Edit</button><button onClick={()=>deleteItem('sliders', s.id)} className="flex-1 md:flex-none text-red-500 text-xs font-bold px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition">Hapus</button></div></div>))}</div>
            </div>
        )}

        {/* TAB MITRA */}
        {activeTab === 'mitra' && (
            <div className="max-w-4xl"><form onSubmit={savePartner} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">{editPartnerId && (<div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200"><span>Sedang Mengedit Mitra</span><button type="button" onClick={cancelEditPartner} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button></div>)}<p className="text-xs md:text-sm text-slate-500 mb-2">Upload logo (Kosongkan jika tidak ingin mengganti logo lama).</p><input id="partnerFileInput" type="file" onChange={e=>setPartnerImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />{partnerImgUrl && !partnerImgFile && <img src={partnerImgUrl} className="h-16 object-contain border rounded p-1 bg-slate-50" alt="Current" />}<input type="text" placeholder="Nama Perusahaan (Wajib diisi)" value={partnerName} onChange={e=>setPartnerName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold uppercase text-sm" required/><input type="text" placeholder="Bidang/Layanan (Cth: Pelatihan SDM)" value={partnerField} onChange={e=>setPartnerField(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required/><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">{editPartnerId ? 'Perbarui Mitra' : 'Tambah Mitra'}</button></form><div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">{partners.map(p => (<div key={p.id} className={`bg-white p-3 md:p-4 rounded-xl border flex flex-col justify-between items-center text-center ${editPartnerId === p.id ? 'ring-2 ring-indigo-500' : ''}`}>{p.imgUrl ? (<img src={p.imgUrl} alt={p.name} className="h-10 md:h-12 w-auto object-contain mb-3" />) : (<div className="h-10 md:h-12 flex items-center justify-center mb-3"><h4 className="font-bold text-slate-600 uppercase text-xs">{p.name}</h4></div>)}<div className="flex gap-2 w-full mt-auto"><button onClick={() => handleEditPartner(p)} className="flex-1 text-indigo-600 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 p-2 rounded transition">Edit</button><button onClick={()=>deleteItem('partners', p.id)} className="flex-1 text-red-500 text-xs font-bold bg-red-50 hover:bg-red-100 p-2 rounded transition">Hapus</button></div></div>))}</div></div>
        )}

        {/* TAB LAYANAN */}
        {activeTab === 'layanan' && (
            <div className="max-w-4xl"><form onSubmit={saveService} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">{editServiceId && (<div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200"><span>Sedang Mengedit Layanan</span><button type="button" onClick={cancelEditService} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button></div>)}<p className="text-xs md:text-sm text-slate-500 mb-2 font-bold">Upload Gambar Background (Opsional)</p><input type="file" onChange={e=>setServiceImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm mb-2" />{serviceImgUrl && !serviceImgFile && <img src={serviceImgUrl} className="h-20 rounded object-cover border mb-2" alt="Current" />}<input type="text" placeholder="Nama Layanan (Cth: Consulting)" value={serviceName} onChange={e=>setServiceName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/><textarea rows="3" placeholder="Deskripsi Singkat..." value={serviceDesc} onChange={e=>setServiceDesc(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea><input type="text" placeholder="Link Detail (Opsional)" value={serviceLink} onChange={e=>setServiceLink(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" /><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">{editServiceId ? 'Perbarui Layanan' : 'Tambah Layanan'}</button></form><div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">{services.map(s => (<div key={s.id} className={`bg-white p-4 md:p-6 rounded-xl border flex flex-col ${editServiceId === s.id ? 'ring-2 ring-indigo-500' : ''}`}>s.imgUrl && <img src={s.imgUrl} className="w-full h-24 object-cover rounded-lg mb-3" alt="bg"/><h4 className="font-bold text-base md:text-lg mb-2">{s.name}</h4><div className="flex gap-2 w-full mt-auto pt-4"><button onClick={() => handleEditService(s)} className="text-indigo-600 text-xs font-bold px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">Edit</button><button onClick={()=>deleteItem('services', s.id)} className="text-red-500 text-xs font-bold px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition">Hapus</button></div></div>))}</div></div>
        )}

        {/* TAB TIM */}
        {activeTab === 'tim' && (
            <div className="max-w-4xl"><form onSubmit={saveTeam} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">{editTeamId && (<div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200"><span>Sedang Mengedit Anggota Tim</span><button type="button" onClick={cancelEditTeam} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button></div>)}<p className="text-xs md:text-sm text-slate-500 mb-2">Upload foto (Kosongkan jika tidak ingin mengganti foto lama).</p><input type="file" onChange={e=>setTeamImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />{teamImgUrl && !teamImgFile && <img src={teamImgUrl} className="h-16 w-16 object-cover rounded-full border" alt="Current" />}<input type="text" placeholder="Nama Lengkap & Gelar" value={teamName} onChange={e=>setTeamName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/><input type="text" placeholder="Jabatan / Role" value={teamRole} onChange={e=>setTeamRole(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required/><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">{editTeamId ? 'Perbarui Data Tim' : 'Tambah Anggota Tim'}</button></form><div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">{teams.map(t => (<div key={t.id} className={`bg-white p-3 md:p-4 rounded-xl border flex flex-col items-center text-center ${editTeamId === t.id ? 'ring-2 ring-indigo-500' : ''}`}><img src={t.img} className="w-16 h-16 rounded-full object-cover mb-3"/><h4 className="font-bold text-xs md:text-sm">{t.name}</h4><p className="text-[9px] md:text-[10px] text-orange-500 mb-3 line-clamp-1">{t.role}</p><div className="flex gap-2 w-full mt-auto"><button onClick={() => handleEditTeam(t)} className="flex-1 text-indigo-600 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded transition">Edit</button><button onClick={()=>deleteItem('teams', t.id)} className="flex-1 text-red-500 text-xs font-bold bg-red-50 hover:bg-red-100 py-1.5 rounded transition">Hapus</button></div></div>))}</div></div>
        )}

        {/* TAB TESTIMONI */}
        {activeTab === 'testimoni' && (
            <div className="max-w-4xl"><form onSubmit={saveTestimonial} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">{editTestiId && (<div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200"><span>Sedang Mengedit Testimoni</span><button type="button" onClick={cancelEditTesti} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button></div>)}<input type="text" placeholder="Nama Klien" value={testiName} onChange={e=>setTestiName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/><input type="text" placeholder="Asal Perusahaan / Instansi" value={testiCompany} onChange={e=>setTestiCompany(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required/><textarea rows="3" placeholder="Isi testimoni..." value={testiText} onChange={e=>setTestiText(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">{editTestiId ? 'Perbarui Testimoni' : 'Tambah Testimoni'}</button></form><div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">{testimonials.map(t => (<div key={t.id} className={`bg-white p-4 md:p-6 rounded-xl border flex flex-col ${editTestiId === t.id ? 'ring-2 ring-indigo-500' : ''}`}><p className="italic text-xs md:text-sm text-slate-600 mb-4">"{t.text}"</p><h4 className="font-bold text-xs md:text-sm">{t.name}</h4><p className="text-[10px] md:text-xs text-slate-400 mb-3">{t.company}</p><div className="flex gap-2 w-full mt-auto pt-4"><button onClick={() => handleEditTesti(t)} className="text-indigo-600 text-xs font-bold px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">Edit</button><button onClick={()=>deleteItem('testimonials', t.id)} className="text-red-500 text-xs font-bold px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition">Hapus</button></div></div>))}</div></div>
        )}

        {/* TAB FAQ */}
        {activeTab === 'faq' && (
            <div className="max-w-4xl"><form onSubmit={saveFaq} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">{editFaqId && (<div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200"><span>Sedang Mengedit FAQ</span><button type="button" onClick={cancelEditFaq} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button></div>)}<input type="text" placeholder="Pertanyaan" value={faqQ} onChange={e=>setFaqQ(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/><textarea rows="3" placeholder="Jawaban..." value={faqA} onChange={e=>setFaqA(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea><button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto">{editFaqId ? 'Perbarui F.A.Q' : 'Tambah F.A.Q'}</button></form><div className="space-y-3">{faqs.map(f => (<div key={f.id} className={`bg-white p-4 rounded-xl border flex flex-col md:flex-row justify-between md:items-start gap-4 ${editFaqId === f.id ? 'ring-2 ring-indigo-500' : ''}`}><div className="pr-4"><h4 className="font-bold text-xs md:text-sm mb-1">{f.q}</h4><p className="text-[10px] md:text-xs text-slate-500">{f.a}</p></div><div className="flex gap-2 w-full md:w-auto"><button onClick={() => handleEditFaq(f)} className="flex-1 md:flex-none text-indigo-600 text-xs font-bold px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">Edit</button><button onClick={()=>deleteItem('faqs', f.id)} className="flex-1 md:flex-none text-red-500 text-xs font-bold px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition">Hapus</button></div></div>))}</div></div>
        )}

        {/* TAB BLOG */}
        {activeTab === 'blog' && (
            <div className="max-w-4xl"><form onSubmit={savePost} className="bg-white p-4 md:p-8 rounded-2xl shadow-sm space-y-4 border mb-8">{editPostId && (<div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200 mb-4"><span>Anda sedang mengedit: {postTitle}</span><button type="button" onClick={cancelEditPost} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button></div>)}<input type="text" placeholder="Judul Berita" value={postTitle} onChange={e=>setPostTitle(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-base md:text-lg" required/><div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"><select value={postCategory} onChange={e=>setPostCategory(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg bg-white text-sm"><option value="News">News</option><option value="Opini">Opini</option></select><input type="text" placeholder="Dateline (Cth: Jakarta)" value={postDateline} onChange={e=>setPostDateline(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" /></div><div className="border p-3 md:p-4 rounded-lg bg-slate-50"><p className="mb-2 font-bold text-xs md:text-sm text-slate-700">Upload Sampul Berita</p><input type="file" onChange={async (e) => { if(e.target.files[0]) { setLoading(true); try { const url = await uploadToCloudinary(e.target.files[0]); setPostCoverUrl(url); alert("Gambar Sampul Siap!"); } catch(err) { alert(err.message); } setLoading(false); } }} accept="image/*" className="text-xs md:text-sm w-full mb-2" />{postCoverUrl && <img src={postCoverUrl} className="h-20 rounded-lg object-cover border" alt="Cover Preview" />}</div><div className="h-64 mb-14 md:mb-10 mt-2"><ReactQuill ref={quillRef} theme="snow" value={postContent} onChange={setPostContent} modules={modules} className="h-full bg-white rounded-b-lg" placeholder="Tulis isi berita di sini..." /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-8 md:pt-12"><input type="text" placeholder="Nama Penulis" value={postAuthor} onChange={e=>setPostAuthor(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" /><input type="text" placeholder="Tags (Pisahkan koma)" value={postTags} onChange={e=>setPostTags(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4 border-t pt-4 border-slate-100"><select value={isDraft} onChange={e => setIsDraft(e.target.value === 'true')} className="w-full border p-3 rounded-lg font-bold text-sm bg-slate-50 outline-none focus:border-indigo-500 cursor-pointer"><option value="false">🌍 Terbitkan ke Publik</option><option value="true">🔒 Simpan sebagai Draf (Sembunyikan)</option></select><button disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold text-sm hover:bg-indigo-700 transition shadow-sm">{loading ? 'Menyimpan...' : (editPostId ? 'Perbarui Berita' : 'Terbitkan Sekarang')}</button></div></form><div className="space-y-3">{posts.map(p => (<div key={p.id} className={`flex flex-col md:flex-row p-4 rounded-xl border justify-between gap-3 items-center ${p.isDraft ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'} ${editPostId === p.id ? 'ring-2 ring-indigo-500' : ''}`}><div className="flex-1"><div className="flex items-center gap-2 mb-1">{p.isDraft && <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase">DRAF</span>}<h4 className="font-bold text-sm line-clamp-1">{p.title}</h4></div></div><div className="flex gap-2 w-full md:w-auto"><button onClick={() => handleEditPost(p)} className="flex-1 md:flex-none text-indigo-600 text-xs font-bold px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">Edit</button><button onClick={()=>deleteItem('posts', p.id)} className="flex-1 md:flex-none text-red-500 text-xs font-bold px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition">Hapus</button></div></div>))}</div></div>
        )}

      </main>
    </div>
  );
}