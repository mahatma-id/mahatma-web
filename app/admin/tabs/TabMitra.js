"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, deleteItem } from '../utils';

export default function TabMitra() {
    const [partners, setPartners] = useState([]);
    const [editPartnerId, setEditPartnerId] = useState(null);
    const [partnerName, setPartnerName] = useState('');
    const [partnerField, setPartnerField] = useState('');
    const [partnerImgFile, setPartnerImgFile] = useState(null);
    const [partnerImgUrl, setPartnerImgUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "partners"), orderBy("createdAt", "desc")), snap => setPartners(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, []);

    const cancelEditPartner = () => { setEditPartnerId(null); setPartnerName(''); setPartnerField(''); setPartnerImgUrl(''); setPartnerImgFile(null); if(document.getElementById('partnerFileInput')) document.getElementById('partnerFileInput').value = ''; };
    const handleEditPartner = (p) => { setEditPartnerId(p.id); setPartnerName(p.name||''); setPartnerField(p.field||''); setPartnerImgUrl(p.imgUrl||''); setPartnerImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
    
    const savePartner = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try { 
            let finalImg = partnerImgUrl; 
            if (partnerImgFile) finalImg = await uploadToCloudinary(partnerImgFile); 
            const data = { name: partnerName, imgUrl: finalImg, field: partnerField }; 
            
            if (editPartnerId) await updateDoc(doc(db, "partners", editPartnerId), data); 
            else await addDoc(collection(db, "partners"), { ...data, createdAt: serverTimestamp() }); 
            
            alert("Berhasil!"); cancelEditPartner(); 
        } catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    return (
        <div className="max-w-5xl">
            <form onSubmit={savePartner} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                {editPartnerId && (
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                        <span>Sedang Mengedit Mitra</span>
                        <button type="button" onClick={cancelEditPartner} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Logo Mitra</label>
                        <input type="file" id="partnerFileInput" onChange={e=>setPartnerImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />
                        {partnerImgUrl && !partnerImgFile && <img src={partnerImgUrl} className="h-16 mt-2 rounded object-contain border bg-white p-1" alt="Current Logo" />}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Nama Mitra / Klien</label>
                        <input type="text" value={partnerName} onChange={e=>setPartnerName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Bidang / Industri</label>
                        <input type="text" value={partnerField} onChange={e=>setPartnerField(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="Cth: Manufaktur" />
                    </div>
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-2">
                    {loading ? 'Memproses...' : (editPartnerId ? 'Perbarui Data' : 'Tambah Mitra')}
                </button>
            </form>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {partners.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border flex flex-col items-center text-center shadow-sm">
                        <img src={p.imgUrl || 'https://placehold.co/100x100?text=No+Logo'} className="h-16 w-full object-contain mb-3" alt={p.name} />
                        <h4 className="font-bold text-sm text-slate-900 mb-1">{p.name}</h4>
                        <p className="text-[10px] text-slate-500 mb-3">{p.field}</p>
                        <div className="flex gap-2 w-full mt-auto">
                            <button onClick={() => handleEditPartner(p)} className="flex-1 text-indigo-600 text-[10px] font-bold py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition">Edit</button>
                            <button onClick={()=>deleteItem('partners', p.id)} className="flex-1 text-red-500 text-[10px] font-bold py-1.5 bg-red-50 hover:bg-red-100 rounded transition">Hapus</button>
                        </div>
                    </div>
                ))}
                {partners.length === 0 && <div className="col-span-2 md:col-span-4 text-center text-slate-400 py-10 border-2 border-dashed rounded-xl">Belum ada data mitra/klien.</div>}
            </div>
        </div>
    );
}