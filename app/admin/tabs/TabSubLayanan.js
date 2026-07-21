"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, deleteItem } from '../utils';

export default function TabSubLayanan() {
    const [services, setServices] = useState([]);
    const [subServices, setSubServices] = useState([]);
    const [editSubServiceId, setEditSubServiceId] = useState(null);
    const [subParentId, setSubParentId] = useState('');
    const [subTitle, setSubTitle] = useState('');
    const [subDesc, setSubDesc] = useState('');
    const [subImgFile, setSubImgFile] = useState(null);
    const [subImgUrl, setSubImgUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubS = onSnapshot(query(collection(db, "services"), orderBy("createdAt", "desc")), snap => setServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubSub = onSnapshot(query(collection(db, "subservices"), orderBy("createdAt", "desc")), snap => setSubServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => { unsubS(); unsubSub(); };
    }, []);

    const cancelEditSub = () => { setEditSubServiceId(null); setSubParentId(''); setSubTitle(''); setSubDesc(''); setSubImgUrl(''); setSubImgFile(null); };
    const handleEditSub = (s) => { setEditSubServiceId(s.id); setSubParentId(s.parentId||''); setSubTitle(s.title||''); setSubDesc(s.desc||''); setSubImgUrl(s.imgUrl||''); setSubImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
    
    const saveSubService = async (e) => { 
        e.preventDefault(); 
        if(!subParentId) return alert("Harap pilih Layanan Utama terlebih dahulu!"); 
        setLoading(true); 
        try { 
            let finalImg = subImgUrl; 
            if (subImgFile) finalImg = await uploadToCloudinary(subImgFile); 
            const data = { parentId: subParentId, title: subTitle, desc: subDesc, imgUrl: finalImg }; 
            
            if (editSubServiceId) await updateDoc(doc(db, "subservices", editSubServiceId), data); 
            else await addDoc(collection(db, "subservices"), { ...data, createdAt: serverTimestamp() }); 
            
            alert('Sub-Layanan Tersimpan!'); cancelEditSub(); 
        } catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    return (
        <div className="max-w-5xl">
            <form onSubmit={saveSubService} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                {editSubServiceId && (
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                        <span>Sedang Mengedit Sub-Layanan</span>
                        <button type="button" onClick={cancelEditSub} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Induk Layanan</label>
                        <select value={subParentId} onChange={e=>setSubParentId(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-sm font-bold text-indigo-700" required>
                            <option value="">-- Pilih Layanan Utama --</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Upload Ikon/Gambar Sub-Layanan</label>
                        <input type="file" onChange={e=>setSubImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />
                        {subImgUrl && !subImgFile && <img src={subImgUrl} className="h-16 mt-2 rounded object-contain border p-1 bg-white" alt="Current" />}
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Nama Sub Layanan</label>
                        <input type="text" value={subTitle} onChange={e=>setSubTitle(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Sub Layanan</label>
                        <textarea rows="3" value={subDesc} onChange={e=>setSubDesc(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea>
                    </div>
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-2">
                    {loading ? 'Memproses...' : (editSubServiceId ? 'Perbarui Sub-Layanan' : 'Tambah Sub-Layanan')}
                </button>
            </form>

            <div className="space-y-6">
                {services.map(parent => {
                    const subs = subServices.filter(sub => sub.parentId === parent.id);
                    if(subs.length === 0) return null;
                    return (
                        <div key={parent.id} className="bg-white p-4 rounded-xl border shadow-sm">
                            <h3 className="font-bold text-sm text-indigo-800 border-b pb-2 mb-3">Induk: {parent.name}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {subs.map(sub => (
                                    <div key={sub.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col">
                                        {sub.imgUrl && <img src={sub.imgUrl} className="h-8 w-8 object-contain mb-2" alt="icon"/>}
                                        <h4 className="font-bold text-xs text-slate-900 mb-1">{sub.title}</h4>
                                        <p className="text-[10px] text-slate-500 mb-2 flex-1">{sub.desc}</p>
                                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
                                            <button onClick={() => handleEditSub(sub)} className="flex-1 text-indigo-600 text-[9px] font-bold py-1 bg-white border border-indigo-100 rounded hover:bg-indigo-50 transition">Edit</button>
                                            <button onClick={()=>deleteItem('subservices', sub.id)} className="flex-1 text-red-500 text-[9px] font-bold py-1 bg-white border border-red-100 rounded hover:bg-red-50 transition">Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}