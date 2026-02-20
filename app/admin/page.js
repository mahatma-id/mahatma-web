"use client";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import 'react-quill-new/dist/quill.snow.css';
import Link from 'next/link';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('umum'); // umum, slider, layanan, blog
  const [loading, setLoading] = useState(false);

  // === GLOBAL HELPER: UPLOAD CLOUDINARY ===
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // Ganti preset Cloudinary Anda jika beda
    const cloudName = 'dgexjl9sf'; // Cloud Name Anda

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || "Gagal upload gambar");
  };

  // === STATE: PENGATURAN UMUM ===
  const [settings, setSettings] = useState({
      logoUrl: '', missionTitle: '', missionDesc: '', serviceTitle: '', serviceDesc: ''
  });

  // === STATE: SLIDER ===
  const [sliders, setSliders] = useState([]);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideBtnText, setSlideBtnText] = useState('');
  const [slideBtnLink, setSlideBtnLink] = useState('');
  const [slideImageFile, setSlideImageFile] = useState(null);

  // === STATE: LAYANAN ===
  const [services, setServices] = useState([]);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceLink, setServiceLink] = useState('');

  // === STATE: BLOG / BERITA ===
  const [posts, setPosts] = useState([]);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('News');
  const [postCoverUrl, setPostCoverUrl] = useState('');
  const [postDateline, setPostDateline] = useState('');
  const [postAuthor, setPostAuthor] = useState('');
  const [postTags, setPostTags] = useState('');

  // === FETCH DATA (REALTIME) ===
  useEffect(() => {
    getDoc(doc(db, "settings", "general")).then(snap => { if(snap.exists()) setSettings(snap.data()); });
    const unsubSliders = onSnapshot(query(collection(db, "sliders"), orderBy("createdAt", "desc")), snap => setSliders(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubServices = onSnapshot(query(collection(db, "services"), orderBy("createdAt", "desc")), snap => setServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => setPosts(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubSliders(); unsubServices(); unsubPosts(); };
  }, []);

  // === HANDLERS ===
  const saveSettings = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
          await setDoc(doc(db, "settings", "general"), settings, { merge: true });
          alert("Pengaturan Umum Tersimpan!");
      } catch(err) { alert(err.message); }
      setLoading(false);
  };

  const addSlider = async (e) => {
      e.preventDefault();
      if(!slideImageFile) return alert("Pilih gambar slider!");
      setLoading(true);
      try {
          const imageUrl = await uploadToCloudinary(slideImageFile);
          await addDoc(collection(db, "sliders"), {
              title: slideTitle, subtitle: slideSubtitle, btnText: slideBtnText, btnLink: slideBtnLink, imageUrl, createdAt: serverTimestamp()
          });
          alert("Slider berhasil ditambahkan!");
          setSlideTitle(''); setSlideSubtitle(''); setSlideBtnText(''); setSlideBtnLink(''); setSlideImageFile(null);
      } catch(err) { alert(err.message); }
      setLoading(false);
  };

  const addService = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
          await addDoc(collection(db, "services"), { name: serviceName, desc: serviceDesc, link: serviceLink || "#", createdAt: serverTimestamp() });
          alert('Layanan Ditambahkan!'); setServiceName(''); setServiceDesc(''); setServiceLink('');
      } catch(err) { alert(err.message); } setLoading(false);
  };

  // ==========================================
  // LOGIKA BARU: SIMPAN BERITA DENGAN LINK SEO
  // ==========================================
  const addPost = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
          // 1. Ubah Judul menjadi Link SEO (Slug)
          // Contoh: "Berita Hari Ini!" -> "berita-hari-ini"
          let slug = postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          if (!slug) slug = 'berita-' + Date.now();

          // 2. Cek apakah link tersebut sudah dipakai oleh berita lain
          const docRef = doc(db, "posts", slug);
          const docSnap = await getDoc(docRef);
          
          // Jika sudah dipakai, tambahkan angka acak di belakangnya agar unik
          if (docSnap.exists()) {
              slug = slug + '-' + Math.floor(Math.random() * 1000);
          }

          // 3. Simpan ke Firebase menggunakan slug sebagai ID Dokumen
          await setDoc(doc(db, "posts", slug), { 
              title: postTitle, 
              category: postCategory, 
              content: postContent, 
              coverUrl: postCoverUrl, 
              dateline: postDateline,
              author: postAuthor || 'Tim Redaksi',
              tags: postTags,
              views: 0, // Mulai penghitung pembaca dari 0
              createdAt: serverTimestamp() 
          });

          alert('Berita Diterbitkan dengan Link Kustom!'); 
          setPostTitle(''); setPostContent(''); setPostCoverUrl(''); setPostDateline(''); setPostAuthor(''); setPostTags('');
      } catch(err) { alert(err.message); } 
      setLoading(false);
  };

  const deleteItem = async (col, id) => {
      if(confirm(`Hapus data ini?`)) await deleteDoc(doc(db, col, id));
  };

  // === UI RENDER ===
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col shadow-xl z-10">
        <h1 className="text-xl font-bold mb-10 text-orange-500 tracking-widest border-b border-slate-700 pb-4">ADMIN PANEL</h1>
        <nav className="space-y-2 flex-1">
            {['umum', 'slider', 'layanan', 'blog'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left p-3 rounded-lg font-bold capitalize transition ${activeTab === tab ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    {tab}
                </button>
            ))}
        </nav>
        <Link href="/" target="_blank" className="text-center p-3 bg-white/10 hover:bg-white hover:text-slate-900 rounded-lg font-bold transition text-sm">Lihat Website ↗</Link>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-3xl font-extrabold mb-8 capitalize border-b pb-4">Kelola {activeTab}</h2>
        
        {/* TAB 1: UMUM */}
        {activeTab === 'umum' && (
            <form onSubmit={saveSettings} className="space-y-8 max-w-4xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <label className="font-bold text-slate-700">URL Logo (Pojok Kiri Atas)</label>
                    <input type="url" value={settings.logoUrl} onChange={e=>setSettings({...settings, logoUrl: e.target.value})} className="w-full border p-3 rounded-lg mt-2 focus:border-orange-500 outline-none" placeholder="https://.../logo.png" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2">Section: Our Mission</h3>
                    <input type="text" value={settings.missionTitle} onChange={e=>setSettings({...settings, missionTitle: e.target.value})} className="w-full border p-3 rounded-lg mb-3" placeholder="Judul Mission (Cth: Solusi Terintegrasi...)" />
                    <textarea value={settings.missionDesc} onChange={e=>setSettings({...settings, missionDesc: e.target.value})} className="w-full border p-3 rounded-lg" rows="3" placeholder="Deskripsi Mission"></textarea>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="font-bold mb-4 text-orange-600 border-b pb-2">Section: Our Service</h3>
                    <input type="text" value={settings.serviceTitle} onChange={e=>setSettings({...settings, serviceTitle: e.target.value})} className="w-full border p-3 rounded-lg mb-3" placeholder="Judul Service" />
                    <textarea value={settings.serviceDesc} onChange={e=>setSettings({...settings, serviceDesc: e.target.value})} className="w-full border p-3 rounded-lg" rows="3" placeholder="Deskripsi Service"></textarea>
                </div>
                <button disabled={loading} className="bg-orange-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-700">Simpan Pengaturan Umum</button>
            </form>
        )}

        {/* TAB 2: SLIDER */}
        {activeTab === 'slider' && (
            <div className="max-w-4xl">
                <form onSubmit={addSlider} className="bg-white p-8 rounded-2xl shadow-sm space-y-4 border border-slate-200 mb-10">
                    <input type="file" onChange={e=>setSlideImageFile(e.target.files[0])} accept="image/*" className="w-full border p-3 rounded-lg bg-slate-50" />
                    <input type="text" placeholder="Judul Slider (Besar)" value={slideTitle} onChange={e=>setSlideTitle(e.target.value)} className="w-full border p-3 rounded-lg font-bold text-lg" required/>
                    <input type="text" placeholder="Sub-Judul / Deskripsi" value={slideSubtitle} onChange={e=>setSlideSubtitle(e.target.value)} className="w-full border p-3 rounded-lg" />
                    <div className="flex gap-4">
                        <input type="text" placeholder="Teks Tombol (Opsional)" value={slideBtnText} onChange={e=>setSlideBtnText(e.target.value)} className="w-full border p-3 rounded-lg" />
                        <input type="text" placeholder="Link Tombol (Opsional)" value={slideBtnLink} onChange={e=>setSlideBtnLink(e.target.value)} className="w-full border p-3 rounded-lg" />
                    </div>
                    <button disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700">{loading ? 'Mengupload...' : 'Tambah Slider'}</button>
                </form>

                <h3 className="font-bold text-xl mb-4">Daftar Slider Aktif</h3>
                <div className="grid grid-cols-1 gap-4">
                    {sliders.map(s => (
                        <div key={s.id} className="flex bg-white p-4 rounded-xl border items-center gap-4">
                            <img src={s.imageUrl} className="w-32 h-20 object-cover rounded-lg" />
                            <div className="flex-1"><h4 className="font-bold">{s.title}</h4><p className="text-sm text-gray-500">{s.subtitle}</p></div>
                            <button onClick={()=>deleteItem('sliders', s.id)} className="text-red-500 font-bold px-4">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* TAB 3: LAYANAN */}
        {activeTab === 'layanan' && (
            <div className="max-w-4xl">
                <form onSubmit={addService} className="bg-white p-8 rounded-2xl shadow-sm space-y-4 border border-slate-200 mb-10">
                    <input type="text" placeholder="Nama Layanan (Cth: Consulting, School of Data)" value={serviceName} onChange={e=>setServiceName(e.target.value)} className="w-full border p-3 rounded-lg font-bold" required/>
                    <textarea rows="3" placeholder="Deskripsi Singkat Layanan..." value={serviceDesc} onChange={e=>setServiceDesc(e.target.value)} className="w-full border p-3 rounded-lg" required></textarea>
                    <button disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold">Tambah Layanan</button>
                </form>
                <div className="grid grid-cols-2 gap-4">
                    {services.map(s => (
                        <div key={s.id} className="bg-white p-6 rounded-xl border flex flex-col"><h4 className="font-bold text-lg mb-2">{s.name}</h4><p className="text-sm text-gray-500 mb-4">{s.desc}</p><button onClick={()=>deleteItem('services', s.id)} className="mt-auto text-red-500 text-sm font-bold bg-red-50 py-2 rounded">Hapus</button></div>
                    ))}
                </div>
            </div>
        )}

        {/* TAB 4: BLOG */}
        {activeTab === 'blog' && (
            <div className="max-w-4xl">
                <form onSubmit={addPost} className="bg-white p-8 rounded-2xl shadow-sm space-y-4 border border-slate-200 mb-10">
                    <input type="text" placeholder="Judul Berita" value={postTitle} onChange={e=>setPostTitle(e.target.value)} className="w-full border p-3 rounded-lg font-bold text-lg" required/>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select value={postCategory} onChange={e=>setPostCategory(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                            <option value="News">News</option>
                            <option value="Opini">Opini</option>
                        </select>
                        <input type="text" placeholder="Dateline (Cth: Jakarta)" value={postDateline} onChange={e=>setPostDateline(e.target.value)} className="w-full border p-3 rounded-lg" />
                    </div>

                    <div className="border border-slate-300 p-4 rounded-lg bg-slate-50">
                        <p className="mb-2 font-bold text-sm text-slate-700">Upload Sampul (Cloudinary)</p>
                        <input type="file" onChange={async (e) => { if(e.target.files[0]) { setLoading(true); try { const url = await uploadToCloudinary(e.target.files[0]); setPostCoverUrl(url); alert("Gambar Siap!"); } catch(err) { alert(err.message); } setLoading(false); } }} accept="image/*" className="text-sm" />
                        {postCoverUrl && <p className="text-emerald-600 text-xs mt-2 font-bold">✓ Gambar siap digunakan!</p>}
                    </div>

                    <div className="h-64 mb-10"><ReactQuill theme="snow" value={postContent} onChange={setPostContent} className="h-full bg-white" /></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
                        <input type="text" placeholder="Nama Penulis" value={postAuthor} onChange={e=>setPostAuthor(e.target.value)} className="w-full border p-3 rounded-lg" />
                        <input type="text" placeholder="Tags (Pisahkan koma)" value={postTags} onChange={e=>setPostTags(e.target.value)} className="w-full border p-3 rounded-lg" />
                    </div>

                    <button disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold mt-4 w-full shadow-md hover:bg-indigo-700 transition">
                        {loading ? 'Memproses...' : 'Terbitkan Berita'}
                    </button>
                </form>

                <div className="space-y-3">
                    {posts.map(p => (
                        <div key={p.id} className="flex bg-white p-4 rounded-xl border items-center justify-between">
                            <div className="flex flex-col">
                                <h4 className="font-bold">{p.title}</h4>
                                <a href={`/berita/${p.id}`} target="_blank" className="text-xs text-indigo-500 hover:underline mt-1">mahatma.id/berita/{p.id}</a>
                            </div>
                            <button onClick={()=>deleteItem('posts', p.id)} className="text-red-500 font-bold px-4 py-2 bg-red-50 rounded-lg">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}