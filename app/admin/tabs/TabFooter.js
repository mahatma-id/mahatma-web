"use client";
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '../utils';

export default function TabFooter() {
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
        <form onSubmit={saveSettings} className="space-y-6 max-w-4xl bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="p-4 bg-slate-50 rounded-xl border">
                <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Profil & Kontak Footer</h3>
                <label className="text-xs md:text-sm font-bold text-slate-700">Deskripsi Singkat</label>
                <textarea value={settings.footerDesc || ''} onChange={e=>setSettings({...settings, footerDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-4 text-sm" rows="3"></textarea>
                <label className="text-xs md:text-sm font-bold text-slate-700">Telepon / WhatsApp</label>
                <input type="text" value={settings.phone || ''} onChange={e=>setSettings({...settings, phone: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" />
                <label className="text-xs md:text-sm font-bold text-slate-700">Email Perusahaan</label>
                <input type="email" value={settings.email || ''} onChange={e=>setSettings({...settings, email: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" />
                <label className="text-xs md:text-sm font-bold text-slate-700">Alamat Lengkap</label>
                <textarea value={settings.address || ''} onChange={e=>setSettings({...settings, address: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" rows="2"></textarea>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border">
                <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Lokasi & Maps</h3>
                <div className="mb-4 bg-white p-3 border rounded-lg">
                    <label className="text-xs font-bold block mb-2 text-slate-700">Upload Gambar Peta/Lokasi</label>
                    <input type="file" accept="image/*" onChange={async (e) => {
                        if(e.target.files[0]) {
                            setLoading(true);
                            try { const url = await uploadToCloudinary(e.target.files[0]); setSettings({...settings, mapUrl: url}); } 
                            catch(err) { alert(err.message); } setLoading(false);
                        }
                    }} className="text-xs border p-2 rounded w-full" />
                    {settings.mapUrl && <img src={settings.mapUrl} className="h-24 mt-2 object-cover rounded border p-1" alt="map"/>}
                </div>
                <label className="text-xs md:text-sm font-bold text-slate-700">Link Google Maps</label>
                <input type="text" value={settings.mapLink || ''} onChange={e=>setSettings({...settings, mapLink: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" />
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border">
                <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Media Sosial</h3>
                <label className="text-xs md:text-sm font-bold text-slate-700">LinkedIn URL</label>
                <input type="text" value={settings.linkedin || ''} onChange={e=>setSettings({...settings, linkedin: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" />
                <label className="text-xs md:text-sm font-bold text-slate-700">YouTube URL</label>
                <input type="text" value={settings.youtube || ''} onChange={e=>setSettings({...settings, youtube: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 mb-3 text-sm" />
                <label className="text-xs md:text-sm font-bold text-slate-700">Instagram URL</label>
                <input type="text" value={settings.instagram || ''} onChange={e=>setSettings({...settings, instagram: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mt-2 text-sm" />
            </div>
            <button disabled={loading} className="bg-orange-600 text-white px-6 md:px-8 py-3 rounded-lg font-bold text-sm">Simpan Footer</button>
        </form>
    );
}