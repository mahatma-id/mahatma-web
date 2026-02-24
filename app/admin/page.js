"use client";
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- STATE UNTUK GENERAL SETTINGS ---
  const [generalSettings, setGeneralSettings] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoDarkFile, setLogoDarkFile] = useState(null); // Logo Dark Mode
  const [serviceImageFile, setServiceImageFile] = useState(null);
  const [missionImageFile, setMissionImageFile] = useState(null); // Gambar Misi
  const [saving, setSaving] = useState(false);

  // --- STATE UNTUK CMS LAINNYA ---
  const [activeTab, setActiveTab] = useState('general');
  const [sliders, setSliders] = useState([]);
  const [posts, setPosts] = useState([]);
  const [services, setServices] = useState([]);
  const [teams, setTeams] = useState([]);
  const [partners, setPartners] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // Form State untuk Tambah Data
  const [newSlider, setNewSlider] = useState({ title: '', subtitle: '', image: null });
  const [newPost, setNewPost] = useState({ title: '', category: '', content: '', author: '', cover: null });
  const [newService, setNewService] = useState({ name: '', desc: '', image: null, link: '' });
  const [newTeam, setNewTeam] = useState({ name: '', role: '', image: null });
  const [newPartner, setNewPartner] = useState({ name: '', field: '', image: null });
  const [newTestimonial, setNewTestimonial] = useState({ name: '', company: '', text: '' });
  const [newFaq, setNewFaq] = useState({ q: '', a: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // Load Settings
      onSnapshot(doc(db, "settings", "general"), (doc) => {
        setGeneralSettings(doc.data() || {});
      });
      // Load Collections
      onSnapshot(query(collection(db, "sliders"), orderBy("createdAt", "desc")), snap => setSliders(snap.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => setPosts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(query(collection(db, "services"), orderBy("createdAt", "desc")), snap => setServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "asc")), snap => setTeams(snap.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => setPartners(snap.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(query(collection(db, "testimonials"), orderBy("createdAt", "desc")), snap => setTestimonials(snap.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(query(collection(db, "faqs"), orderBy("createdAt", "asc")), snap => setFaqs(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, email, password); } catch (err) { alert("Login Gagal: " + err.message); }
  };

  const handleLogout = async () => { await signOut(auth); };

  // --- FUNGSI UPLOAD KE CLOUDINARY ---
  const uploadImage = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "mahatma_preset"); 
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/dx3L8B7Y/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error("Upload Error", err);
      alert("Gagal upload gambar");
      return null;
    }
  };

  // --- SAVE GENERAL SETTINGS ---
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let logoUrl = generalSettings.logoUrl;
      let logoDarkUrl = generalSettings.logoDarkUrl;
      let serviceImageUrl = generalSettings.serviceImageUrl;
      let missionImageUrl = generalSettings.missionImageUrl; // URL lama

      // Upload Logo Utama
      if (logoFile) {
        const url = await uploadImage(logoFile);
        if (url) logoUrl = url;
      }
      
      // Upload Logo Dark Mode
      if (logoDarkFile) {
        const url = await uploadImage(logoDarkFile);
        if (url) logoDarkUrl = url;
      }

      // Upload Gambar Service
      if (serviceImageFile) {
        const url = await uploadImage(serviceImageFile);
        if (url) serviceImageUrl = url;
      }

      // Upload Gambar Mission (BARU DITAMBAHKAN)
      if (missionImageFile) {
        const url = await uploadImage(missionImageFile);
        if (url) missionImageUrl = url; // Update URL baru
      }

      await updateDoc(doc(db, "settings", "general"), {
        ...generalSettings,
        logoUrl,
        logoDarkUrl,
        serviceImageUrl,
        missionImageUrl, // Simpan ke database
        updatedAt: new Date()
      });
      alert("Pengaturan Berhasil Disimpan!");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  // --- GENERIC ADD/DELETE FUNCTIONS ---
  const handleAddItem = async (collectionName, data, file, fileField = 'imageUrl') => {
    if(!confirm("Tambah data baru?")) return;
    try {
        let imgUrl = null;
        if(file) imgUrl = await uploadImage(file);
        
        const payload = { ...data, createdAt: new Date() };
        if(imgUrl) payload[fileField] = imgUrl; // Dynamic field name for image

        await addDoc(collection(db, collectionName), payload);
        alert("Data berhasil ditambahkan!");
        // Reset forms logic could go here based on collectionName
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDelete = async (collectionName, id) => {
    if(!confirm("Yakin hapus data ini?")) return;
    await deleteDoc(doc(db, collectionName, id));
  };

  if (loading) return <div className="p-10 text-center">Loading Admin...</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center text-slate-800">Admin Login</h1>
          <input type="email" placeholder="Email" className="w-full p-3 border rounded mb-4 text-slate-900" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded mb-6 text-slate-900" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded font-bold hover:bg-emerald-700 transition">Masuk</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0">
        <div className="p-6 font-bold text-xl tracking-widest border-b border-slate-800">MASE ADMIN</div>
        <nav className="flex flex-col p-4 gap-2 text-sm">
            {['general', 'sliders', 'posts', 'services', 'teams', 'partners', 'testimonials', 'faqs'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`text-left px-4 py-3 rounded-lg capitalize ${activeTab === tab ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                    {tab}
                </button>
            ))}
            <button onClick={handleLogout} className="text-left px-4 py-3 rounded-lg text-red-400 hover:bg-slate-800 mt-10">Logout</button>
        </nav>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen text-slate-800">
        <h1 className="text-3xl font-black mb-8 capitalize">{activeTab} Manager</h1>

        {/* --- 1. GENERAL SETTINGS --- */}
        {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="bg-white p-8 rounded-2xl shadow-sm space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Nama Perusahaan / Judul Web</label>
                        <input type="text" className="w-full p-3 border rounded-lg bg-slate-50" value={generalSettings.title || ''} onChange={e => setGeneralSettings({...generalSettings, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">No. WhatsApp (Format: 0812...)</label>
                        <input type="text" className="w-full p-3 border rounded-lg bg-slate-50" value={generalSettings.phone || ''} onChange={e => setGeneralSettings({...generalSettings, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Email Kontak</label>
                        <input type="email" className="w-full p-3 border rounded-lg bg-slate-50" value={generalSettings.email || ''} onChange={e => setGeneralSettings({...generalSettings, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Alamat Kantor</label>
                        <input type="text" className="w-full p-3 border rounded-lg bg-slate-50" value={generalSettings.address || ''} onChange={e => setGeneralSettings({...generalSettings, address: e.target.value})} />
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="font-bold mb-4">Logo & Branding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Logo Utama (Light Mode)</label>
                            <input type="file" onChange={e => setLogoFile(e.target.files[0])} className="text-sm" />
                            {generalSettings.logoUrl && <img src={generalSettings.logoUrl} className="h-10 mt-2 border p-1" alt="Logo" />}
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Logo Dark Mode</label>
                            <input type="file" onChange={e => setLogoDarkFile(e.target.files[0])} className="text-sm" />
                            {generalSettings.logoDarkUrl && <img src={generalSettings.logoDarkUrl} className="h-10 mt-2 bg-black border p-1" alt="Logo Dark" />}
                        </div>
                    </div>
                </div>

                {/* BAGIAN MISI - UPDATE: Input Gambar Misi Ditambahkan */}
                <div className="border-t pt-6">
                    <h3 className="font-bold mb-4">Pengaturan Misi (Our Mission)</h3>
                    <div className="mb-4">
                        <label className="block text-xs font-bold uppercase text-emerald-600 mb-2">Gambar Samping Misi (Baru)</label>
                        <input type="file" onChange={e => setMissionImageFile(e.target.files[0])} className="text-sm mb-2 block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                        {generalSettings.missionImageUrl && (
                            <img src={generalSettings.missionImageUrl} className="h-32 object-cover rounded-lg shadow-md" alt="Mission Preview" />
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Judul Misi</label>
                        <input type="text" className="w-full p-3 border rounded-lg" value={generalSettings.missionTitle || ''} onChange={e => setGeneralSettings({...generalSettings, missionTitle: e.target.value})} />
                    </div>
                    {/* Input Poin Misi 1-4 */}
                    {[1,2,3,4].map(num => (
                        <div key={num} className="mb-2">
                            <label className="block text-xs font-bold uppercase text-slate-400">Poin Misi {num}</label>
                            <input type="text" className="w-full p-2 border rounded text-sm" value={generalSettings[`mission${num}Desc`] || ''} onChange={e => setGeneralSettings({...generalSettings, [`mission${num}Desc`]: e.target.value})} />
                        </div>
                    ))}
                </div>

                <div className="border-t pt-6">
                    <h3 className="font-bold mb-4">Pengaturan Layanan (Header)</h3>
                    <div className="mb-4">
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Judul Layanan</label>
                        <input type="text" className="w-full p-3 border rounded-lg" value={generalSettings.serviceTitle || ''} onChange={e => setGeneralSettings({...generalSettings, serviceTitle: e.target.value})} />
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Deskripsi Layanan</label>
                        <textarea className="w-full p-3 border rounded-lg" rows="3" value={generalSettings.serviceDesc || ''} onChange={e => setGeneralSettings({...generalSettings, serviceDesc: e.target.value})}></textarea>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Gambar Samping Layanan</label>
                        <input type="file" onChange={e => setServiceImageFile(e.target.files[0])} className="text-sm" />
                        {generalSettings.serviceImageUrl && <img src={generalSettings.serviceImageUrl} className="h-20 mt-2 object-cover rounded" alt="Service" />}
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="font-bold mb-4">Footer & Sosmed</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Link Instagram" className="p-3 border rounded" value={generalSettings.instagram || ''} onChange={e => setGeneralSettings({...generalSettings, instagram: e.target.value})} />
                        <input type="text" placeholder="Link LinkedIn" className="p-3 border rounded" value={generalSettings.linkedin || ''} onChange={e => setGeneralSettings({...generalSettings, linkedin: e.target.value})} />
                        <input type="text" placeholder="Link YouTube" className="p-3 border rounded" value={generalSettings.youtube || ''} onChange={e => setGeneralSettings({...generalSettings, youtube: e.target.value})} />
                        <input type="text" placeholder="Deskripsi Singkat Footer" className="p-3 border rounded md:col-span-2" value={generalSettings.footerDesc || ''} onChange={e => setGeneralSettings({...generalSettings, footerDesc: e.target.value})} />
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="font-bold mb-4">Peta / Lokasi</h3>
                    <input type="text" placeholder="Link Google Maps (href)" className="w-full p-3 border rounded mb-2" value={generalSettings.mapLink || ''} onChange={e => setGeneralSettings({...generalSettings, mapLink: e.target.value})} />
                    <input type="text" placeholder="URL Gambar Peta (Bisa Screenshot)" className="w-full p-3 border rounded mb-2" value={generalSettings.mapUrl || ''} onChange={e => setGeneralSettings({...generalSettings, mapUrl: e.target.value})} />
                </div>

                <div className="border-t pt-6">
                    <h3 className="font-bold mb-4">Call To Action (Bawah)</h3>
                    <input type="text" placeholder="Judul CTA" className="w-full p-3 border rounded mb-2" value={generalSettings.ctaTitle || ''} onChange={e => setGeneralSettings({...generalSettings, ctaTitle: e.target.value})} />
                    <textarea placeholder="Deskripsi CTA" className="w-full p-3 border rounded mb-2" value={generalSettings.ctaDesc || ''} onChange={e => setGeneralSettings({...generalSettings, ctaDesc: e.target.value})}></textarea>
                    <input type="text" placeholder="Link Tombol Pesan Layanan" className="w-full p-3 border rounded mb-2" value={generalSettings.ctaLink || ''} onChange={e => setGeneralSettings({...generalSettings, ctaLink: e.target.value})} />
                </div>

                <button type="submit" disabled={saving} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold w-full hover:bg-slate-800 disabled:opacity-50">
                    {saving ? 'Menyimpan...' : 'SIMPAN SEMUA PENGATURAN'}
                </button>
            </form>
        )}

        {/* --- 2. SLIDERS MANAGER --- */}
        {activeTab === 'sliders' && (
            <div>
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
                    <h3 className="font-bold mb-4">Tambah Slider Baru</h3>
                    <div className="grid gap-4">
                        <input type="file" onChange={e => setNewSlider({...newSlider, image: e.target.files[0]})} />
                        <input type="text" placeholder="Tagline (Kuning kecil)" className="p-3 border rounded" value={newSlider.tagline || ''} onChange={e => setNewSlider({...newSlider, tagline: e.target.value})} />
                        <input type="text" placeholder="Judul Besar" className="p-3 border rounded" value={newSlider.title} onChange={e => setNewSlider({...newSlider, title: e.target.value})} />
                        <input type="text" placeholder="Sub Judul" className="p-3 border rounded" value={newSlider.subtitle} onChange={e => setNewSlider({...newSlider, subtitle: e.target.value})} />
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Teks Tombol 1" className="p-2 border rounded" value={newSlider.btn1Text || ''} onChange={e => setNewSlider({...newSlider, btn1Text: e.target.value})} />
                            <input type="text" placeholder="Link Tombol 1" className="p-2 border rounded" value={newSlider.btn1Link || ''} onChange={e => setNewSlider({...newSlider, btn1Link: e.target.value})} />
                        </div>
                        <button onClick={() => handleAddItem('sliders', newSlider, newSlider.image, 'imageUrl')} className="bg-emerald-600 text-white py-2 rounded font-bold">Tambah Slider</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sliders.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-xl shadow relative group">
                            <img src={s.imageUrl} className="h-32 w-full object-cover rounded mb-2" />
                            <h4 className="font-bold">{s.title}</h4>
                            <button onClick={() => handleDelete('sliders', s.id)} className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- 3. POSTS / BERITA --- */}
        {activeTab === 'posts' && (
            <div>
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
                    <h3 className="font-bold mb-4">Tulis Berita Baru</h3>
                    <div className="grid gap-4">
                        <input type="text" placeholder="Judul Berita" className="p-3 border rounded" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} />
                        <input type="text" placeholder="Kategori (misal: Teknologi)" className="p-3 border rounded" value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})} />
                        <input type="text" placeholder="Penulis" className="p-3 border rounded" value={newPost.author} onChange={e => setNewPost({...newPost, author: e.target.value})} />
                        <label className="text-xs font-bold text-slate-500">Cover Image</label>
                        <input type="file" onChange={e => setNewPost({...newPost, cover: e.target.files[0]})} />
                        <label className="text-xs font-bold text-slate-500">Isi Berita (HTML sederhana didukung)</label>
                        <textarea rows="6" className="p-3 border rounded" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})}></textarea>
                        <button onClick={() => handleAddItem('posts', newPost, newPost.cover, 'coverUrl')} className="bg-emerald-600 text-white py-2 rounded font-bold">Publish Berita</button>
                    </div>
                </div>
                <div className="space-y-2">
                    {posts.map(p => (
                        <div key={p.id} className="bg-white p-4 rounded-lg flex justify-between items-center shadow-sm">
                            <span className="font-bold">{p.title}</span>
                            <button onClick={() => handleDelete('posts', p.id)} className="text-red-500 text-sm hover:underline">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- 4. SERVICES --- */}
        {activeTab === 'services' && (
            <div>
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
                    <h3 className="font-bold mb-4">Tambah Layanan</h3>
                    <div className="grid gap-4">
                        <input type="text" placeholder="Nama Layanan" className="p-3 border rounded" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                        <textarea placeholder="Deskripsi Singkat" className="p-3 border rounded" value={newService.desc} onChange={e => setNewService({...newService, desc: e.target.value})}></textarea>
                        <input type="text" placeholder="Link Detail (Opsional)" className="p-3 border rounded" value={newService.link} onChange={e => setNewService({...newService, link: e.target.value})} />
                        <input type="file" onChange={e => setNewService({...newService, image: e.target.files[0]})} />
                        <button onClick={() => handleAddItem('services', newService, newService.image, 'imgUrl')} className="bg-emerald-600 text-white py-2 rounded font-bold">Simpan Layanan</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {services.map(s => (
                        <div key={s.id} className="bg-white p-4 rounded-xl shadow relative group">
                            {s.imgUrl && <img src={s.imgUrl} className="h-32 w-full object-cover rounded mb-2" />}
                            <h4 className="font-bold">{s.name}</h4>
                            <button onClick={() => handleDelete('services', s.id)} className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- 5. TEAMS --- */}
        {activeTab === 'teams' && (
            <div>
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
                    <h3 className="font-bold mb-4">Tambah Anggota Tim</h3>
                    <div className="grid gap-4">
                        <input type="text" placeholder="Nama Lengkap" className="p-3 border rounded" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} />
                        <input type="text" placeholder="Jabatan" className="p-3 border rounded" value={newTeam.role} onChange={e => setNewTeam({...newTeam, role: e.target.value})} />
                        <input type="file" onChange={e => setNewTeam({...newTeam, image: e.target.files[0]})} />
                        <button onClick={() => handleAddItem('teams', newTeam, newTeam.image, 'img')} className="bg-emerald-600 text-white py-2 rounded font-bold">Tambah Tim</button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {teams.map(t => (
                        <div key={t.id} className="bg-white p-4 rounded-xl shadow relative group text-center">
                            {t.img && <img src={t.img} className="h-24 w-24 object-cover rounded-full mx-auto mb-2" />}
                            <h4 className="font-bold text-sm">{t.name}</h4>
                            <p className="text-xs text-slate-500">{t.role}</p>
                            <button onClick={() => handleDelete('teams', t.id)} className="absolute top-2 right-2 text-red-500">x</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- 6. PARTNERS --- */}
        {activeTab === 'partners' && (
            <div>
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
                    <h3 className="font-bold mb-4">Tambah Mitra Kerja</h3>
                    <div className="grid gap-4">
                        <input type="text" placeholder="Nama Mitra" className="p-3 border rounded" value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})} />
                        <input type="text" placeholder="Bidang/Industri (Opsional)" className="p-3 border rounded" value={newPartner.field} onChange={e => setNewPartner({...newPartner, field: e.target.value})} />
                        <input type="file" onChange={e => setNewPartner({...newPartner, image: e.target.files[0]})} />
                        <button onClick={() => handleAddItem('partners', newPartner, newPartner.image, 'imgUrl')} className="bg-emerald-600 text-white py-2 rounded font-bold">Tambah Mitra</button>
                    </div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {partners.map(p => (
                        <div key={p.id} className="bg-white p-4 rounded-xl shadow relative group flex flex-col items-center">
                            {p.imgUrl ? <img src={p.imgUrl} className="h-16 object-contain" /> : <span className="text-xs font-bold">{p.name}</span>}
                            <button onClick={() => handleDelete('partners', p.id)} className="absolute top-0 right-0 bg-red-100 text-red-600 p-1 text-xs rounded-bl">x</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- 7. TESTIMONIALS --- */}
        {activeTab === 'testimonials' && (
            <div>
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
                    <h3 className="font-bold mb-4">Tambah Testimoni</h3>
                    <div className="grid gap-4">
                        <input type="text" placeholder="Nama Klien" className="p-3 border rounded" value={newTestimonial.name} onChange={e => setNewTestimonial({...newTestimonial, name: e.target.value})} />
                        <input type="text" placeholder="Perusahaan/Jabatan" className="p-3 border rounded" value={newTestimonial.company} onChange={e => setNewTestimonial({...newTestimonial, company: e.target.value})} />
                        <textarea placeholder="Isi Testimoni" className="p-3 border rounded" value={newTestimonial.text} onChange={e => setNewTestimonial({...newTestimonial, text: e.target.value})}></textarea>
                        <button onClick={() => handleAddItem('testimonials', newTestimonial)} className="bg-emerald-600 text-white py-2 rounded font-bold">Simpan Testimoni</button>
                    </div>
                </div>
                <div className="space-y-4">
                    {testimonials.map(t => (
                        <div key={t.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-emerald-500 flex justify-between">
                            <div>
                                <p className="italic text-slate-600">"{t.text}"</p>
                                <p className="text-sm font-bold mt-2">- {t.name}, {t.company}</p>
                            </div>
                            <button onClick={() => handleDelete('testimonials', t.id)} className="text-red-500 text-sm">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- 8. FAQS --- */}
        {activeTab === 'faqs' && (
            <div>
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
                    <h3 className="font-bold mb-4">Tambah FAQ</h3>
                    <div className="grid gap-4">
                        <input type="text" placeholder="Pertanyaan (Q)" className="p-3 border rounded" value={newFaq.q} onChange={e => setNewFaq({...newFaq, q: e.target.value})} />
                        <textarea placeholder="Jawaban (A)" className="p-3 border rounded" value={newFaq.a} onChange={e => setNewFaq({...newFaq, a: e.target.value})}></textarea>
                        <button onClick={() => handleAddItem('faqs', newFaq)} className="bg-emerald-600 text-white py-2 rounded font-bold">Simpan FAQ</button>
                    </div>
                </div>
                <div className="space-y-2">
                    {faqs.map(f => (
                        <div key={f.id} className="bg-white p-4 rounded-lg shadow-sm">
                            <h4 className="font-bold text-emerald-700">Q: {f.q}</h4>
                            <p className="text-slate-600">A: {f.a}</p>
                            <button onClick={() => handleDelete('faqs', f.id)} className="text-red-500 text-xs mt-2 underline">Hapus</button>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}