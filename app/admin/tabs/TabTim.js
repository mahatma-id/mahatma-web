"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, deleteItem } from '../utils';

export default function TabTim() {
    const [teams, setTeams] = useState([]);
    const [editTeamId, setEditTeamId] = useState(null);
    const [teamName, setTeamName] = useState('');
    const [teamRole, setTeamRole] = useState('');
    const [teamImgFile, setTeamImgFile] = useState(null);
    const [teamImgUrl, setTeamImgUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "asc")), snap => setTeams(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, []);

    const cancelEditTeam = () => { setEditTeamId(null); setTeamName(''); setTeamRole(''); setTeamImgUrl(''); setTeamImgFile(null); };
    const handleEditTeam = (t) => { setEditTeamId(t.id); setTeamName(t.name||''); setTeamRole(t.role||''); setTeamImgUrl(t.img||''); setTeamImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
    
    const saveTeam = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try { 
            let finalImg = teamImgUrl; 
            if (teamImgFile) finalImg = await uploadToCloudinary(teamImgFile); 
            if (!finalImg && !editTeamId) { alert("Pilih foto!"); setLoading(false); return; } 
            
            const data = { name: teamName, role: teamRole, img: finalImg }; 
            
            if (editTeamId) await updateDoc(doc(db, "teams", editTeamId), data); 
            else await addDoc(collection(db, "teams"), { ...data, createdAt: serverTimestamp() }); 
            
            alert("Berhasil!"); cancelEditTeam(); 
        } catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    return (
        <div className="max-w-5xl">
            <form onSubmit={saveTeam} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                {editTeamId && (
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                        <span>Sedang Mengedit Anggota Tim</span>
                        <button type="button" onClick={cancelEditTeam} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Foto Profil Tim</label>
                        <input type="file" onChange={e=>setTeamImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />
                        {teamImgUrl && !teamImgFile && <img src={teamImgUrl} className="h-20 w-20 mt-2 rounded-full object-cover border p-1" alt="Current" />}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                        <input type="text" value={teamName} onChange={e=>setTeamName(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Jabatan / Role</label>
                        <input type="text" value={teamRole} onChange={e=>setTeamRole(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" placeholder="Cth: Lead Auditor" required/>
                    </div>
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-2">
                    {loading ? 'Memproses...' : (editTeamId ? 'Perbarui Data Tim' : 'Tambah Anggota Tim')}
                </button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {teams.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-xl border flex flex-col items-center text-center shadow-sm">
                        <img src={t.img || 'https://placehold.co/100x100?text=No+Photo'} className="h-20 w-20 rounded-full object-cover mb-3 border-2 border-slate-100" alt={t.name} />
                        <h4 className="font-bold text-sm text-slate-900 mb-1">{t.name}</h4>
                        <p className="text-[10px] text-slate-500 mb-3">{t.role}</p>
                        <div className="flex gap-2 w-full mt-auto border-t pt-3">
                            <button onClick={() => handleEditTeam(t)} className="flex-1 text-indigo-600 text-[10px] font-bold py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition">Edit</button>
                            <button onClick={()=>deleteItem('teams', t.id)} className="flex-1 text-red-500 text-[10px] font-bold py-1.5 bg-red-50 hover:bg-red-100 rounded transition">Hapus</button>
                        </div>
                    </div>
                ))}
                {teams.length === 0 && <div className="col-span-2 md:col-span-4 text-center text-slate-400 py-10">Belum ada data tim.</div>}
            </div>
        </div>
    );
}