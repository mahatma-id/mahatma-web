"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteItem } from '../utils';

export default function TabFaq() {
    const [faqs, setFaqs] = useState([]);
    const [editFaqId, setEditFaqId] = useState(null);
    const [faqQ, setFaqQ] = useState('');
    const [faqA, setFaqA] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "faqs"), orderBy("createdAt", "asc")), snap => setFaqs(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, []);

    const cancelEditFaq = () => { setEditFaqId(null); setFaqQ(''); setFaqA(''); };
    const handleEditFaq = (f) => { setEditFaqId(f.id); setFaqQ(f.q||''); setFaqA(f.a||''); window.scrollTo({top:0, behavior:'smooth'}); };
    
    const saveFaq = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try { 
            const data = { q: faqQ, a: faqA }; 
            if (editFaqId) await updateDoc(doc(db, "faqs", editFaqId), data); 
            else await addDoc(collection(db, "faqs"), { ...data, createdAt: serverTimestamp() }); 
            
            alert("Berhasil!"); cancelEditFaq(); 
        } catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    return (
        <div className="max-w-4xl">
            <form onSubmit={saveFaq} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                {editFaqId && (
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                        <span>Sedang Mengedit FAQ</span>
                        <button type="button" onClick={cancelEditFaq} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                    </div>
                )}
                <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Pertanyaan (Question)</label>
                    <input type="text" value={faqQ} onChange={e=>setFaqQ(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" placeholder="Apa itu ISO 9001?" required/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Jawaban (Answer)</label>
                    <textarea rows="3" value={faqA} onChange={e=>setFaqA(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" required></textarea>
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-2">
                    {loading ? 'Memproses...' : (editFaqId ? 'Perbarui FAQ' : 'Tambah FAQ')}
                </button>
            </form>

            <div className="space-y-3">
                {faqs.map(f => (
                    <div key={f.id} className="bg-white p-4 rounded-xl border shadow-sm">
                        <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-start gap-2"><span className="text-orange-500">Q:</span> {f.q}</h4>
                        <p className="text-xs text-slate-600 mb-4 pl-6 border-l-2 border-slate-100 ml-2">{f.a}</p>
                        <div className="flex gap-2 border-t pt-3 mt-3">
                            <button onClick={() => handleEditFaq(f)} className="text-indigo-600 text-[10px] font-bold px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded transition">Edit</button>
                            <button onClick={()=>deleteItem('faqs', f.id)} className="text-red-500 text-[10px] font-bold px-3 py-1 bg-red-50 hover:bg-red-100 rounded transition">Hapus</button>
                        </div>
                    </div>
                ))}
                {faqs.length === 0 && <div className="text-center text-slate-400 py-10">Belum ada data FAQ.</div>}
            </div>
        </div>
    );
}