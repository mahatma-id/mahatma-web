"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, getDocs, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
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

    // --- STATE UNTUK REGISTRASI & PAYMENT ---
    const [isRegistration, setIsRegistration] = useState(false);
    const [formFields, setFormFields] = useState([{ label: 'Nama Lengkap', type: 'text', required: true }]);
    const [htmPrice, setHtmPrice] = useState(0);
    const [paymentMethods, setPaymentMethods] = useState({ cash: true, transfer: false, qris: false });
    
    // Detail Bank & QRIS
    const [bankName, setBankName] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    const [qrisId, setQrisId] = useState('');
    const [qrisNmid, setQrisNmid] = useState('');
    
    const [emailTemplate, setEmailTemplate] = useState('Terima kasih telah mendaftar di event {event_name}. Berikut adalah detail registrasi Anda...');

    // --- STATE UNTUK MELIHAT PENDAFTAR ---
    const [viewingParticipants, setViewingParticipants] = useState(null);
    const [participantsData, setParticipantsData] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "events"), orderBy("createdAt", "desc")), snap => setEvents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, []);

    const cancelEditEvents = () => { 
        setEditEventsId(null); setEventsName(''); setEventsDate(''); setEventsLocation(''); setEventsDesc(''); setEventsImgUrl(''); setEventsImgFile(null); 
        setIsRegistration(false);
        setFormFields([{ label: 'Nama Lengkap', type: 'text', required: true }]);
        setHtmPrice(0);
        setPaymentMethods({ cash: true, transfer: false, qris: false });
        setBankName(''); setBankAccount(''); setBankAccountName('');
        setQrisId(''); setQrisNmid('');
        setEmailTemplate('Terima kasih telah mendaftar di event {event_name}. Berikut adalah detail registrasi Anda...');
    };

    const handleEditEvents = (e) => { 
        setEditEventsId(e.id); setEventsName(e.name||''); setEventsDate(e.date||''); setEventsLocation(e.location||''); setEventsDesc(e.desc||''); setEventsImgUrl(e.imgUrl||''); setEventsImgFile(null); 
        setIsRegistration(e.isRegistration || false);
        setFormFields(e.formFields || [{ label: 'Nama Lengkap', type: 'text', required: true }]);
        setHtmPrice(e.htmPrice || 0);
        setPaymentMethods(e.paymentMethods || { cash: true, transfer: false, qris: false });
        setBankName(e.bankName || ''); setBankAccount(e.bankAccount || ''); setBankAccountName(e.bankAccountName || '');
        setQrisId(e.qrisId || ''); setQrisNmid(e.qrisNmid || '');
        setEmailTemplate(e.emailTemplate || 'Terima kasih telah mendaftar di event {event_name}. Berikut adalah detail registrasi Anda...');
        window.scrollTo({top:0, behavior:'smooth'}); 
    };
    
    const saveEvents = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try { 
            let finalImg = eventsImgUrl; 
            if (eventsImgFile) finalImg = await uploadToCloudinary(eventsImgFile); 
            
            const data = { 
                name: eventsName, 
                date: eventsDate, 
                location: eventsLocation, 
                desc: eventsDesc, 
                imgUrl: finalImg,
                isRegistration,
                formFields: isRegistration ? formFields : [],
                htmPrice: isRegistration ? htmPrice : 0,
                paymentMethods: isRegistration ? paymentMethods : null,
                bankName: isRegistration && paymentMethods.transfer ? bankName : '',
                bankAccount: isRegistration && paymentMethods.transfer ? bankAccount : '',
                bankAccountName: isRegistration && paymentMethods.transfer ? bankAccountName : '',
                qrisId: isRegistration && paymentMethods.qris ? qrisId : '',
                qrisNmid: isRegistration && paymentMethods.qris ? qrisNmid : '',
                emailTemplate: isRegistration ? emailTemplate : ''
            }; 
            
            if (editEventsId) {
                // Update event yang sudah ada
                await updateDoc(doc(db, "events", editEventsId), data); 
            } else {
                // Buat event baru dengan URL SLUG berdasarkan Judul
                let slug = eventsName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''); 
                if (!slug) slug = 'event-' + Date.now(); 
                
                // Cek apakah slug/judul sudah pernah dipakai
                const docSnap = await getDoc(doc(db, "events", slug)); 
                if (docSnap.exists()) slug = slug + '-' + Math.floor(Math.random() * 1000); 
                
                await setDoc(doc(db, "events", slug), { ...data, createdAt: serverTimestamp() }); 
            }
            
            alert('Agenda/Events Berhasil Disimpan!'); cancelEditEvents(); 
        } catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    const handleViewParticipants = async (ev) => {
        setViewingParticipants(ev);
        setLoadingParticipants(true);
        try {
            const q = query(collection(db, "events", ev.id, "participants"), orderBy("registeredAt", "desc"));
            const snap = await getDocs(q);
            setParticipantsData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error mengambil data peserta:", error);
            alert("Gagal memuat data pendaftar.");
        }
        setLoadingParticipants(false);
    };

    const closeParticipantsModal = () => {
        setViewingParticipants(null);
        setParticipantsData([]);
    };

    const updatePaymentStatus = async (participantId, currentStatus) => {
        const newStatus = currentStatus === 'Lunas' ? 'Menunggu Konfirmasi' : 'Lunas';
        if(confirm(`Ubah status pembayaran menjadi ${newStatus}?`)) {
            try {
                await updateDoc(doc(db, "events", viewingParticipants.id, "participants", participantId), {
                    paymentStatus: newStatus
                });
                setParticipantsData(prev => prev.map(p => p.id === participantId ? { ...p, paymentStatus: newStatus } : p));
                alert("Status berhasil diperbarui!");
            } catch (error) {
                alert("Gagal mengubah status: " + error.message);
            }
        }
    };

    const handleDeleteParticipant = async (participantId) => {
        if(confirm("Apakah Anda yakin ingin menghapus data pendaftar ini secara permanen?")) {
            try {
                await deleteDoc(doc(db, "events", viewingParticipants.id, "participants", participantId));
                setParticipantsData(prev => prev.filter(p => p.id !== participantId));
                alert("Data pendaftar berhasil dihapus.");
            } catch (error) {
                alert("Gagal menghapus data: " + error.message);
            }
        }
    };

    const handleDownloadExcel = () => {
        if (participantsData.length === 0) {
            alert("Tidak ada data untuk diunduh.");
            return;
        }

        const headers = ["No"];
        viewingParticipants.formFields.forEach(f => headers.push(f.label));
        headers.push("Metode Bayar", "Status", "Waktu Daftar");

        const rows = participantsData.map((p, index) => {
            const row = [index + 1];
            viewingParticipants.formFields.forEach(f => {
                let text = p[f.label] || '-';
                if (typeof text === 'string') {
                    text = text.replace(/"/g, '""'); 
                    if (text.includes(',') || text.includes('\n') || text.includes('"')) {
                        text = `"${text}"`;
                    }
                }
                row.push(text);
            });
            row.push(p.paymentMethod || 'Free');
            row.push(p.paymentStatus || '-');
            row.push(p.registeredAt ? p.registeredAt.toDate().toLocaleString('id-ID') : '-');
            return row.join(",");
        });

        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const fileName = `Data_Pendaftar_${viewingParticipants.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-4xl relative">
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

                    {/* --- TOGGLE FITUR REGISTRASI --- */}
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input type="checkbox" checked={isRegistration} onChange={e => setIsRegistration(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                            <span className="text-sm font-bold text-slate-700">Aktifkan Form Pendaftaran Peserta</span>
                        </label>
                    </div>

                    {isRegistration && (
                        <div className="md:col-span-2 space-y-6 bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200">
                            
                            {/* Form Builder Sederhana */}
                            <div>
                                <h4 className="text-xs font-bold text-emerald-700 mb-3 border-b border-emerald-100 pb-2">1. PERTANYAAN FORMULIR</h4>
                                {formFields.map((field, index) => (
                                    <div key={index} className="flex flex-col gap-2 mb-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex flex-col md:flex-row gap-3">
                                            <div className="flex-1">
                                                <input type="text" value={field.label} onChange={(e) => {
                                                    const newFields = [...formFields];
                                                    newFields[index].label = e.target.value;
                                                    setFormFields(newFields);
                                                }} placeholder="Pertanyaan (Cth: Asal Instansi)" className="w-full border-b-2 focus:border-emerald-500 p-2 text-sm font-bold outline-none bg-transparent" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select value={field.type} onChange={(e) => {
                                                    const newFields = [...formFields];
                                                    newFields[index].type = e.target.value;
                                                    setFormFields(newFields);
                                                }} className="border p-2 text-xs rounded-lg bg-slate-50 outline-none">
                                                    <option value="text">Teks Pendek</option>
                                                    <option value="textarea">Teks Panjang</option>
                                                    <option value="number">Angka</option>
                                                    <option value="email">Email</option>
                                                    <option value="radio">Pilihan Ganda (Satu Jawaban)</option>
                                                    <option value="checkbox">Kotak Centang (Banyak Jawaban)</option>
                                                    <option value="scale">Skala Linier (1-5)</option>
                                                </select>
                                                <label className="flex items-center gap-1 text-[10px] font-bold whitespace-nowrap bg-slate-100 p-2 rounded-lg">
                                                    <input type="checkbox" checked={field.required} onChange={(e) => {
                                                        const newFields = [...formFields];
                                                        newFields[index].required = e.target.checked;
                                                        setFormFields(newFields);
                                                    }} className="text-emerald-600 rounded" /> Wajib
                                                </label>
                                                {formFields.length > 1 && (
                                                    <button type="button" onClick={() => {
                                                        const newFields = formFields.filter((_, i) => i !== index);
                                                        setFormFields(newFields);
                                                    }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Hapus Pertanyaan">✕</button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pengaturan Ekstra Berdasarkan Tipe */}
                                        {(field.type === 'radio' || field.type === 'checkbox') && (
                                            <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Masukkan Opsi (Pisahkan dengan koma). Ketik "Yang lain" agar user bisa input teks.</label>
                                                <input type="text" placeholder="Cth: WhatsApp, Instagram, Teman, Yang lain: ..." 
                                                    value={field.options || ''} 
                                                    onChange={(e) => {
                                                        const newFields = [...formFields];
                                                        newFields[index].options = e.target.value;
                                                        setFormFields(newFields);
                                                    }}
                                                    className="w-full border p-2 text-xs rounded outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                        )}

                                        {field.type === 'scale' && (
                                            <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-4">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Label Kiri (Nilai 1)</label>
                                                    <input type="text" placeholder="Cth: Sangat Buruk / Belum Pernah" 
                                                        value={field.scaleMinLabel || ''} 
                                                        onChange={(e) => {
                                                            const newFields = [...formFields];
                                                            newFields[index].scaleMinLabel = e.target.value;
                                                            setFormFields(newFields);
                                                        }}
                                                        className="w-full border p-2 text-xs rounded outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Label Kanan (Nilai 5)</label>
                                                    <input type="text" placeholder="Cth: Sangat Baik / Sering Sekali" 
                                                        value={field.scaleMaxLabel || ''} 
                                                        onChange={(e) => {
                                                            const newFields = [...formFields];
                                                            newFields[index].scaleMaxLabel = e.target.value;
                                                            setFormFields(newFields);
                                                        }}
                                                        className="w-full border p-2 text-xs rounded outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => setFormFields([...formFields, { label: '', type: 'text', required: false }])} className="text-xs bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-lg hover:bg-emerald-200 transition">+ Tambah Pertanyaan Baru</button>
                            </div>

                            {/* Konfigurasi HTM & Pembayaran */}
                            <div className="pt-4 border-t border-slate-200">
                                <h4 className="text-xs font-bold text-emerald-700 mb-3 border-b border-emerald-100 pb-2">2. BIAYA & PEMBAYARAN</h4>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Harga Tiket (HTM) - Isi 0 jika Gratis</label>
                                <input type="number" value={htmPrice} onChange={e => setHtmPrice(Number(e.target.value))} placeholder="0" className="w-full md:w-1/2 border p-2.5 rounded-lg text-sm mb-4 bg-white outline-none focus:border-emerald-500" />
                                
                                {htmPrice > 0 && (
                                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                                        <span className="text-xs font-bold text-slate-700 mb-3 block border-b pb-2">Metode Pembayaran Tersedia:</span>
                                        
                                        {/* Opsi Cash */}
                                        <label className="flex items-center gap-2 text-sm mb-3">
                                            <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" checked={paymentMethods.cash} onChange={e => setPaymentMethods({...paymentMethods, cash: e.target.checked})} /> 
                                            Bayar di Tempat (Cash)
                                        </label>

                                        {/* Opsi Transfer */}
                                        <label className="flex items-center gap-2 text-sm mb-2">
                                            <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" checked={paymentMethods.transfer} onChange={e => setPaymentMethods({...paymentMethods, transfer: e.target.checked})} /> 
                                            Transfer Bank
                                        </label>
                                        {paymentMethods.transfer && (
                                            <div className="ml-6 mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500">Nama Bank</label>
                                                    <input type="text" placeholder="Cth: Bank BCA" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full border p-2 text-xs rounded outline-none" required />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500">Nomor Rekening</label>
                                                    <input type="text" placeholder="Cth: 1234567890" value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="w-full border p-2 text-xs rounded outline-none font-mono" required />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500">Nama Pemilik Rekening</label>
                                                    <input type="text" placeholder="Cth: Mahatma Academy" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} className="w-full border p-2 text-xs rounded outline-none" required />
                                                </div>
                                            </div>
                                        )}

                                        {/* Opsi QRIS */}
                                        <label className="flex items-center gap-2 text-sm mb-2">
                                            <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" checked={paymentMethods.qris} onChange={e => setPaymentMethods({...paymentMethods, qris: e.target.checked})} /> 
                                            QRIS
                                        </label>
                                        {paymentMethods.qris && (
                                            <div className="ml-6 mb-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Link Gambar QRIS</label>
                                                    <input type="text" placeholder="Masukkan Link (https://...)" value={qrisId} onChange={e => setQrisId(e.target.value)} className="w-full border p-2 text-xs rounded outline-none" required />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">NMID QRIS</label>
                                                    <input type="text" placeholder="Masukkan NMID (Cth: ID1029384756)" value={qrisNmid} onChange={e => setQrisNmid(e.target.value)} className="w-full border p-2 text-xs rounded outline-none font-mono" required />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Custom Auto-Email */}
                            <div className="pt-4 border-t border-slate-200">
                                <h4 className="text-xs font-bold text-emerald-700 mb-2 border-b border-emerald-100 pb-2">3. EMAIL KONFIRMASI (AUTOREPLY)</h4>
                                <p className="text-[10px] text-slate-500 mb-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                                    Gunakan tag <b>{'{name}'}</b> untuk memanggil nama peserta, <b>{'{event_name}'}</b> untuk nama event, dan <b>{'{payment_status}'}</b> untuk status bayar.
                                </p>
                                <textarea rows="6" value={emailTemplate} onChange={e => setEmailTemplate(e.target.value)} className="w-full border p-3 rounded-lg text-sm bg-white font-mono text-slate-700 outline-none focus:border-emerald-500"></textarea>
                            </div>
                        </div>
                    )}
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm w-full md:w-auto mt-4 hover:bg-indigo-700 transition shadow-md">
                    {loading ? 'Memproses...' : (editEventsId ? 'Perbarui Event' : 'Simpan Event')}
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(ev => (
                    <div key={ev.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col relative overflow-hidden">
                        {ev.isRegistration && (
                            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-sm z-10">Form Aktif</div>
                        )}
                        <div className="flex gap-4 mb-3">
                            {ev.imgUrl && <img src={ev.imgUrl} className="w-24 h-24 object-cover rounded-lg border" alt={ev.name} />}
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-slate-900 mb-1 leading-tight">{ev.name}</h4>
                                <p className="text-[10px] font-bold text-emerald-600 mb-1">📅 {ev.date}</p>
                                <p className="text-[10px] text-slate-500 line-clamp-2">📍 {ev.location}</p>
                            </div>
                        </div>
                        
                        {/* TOMBOL LIHAT PENDAFTAR */}
                        {ev.isRegistration && (
                            <button onClick={() => handleViewParticipants(ev)} className="w-full mb-3 text-emerald-700 text-xs font-bold py-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200">
                                👥 Lihat Data Pendaftar
                            </button>
                        )}
                        
                        <div className="flex gap-2 mt-auto border-t pt-3">
                            <button onClick={() => handleEditEvents(ev)} className="flex-1 text-indigo-600 text-[10px] font-bold py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded transition">Edit</button>
                            <button onClick={()=>deleteItem('events', ev.id)} className="flex-1 text-red-500 text-[10px] font-bold py-1.5 bg-red-50 hover:bg-red-100 rounded transition">Hapus</button>
                        </div>
                    </div>
                ))}
                {events.length === 0 && <div className="col-span-full text-center text-slate-400 py-10">Belum ada jadwal event.</div>}
            </div>

            {/* --- MODAL DAFTAR PESERTA --- */}
            {viewingParticipants && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                        
                        {/* Modal Header */}
                        <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-lg md:text-xl text-slate-800">Data Pendaftar</h3>
                                <p className="text-xs font-bold text-emerald-600 mt-1">{viewingParticipants.name}</p>
                            </div>
                            <button onClick={closeParticipantsModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500 transition font-bold text-xl">&times;</button>
                        </div>
                        
                        {/* Modal Body / Table */}
                        <div className="p-0 overflow-y-auto flex-1 bg-white">
                            {loadingParticipants ? (
                                <div className="text-center py-20">
                                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                    <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Memuat Data...</p>
                                </div>
                            ) : participantsData.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-slate-500 text-sm">Belum ada peserta yang mendaftar pada event ini.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-max">
                                        <thead>
                                            <tr className="bg-slate-100/50 text-[10px] md:text-xs text-slate-500 uppercase tracking-widest border-b border-slate-200">
                                                <th className="p-4 font-black">No</th>
                                                {/* Loop Label Form Dinamis */}
                                                {viewingParticipants.formFields?.map((f, i) => (
                                                    <th key={i} className="p-4 font-black">{f.label}</th>
                                                ))}
                                                <th className="p-4 font-black">Metode Bayar</th>
                                                <th className="p-4 font-black text-center">Status</th>
                                                <th className="p-4 font-black text-center">Bukti</th>
                                                <th className="p-4 font-black">Waktu Daftar</th>
                                                <th className="p-4 font-black text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs text-slate-700">
                                            {participantsData.map((p, index) => (
                                                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-bold text-slate-400">{index + 1}</td>
                                                    
                                                    {/* Loop Value Dinamis */}
                                                    {viewingParticipants.formFields?.map((f, i) => (
                                                        <td key={i} className="p-4 max-w-[200px] truncate" title={p[f.label]}>
                                                            {p[f.label] || '-'}
                                                        </td>
                                                    ))}
                                                    
                                                    <td className="p-4 font-bold uppercase text-[10px]">{p.paymentMethod || 'Free'}</td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => updatePaymentStatus(p.id, p.paymentStatus)}
                                                            className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-widest cursor-pointer transition ${p.paymentStatus === 'Lunas' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                                                            title="Klik untuk mengubah status"
                                                        >
                                                            {p.paymentStatus}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {p.paymentProof ? (
                                                            <a href={p.paymentProof} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline font-bold text-[10px]">Cek Bukti</a>
                                                        ) : <span className="text-slate-300">-</span>}
                                                    </td>
                                                    <td className="p-4 text-[10px] text-slate-500 font-mono">
                                                        {p.registeredAt ? p.registeredAt.toDate().toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '-'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {/* Tombol Hapus Pendaftar */}
                                                        <button 
                                                            onClick={() => handleDeleteParticipant(p.id)}
                                                            className="text-red-500 hover:bg-red-50 p-2 rounded transition"
                                                            title="Hapus Data Ini"
                                                        >
                                                            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">Total: {participantsData.length} Pendaftar</span>
                            <div className="flex gap-2">
                                {participantsData.length > 0 && (
                                    <button 
                                        onClick={handleDownloadExcel} 
                                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        Download Excel
                                    </button>
                                )}
                                <button onClick={closeParticipantsModal} className="px-6 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition">Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}