"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteItem } from '../utils';

export default function TabTestimoni() {
    const [testimonials, setTestimonials] = useState([]);
    const [editTestiId, setEditTestiId] = useState(null);
    const [testiName, setTestiName] = useState('');
    const [testiCompany, setTestiCompany] = useState('');
    const [testiText, setTestiText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "testimonials"), orderBy("createdAt", "desc")), snap => setTestimonials(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, []);

    const cancelEditTesti = () => { setEditTestiId(null); setTestiName(''); setTestiCompany(''); setTestiText(''); };
    const handleEditTesti = (t) => { setEditTestiId(t.id); setTestiName(t.name||''); setTestiCompany(t.company||''); setTestiText(t.text||''); window.scrollTo({top:0, behavior:'smooth'}); };
    
    const saveTestimonial = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try { 
            const data = { name: testiName, company: testiCompany, text: testiText }; 
            if (editTestiId) await updateDoc(doc(db, "testimonials", editTestiId), data); 
            else await addDoc(collection(db, "testimonials"), { ...data, createdAt: serverTimestamp() }); 
            
            alert("Berhasil!"); cancelEditTesti(); 
        } catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    return (
        <div className="max-w-4xl">
            <form onSubmit={saveTestimonial} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                {editTestiId && (
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                        <span>Sedang Mengedit Testimoni</span>
                        <button type="button" onClick={cancelEditTesti} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Nama Klien</label>
                        <input type="text" value={testiName} onChange={e=>setTestiName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Instansi / Perusahaan</label>
                        <input type="text" value={testiCompany} onChange={e=>setTestiCompany(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="Cth: PT Maju Mundur" required/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Isi Testimoni</label>
                        <textarea rows="3" value={testiText} onChange={e=>setTestiText(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea>
                    </div>
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-2">
                    {loading ? 'Memproses...' : (editTestiId ? 'Perbarui Testimoni' : 'Tambah Testimoni')}
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testimonials.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col">
                        <p className="text-xs text-slate-600 italic mb-4 flex-1">"{t.text}"</p>
                        <div className="border-t pt-3 flex justify-between items-end">
                            <div>
                                <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                                <p className="text-[10px] text-slate-500">{t.company}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditTesti(t)} className="text-indigo-600 text-[10px] font-bold px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded transition">Edit</button>
                                <button onClick={()=>deleteItem('testimonials', t.id)} className="text-red-500 text-[10px] font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition">Hapus</button>
                            </div>
                        </div>
                    </div>
                ))}
                {testimonials.length === 0 && <div className="col-span-full text-center text-slate-400 py-10">Belum ada data testimoni.</div>}
            </div>
        </div>
    );
}