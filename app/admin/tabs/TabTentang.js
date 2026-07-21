"use client";
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '../utils';

export default function TabTentang() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getDoc(doc(db, "settings", "general")).then(snap => { if(snap.exists()) setSettings(snap.data()); });
    }, []);

    const saveSettings = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try { await setDoc(doc(db, "settings", "general"), settings, { merge: true }); alert("Tersimpan!"); } 
        catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    return (
        <div className="max-w-4xl bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold mb-6 text-indigo-600 text-lg border-b pb-2">Pengaturan Halaman Tentang Kami</h3>
            <form onSubmit={saveSettings} className="space-y-6">
                <div>
                    <label className="text-sm font-bold block mb-2 text-slate-700">Gambar Sampul (Hero Image)</label>
                    <input type="file" accept="image/*" onChange={async (e) => {
                        if(e.target.files[0]) {
                            setLoading(true);
                            try { const url = await uploadToCloudinary(e.target.files[0]); setSettings({...settings, aboutImageUrl: url}); alert(`Tersimpan`); } 
                            catch(err) { alert(err.message); } setLoading(false);
                        }
                    }} className="text-xs border p-2 rounded w-full" />
                    {settings.aboutImageUrl && <img src={settings.aboutImageUrl} className="h-32 mt-2 object-cover rounded border" alt="about hero"/>}
                </div>
                <div>
                    <label className="text-sm font-bold block mb-1 text-slate-700">Judul Utama</label>
                    <input type="text" value={settings.aboutTitle || ''} onChange={e=>setSettings({...settings, aboutTitle: e.target.value})} className="w-full border p-3 rounded-lg text-sm" />
                </div>
                <div>
                    <label className="text-sm font-bold block mb-1 text-slate-700">Deskripsi Lengkap</label>
                    <textarea value={settings.aboutDesc || ''} onChange={e=>setSettings({...settings, aboutDesc: e.target.value})} className="w-full border p-3 rounded-lg text-sm" rows="6"></textarea>
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold text-sm">Simpan Halaman Tentang Kami</button>
            </form>
        </div>
    );
}