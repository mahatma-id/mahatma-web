"use client";
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary } from '../utils';

export default function TabUmum() {
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
            {/* INFORMASI LOGO PATEN DARI PUBLIC */}
            <div className="mb-4 bg-emerald-50/60 border border-emerald-200/70 p-4 md:p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🛡️</span>
                        <div>
                            <h4 className="text-xs md:text-sm font-extrabold text-slate-900">Logo Resmi Mahatma Academy</h4>
                            <p className="text-[11px] text-slate-500">Logo mode terang & gelap dikelola paten langsung dari folder sistem (/public).</p>
                        </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-wider">
                        Paten Aktif
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mode Terang (Light Mode)</span>
                            <span className="text-xs font-mono font-semibold text-slate-700">/Logo Mode Terang.png</span>
                        </div>
                        <img src="/Logo Mode Terang.png" className="h-9 w-auto object-contain max-w-[120px]" alt="Logo Terang" />
                    </div>

                    <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mode Gelap (Dark Mode)</span>
                            <span className="text-xs font-mono font-semibold text-slate-300">/Logo Mode Gelap.png</span>
                        </div>
                        <img src="/Logo Mode Gelap.png" className="h-9 w-auto object-contain max-w-[120px]" alt="Logo Gelap" />
                    </div>
                </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border">
                <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Bagian: Our Mission</h3>
                <div className="mb-4 bg-white p-3 border rounded-lg">
                    <label className="text-xs font-bold block mb-2 text-slate-700">Upload Gambar Utama Misi</label>
                    <input type="file" accept="image/*" onChange={async (e) => {
                        if(e.target.files[0]) {
                            setLoading(true);
                            try { const url = await uploadToCloudinary(e.target.files[0]); setSettings({...settings, missionImageUrl: url}); } 
                            catch(err) { alert(err.message); } setLoading(false);
                        }
                    }} className="text-[10px] border p-1 rounded w-full" />
                    {settings.missionImageUrl && <img src={settings.missionImageUrl} className="h-24 mt-2 object-cover rounded border p-1" alt="preview"/>}
                </div>
                <label className="text-xs font-bold block mb-1 text-slate-700">Judul Utama Misi</label>
                <input type="text" value={settings.missionTitle || ''} onChange={e=>setSettings({...settings, missionTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" />
                <textarea value={settings.missionDesc || ''} onChange={e=>setSettings({...settings, missionDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg text-sm mb-4" rows="3"></textarea>
                
                <h4 className="font-bold text-slate-700 mb-2 mt-6 text-sm border-t pt-4">Kartu Poin Misi</h4>
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3, 4].map(num => (
                        <div key={num} className="border border-slate-200 p-3 rounded-lg bg-white">
                            <label className="text-xs font-bold block mb-1 text-slate-600">Isi Kartu Misi {num}</label>
                            <textarea rows="3" value={settings[`mission${num}Desc`] || ''} onChange={e=>setSettings({...settings, [`mission${num}Desc`]: e.target.value})} className="w-full border p-2 rounded text-sm" />
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border">
                <h3 className="font-bold mb-4 text-orange-600 border-b pb-2 text-sm md:text-base">Bagian: Our Service</h3>
                <input type="text" value={settings.serviceTitle || ''} onChange={e=>setSettings({...settings, serviceTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Judul Service" />
                <textarea value={settings.serviceDesc || ''} onChange={e=>setSettings({...settings, serviceDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-4 text-sm" rows="3"></textarea>
                <div className="border p-3 md:p-4 rounded-lg bg-white">
                    <label className="text-xs md:text-sm font-bold text-slate-700 block mb-2">Upload Gambar Layanan</label>
                    <input type="file" onChange={async (e) => { if(e.target.files[0]) { setLoading(true); try { const url = await uploadToCloudinary(e.target.files[0]); setSettings({...settings, serviceImageUrl: url}); } catch(err) { alert(err.message); } setLoading(false); } }} accept="image/*" className="text-xs border p-2 rounded w-full" />
                    {settings.serviceImageUrl && <img src={settings.serviceImageUrl} className="h-16 w-16 mt-2 object-cover rounded border" alt="Preview"/>}
                </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border">
                <h3 className="font-bold mb-4 text-red-600 border-b pb-2 text-sm md:text-base">Call To Action</h3>
                <input type="text" value={settings.ctaTitle || ''} onChange={e=>setSettings({...settings, ctaTitle: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" placeholder="Judul CTA" />
                <textarea value={settings.ctaDesc || ''} onChange={e=>setSettings({...settings, ctaDesc: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg mb-3 text-sm" rows="3"></textarea>
                <input type="text" value={settings.ctaLink || ''} onChange={e=>setSettings({...settings, ctaLink: e.target.value})} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="Link CTA" />
            </div>
            
            <button disabled={loading} className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold text-sm">{loading ? 'Menyimpan...' : 'Simpan Pengaturan Utama'}</button>
        </form>
    );
}