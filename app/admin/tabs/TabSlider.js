"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, deleteItem } from '../utils';

export default function TabSlider() {
    const [sliders, setSliders] = useState([]);
    const [editSliderId, setEditSliderId] = useState(null);
    const [slideTagline, setSlideTagline] = useState('');
    const [slideTitle, setSlideTitle] = useState('');
    const [slideSubtitle, setSlideSubtitle] = useState('');
    const [slideBtn1Text, setSlideBtn1Text] = useState('');
    const [slideBtn1Link, setSlideBtn1Link] = useState('');
    const [slideBtn2Text, setSlideBtn2Text] = useState('');
    const [slideBtn2Link, setSlideBtn2Link] = useState('');
    const [slideImageFile, setSlideImageFile] = useState(null);
    const [slideImageUrl, setSlideImageUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "sliders"), orderBy("createdAt", "desc")), snap => setSliders(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, []);

    const cancelEditSlider = () => { setEditSliderId(null); setSlideTagline(''); setSlideTitle(''); setSlideSubtitle(''); setSlideBtn1Text(''); setSlideBtn1Link(''); setSlideBtn2Text(''); setSlideBtn2Link(''); setSlideImageUrl(''); setSlideImageFile(null); };
    const handleEditSlider = (s) => { setEditSliderId(s.id); setSlideTagline(s.tagline || ''); setSlideTitle(s.title || ''); setSlideSubtitle(s.subtitle || ''); setSlideBtn1Text(s.btn1Text || s.btnText || ''); setSlideBtn1Link(s.btn1Link || s.btnLink || ''); setSlideBtn2Text(s.btn2Text || ''); setSlideBtn2Link(s.btn2Link || ''); setSlideImageUrl(s.imageUrl || ''); setSlideImageFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
    
    const saveSlider = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try { 
            let finalImg = slideImageUrl; 
            if (slideImageFile) finalImg = await uploadToCloudinary(slideImageFile); 
            if (!finalImg && !editSliderId) { alert("Pilih gambar!"); setLoading(false); return; } 
            
            const data = { tagline: slideTagline, title: slideTitle, subtitle: slideSubtitle, btn1Text: slideBtn1Text, btn1Link: slideBtn1Link, btn2Text: slideBtn2Text, btn2Link: slideBtn2Link, imageUrl: finalImg }; 
            
            if (editSliderId) await updateDoc(doc(db, "sliders", editSliderId), data); 
            else await addDoc(collection(db, "sliders"), { ...data, createdAt: serverTimestamp() }); 
            
            alert("Berhasil!"); cancelEditSlider(); 
        } catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    return (
        <div className="max-w-5xl">
            <form onSubmit={saveSlider} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                {editSliderId && (
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                        <span>Sedang Mengedit Slider</span>
                        <button type="button" onClick={cancelEditSlider} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Gambar Slider Utama</label>
                        <input type="file" onChange={e=>setSlideImageFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />
                        {slideImageUrl && !slideImageFile && <img src={slideImageUrl} className="h-32 mt-2 rounded object-cover border" alt="Current" />}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Tagline Kecil (Teks Atas)</label>
                        <input type="text" value={slideTagline} onChange={e=>setSlideTagline(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="Cth: Solusi Cerdas Bisnis Anda" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Judul Besar (Tengah)</label>
                        <input type="text" value={slideTitle} onChange={e=>setSlideTitle(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Sub Judul / Deskripsi</label>
                        <textarea rows="2" value={slideSubtitle} onChange={e=>setSlideSubtitle(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm"></textarea>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Teks Tombol 1</label>
                        <input type="text" value={slideBtn1Text} onChange={e=>setSlideBtn1Text(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="Cth: Hubungi Kami" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Link Tombol 1</label>
                        <input type="text" value={slideBtn1Link} onChange={e=>setSlideBtn1Link(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="/" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Teks Tombol 2 (Opsional)</label>
                        <input type="text" value={slideBtn2Text} onChange={e=>setSlideBtn2Text(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="Cth: Pelajari Lebih Lanjut" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Link Tombol 2</label>
                        <input type="text" value={slideBtn2Link} onChange={e=>setSlideBtn2Link(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="/about" />
                    </div>
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-2">
                    {loading ? 'Memproses...' : (editSliderId ? 'Perbarui Slider' : 'Tambah Slider')}
                </button>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sliders.map(s => (
                    <div key={s.id} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                        {s.imageUrl && <img src={s.imageUrl} className="h-40 w-full object-cover border-b" alt="Slider" />}
                        <div className="p-4 flex-1 flex flex-col">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{s.tagline}</p>
                            <h4 className="font-bold text-sm text-slate-900 mb-2 leading-tight">{s.title}</h4>
                            <p className="text-xs text-slate-500 mb-4 flex-1 line-clamp-2">{s.subtitle}</p>
                            <div className="flex gap-2 mt-auto border-t pt-3">
                                <button onClick={() => handleEditSlider(s)} className="flex-1 text-indigo-600 text-[10px] font-bold py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition">Edit</button>
                                <button onClick={()=>deleteItem('sliders', s.id)} className="flex-1 text-red-500 text-[10px] font-bold py-1.5 bg-red-50 hover:bg-red-100 rounded transition">Hapus</button>
                            </div>
                        </div>
                    </div>
                ))}
                {sliders.length === 0 && <div className="col-span-full text-center text-slate-400 py-10">Belum ada data slider.</div>}
            </div>
        </div>
    );
}