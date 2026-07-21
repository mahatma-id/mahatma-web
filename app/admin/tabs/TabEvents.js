"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, deleteItem } from '../utils';

export default function TabEvents() {
    const [events, setEvents] = useState([]);
    const [editEventsId, setEditEventsId] = useState(null);
    const [eventsName, setEventsName] = useState('');
    const [eventsDate, setEventsDate] = useState('');
    const [eventsLocation, setEventsLocation] = useState('');
    const [eventsDesc, setEventsDesc] = useState('');
    const [eventsImgFile, setEventsImgFile] = useState(null);
    const [eventsImgUrl, setEventsImgUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "events"), orderBy("createdAt", "desc")), snap => setEvents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, []);

    const cancelEditEvents = () => { setEditEventsId(null); setEventsName(''); setEventsDate(''); setEventsLocation(''); setEventsDesc(''); setEventsImgUrl(''); setEventsImgFile(null); };
    const handleEditEvents = (e) => { setEditEventsId(e.id); setEventsName(e.name||''); setEventsDate(e.date||''); setEventsLocation(e.location||''); setEventsDesc(e.desc||''); setEventsImgUrl(e.imgUrl||''); setEventsImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
    
    const saveEvents = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try { 
            let finalImg = eventsImgUrl; 
            if (eventsImgFile) finalImg = await uploadToCloudinary(eventsImgFile); 
            const data = { name: eventsName, date: eventsDate, location: eventsLocation, desc: eventsDesc, imgUrl: finalImg }; 
            
            if (editEventsId) await updateDoc(doc(db, "events", editEventsId), data); 
            else await addDoc(collection(db, "events"), { ...data, createdAt: serverTimestamp() }); 
            
            alert('Agenda/Events Berhasil Disimpan!'); cancelEditEvents(); 
        } catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    return (
        <div className="max-w-4xl">
            <form onSubmit={saveEvents} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                {editEventsId && (
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                        <span>Sedang Mengedit Event</span>
                        <button type="button" onClick={cancelEditEvents} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Nama Event / Pelatihan</label>
                        <input type="text" value={eventsName} onChange={e=>setEventsName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Waktu Pelaksanaan</label>
                        <input type="text" value={eventsDate} onChange={e=>setEventsDate(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="Contoh: 15-16 Oktober 2025" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Lokasi / Metode</label>
                        <input type="text" value={eventsLocation} onChange={e=>setEventsLocation(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="Contoh: Zoom Meeting / Hotel XYZ" required/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
                        <textarea rows="3" value={eventsDesc} onChange={e=>setEventsDesc(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm"></textarea>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Upload Banner / Brosur</label>
                        <input type="file" onChange={e=>setEventsImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />
                        {eventsImgUrl && !eventsImgFile && <img src={eventsImgUrl} className="h-32 mt-2 rounded-lg object-cover border" alt="Cover" />}
                    </div>
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-2">
                    {loading ? 'Memproses...' : (editEventsId ? 'Perbarui Event' : 'Tambah Event')}
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(ev => (
                    <div key={ev.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4">
                        {ev.imgUrl && <img src={ev.imgUrl} className="w-full md:w-32 h-32 object-cover rounded-lg border" alt={ev.name} />}
                        <div className="flex-1 flex flex-col">
                            <h4 className="font-bold text-sm text-slate-900 mb-1">{ev.name}</h4>
                            <p className="text-[10px] font-bold text-emerald-600 mb-1">📅 {ev.date}</p>
                            <p className="text-[10px] text-slate-500 mb-2">📍 {ev.location}</p>
                            <p className="text-[10px] text-slate-600 line-clamp-2 mb-3">{ev.desc}</p>
                            <div className="flex gap-2 mt-auto border-t pt-3">
                                <button onClick={() => handleEditEvents(ev)} className="flex-1 text-indigo-600 text-[10px] font-bold py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition">Edit</button>
                                <button onClick={()=>deleteItem('events', ev.id)} className="flex-1 text-red-500 text-[10px] font-bold py-1.5 bg-red-50 hover:bg-red-100 rounded transition">Hapus</button>
                            </div>
                        </div>
                    </div>
                ))}
                {events.length === 0 && <div className="col-span-full text-center text-slate-400 py-10">Belum ada jadwal event.</div>}
            </div>
        </div>
    );
}