"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, deleteItem } from '../utils';

export default function TabLayanan() {
    const [services, setServices] = useState([]);
    const [editServiceId, setEditServiceId] = useState(null);
    const [serviceName, setServiceName] = useState('');
    const [serviceDesc, setServiceDesc] = useState('');
    const [serviceLink, setServiceLink] = useState('');
    const [serviceImgFile, setServiceImgFile] = useState(null);
    const [serviceImgUrl, setServiceImgUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "services"), orderBy("createdAt", "desc")), snap => setServices(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, []);

    const cancelEditService = () => { setEditServiceId(null); setServiceName(''); setServiceDesc(''); setServiceLink(''); setServiceImgUrl(''); setServiceImgFile(null); };
    const handleEditService = (s) => { setEditServiceId(s.id); setServiceName(s.name||''); setServiceDesc(s.desc||''); setServiceLink(s.link||''); setServiceImgUrl(s.imgUrl||''); setServiceImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
    
    const saveService = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try { 
            let finalImg = serviceImgUrl; 
            if (serviceImgFile) finalImg = await uploadToCloudinary(serviceImgFile); 
            const data = { name: serviceName, desc: serviceDesc, link: serviceLink || "#", imgUrl: finalImg }; 
            
            if (editServiceId) await updateDoc(doc(db, "services", editServiceId), data); 
            else await addDoc(collection(db, "services"), { ...data, createdAt: serverTimestamp() }); 
            
            alert('Berhasil!'); cancelEditService(); 
        } catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    return (
        <div className="max-w-5xl">
            <form onSubmit={saveService} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                {editServiceId && (
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                        <span>Sedang Mengedit Layanan</span>
                        <button type="button" onClick={cancelEditService} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Ikon / Gambar Layanan</label>
                        <input type="file" onChange={e=>setServiceImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />
                        {serviceImgUrl && !serviceImgFile && <img src={serviceImgUrl} className="h-20 mt-2 rounded object-contain border p-1" alt="Current" />}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Nama Layanan Utama</label>
                        <input type="text" value={serviceName} onChange={e=>setServiceName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Link Tombol (Opsional)</label>
                        <input type="text" value={serviceLink} onChange={e=>setServiceLink(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="https://" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
                        <textarea rows="3" value={serviceDesc} onChange={e=>setServiceDesc(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea>
                    </div>
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-2">
                    {loading ? 'Memproses...' : (editServiceId ? 'Perbarui Layanan' : 'Tambah Layanan Utama')}
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {services.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col">
                        {s.imgUrl && <img src={s.imgUrl} className="h-12 w-12 object-contain mb-3" alt={s.name} />}
                        <h4 className="font-bold text-sm text-slate-900 mb-1">{s.name}</h4>
                        <p className="text-xs text-slate-500 mb-4 flex-1">{s.desc}</p>
                        <div className="flex gap-2 mt-auto border-t pt-3">
                            <button onClick={() => handleEditService(s)} className="flex-1 text-indigo-600 text-[10px] font-bold py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition">Edit</button>
                            <button onClick={()=>deleteItem('services', s.id)} className="flex-1 text-red-500 text-[10px] font-bold py-1.5 bg-red-50 hover:bg-red-100 rounded transition">Hapus</button>
                        </div>
                    </div>
                ))}
                {services.length === 0 && <div className="col-span-full text-center text-slate-400 py-10">Belum ada layanan utama.</div>}
            </div>
        </div>
    );
}