"use client";
import { useState, useEffect } from 'react';
import { collection, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, getDocs, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, deleteItem } from '../utils';
import { generateDynamicQRIS, getQRCodeImageUrl } from '@/lib/qris';

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

    // Multi-Halaman / Sections Google Forms Style
    const defaultSections = [
        {
            id: 'sec_1',
            title: 'Halaman 1: Data Diri Peserta',
            desc: 'Silakan isi data identitas Anda dengan benar untuk keperluan administrasi dan sertifikat.',
            fields: [
                { id: 'f_1', label: 'Nama Lengkap', type: 'text', required: true },
                { id: 'f_2', label: 'Alamat Email', type: 'email', required: true },
                { id: 'f_3', label: 'Nomor WhatsApp', type: 'text', required: true }
            ]
        }
    ];
    const [formSections, setFormSections] = useState(defaultSections);

    // --- HALAMAN KHUSUS GABUNG GRUP SEBELUM KLIK DAFTAR / KIRIM ---
    const [hasGroupStep, setHasGroupStep] = useState(false);
    const [groupInviteTitle, setGroupInviteTitle] = useState('Gabung Grup WhatsApp Peserta');
    const [groupInviteUrl, setGroupInviteUrl] = useState('');
    const [groupInviteDesc, setGroupInviteDesc] = useState('Silakan bergabung ke dalam grup koordinasi peserta terlebih dahulu melalui tombol di bawah ini sebelum menyelesaikan pendaftaran.');
    const [requireGroupConfirm, setRequireGroupConfirm] = useState(true);

    // --- SKEMA HTM & BIAYA ---
    // 'free' (Gratis), 'voluntary' (Sistem Ikhlas/Sukarela), 'fixed' (Satu Harga), 'tiered' (Internal vs Eksternal)
    const [pricingType, setPricingType] = useState('free');
    const [htmPrice, setHtmPrice] = useState(0);

    // Tier Internal vs Eksternal
    const [internalPricingType, setInternalPricingType] = useState('free'); // 'free' | 'voluntary' | 'fixed'
    const [internalPrice, setInternalPrice] = useState(0);
    const [internalLabel, setInternalLabel] = useState('Peserta Internal (Civitas/Member)');
    
    const [externalPricingType, setExternalPricingType] = useState('fixed'); // 'free' | 'voluntary' | 'fixed'
    const [externalPrice, setExternalPrice] = useState(50000);
    const [externalLabel, setExternalLabel] = useState('Peserta Eksternal (Umum)');

    // Metode Pembayaran
    const [paymentMethods, setPaymentMethods] = useState({ cash: true, transfer: false, qris: false });
    
    // Detail Bank & QRIS
    const [bankName, setBankName] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    
    // QRIS Dinamis & Template Background Polosan
    const [qrisTemplateBgFile, setQrisTemplateBgFile] = useState(null);
    const [qrisTemplateBgUrl, setQrisTemplateBgUrl] = useState('');
    const [qrisStaticImgFile, setQrisStaticImgFile] = useState(null);
    const [qrisStaticImgUrl, setQrisStaticImgUrl] = useState('');
    const [qrisNmid, setQrisNmid] = useState('');

    // State Pratinjau QRIS di Admin
    const [previewAmount, setPreviewAmount] = useState(50000);
    
    const [emailTemplate, setEmailTemplate] = useState('Terima kasih telah mendaftar di event {event_name}. Berikut adalah detail registrasi Anda...');

    // --- STATE UNTUK MELIHAT PENDAFTAR ---
    const [viewingParticipants, setViewingParticipants] = useState(null);
    const [participantsData, setParticipantsData] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "events"), orderBy("createdAt", "desc")), snap => {
            setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const resetForm = () => {
        setEditEventsId(null);
        setEventsName('');
        setEventsDate('');
        setEventsLocation('');
        setEventsDesc('');
        setEventsImgUrl('');
        setEventsImgFile(null);
        setIsRegistration(false);
        setFormSections([
            {
                id: 'sec_1',
                title: 'Halaman 1: Data Diri Peserta',
                desc: 'Silakan isi data identitas Anda dengan benar untuk keperluan administrasi dan sertifikat.',
                fields: [
                    { id: 'f_1', label: 'Nama Lengkap', type: 'text', required: true },
                    { id: 'f_2', label: 'Alamat Email', type: 'email', required: true },
                    { id: 'f_3', label: 'Nomor WhatsApp', type: 'text', required: true }
                ]
            }
        ]);
        setHasGroupStep(false);
        setGroupInviteTitle('Gabung Grup WhatsApp Peserta');
        setGroupInviteUrl('');
        setGroupInviteDesc('Silakan bergabung ke dalam grup koordinasi peserta terlebih dahulu melalui tombol di bawah ini sebelum menyelesaikan pendaftaran.');
        setRequireGroupConfirm(true);
        setPricingType('free');
        setHtmPrice(0);
        setInternalPricingType('free');
        setInternalPrice(0);
        setInternalLabel('Peserta Internal (Civitas/Member)');
        setExternalPricingType('fixed');
        setExternalPrice(50000);
        setExternalLabel('Peserta Eksternal (Umum)');
        setPaymentMethods({ cash: true, transfer: false, qris: false });
        setBankName('');
        setBankAccount('');
        setBankAccountName('');
        setQrisTemplateBgFile(null);
        setQrisTemplateBgUrl('');
        setQrisStaticImgFile(null);
        setQrisStaticImgUrl('');
        setQrisNmid('');
        setEmailTemplate('Terima kasih telah mendaftar di event {event_name}. Berikut adalah detail registrasi Anda...');
    };

    const handleEditEvents = (e) => { 
        setEditEventsId(e.id);
        setEventsName(e.name || '');
        setEventsDate(e.date || '');
        setEventsLocation(e.location || '');
        setEventsDesc(e.desc || '');
        setEventsImgUrl(e.imgUrl || '');
        setEventsImgFile(null);
        setIsRegistration(e.isRegistration || false);

        // Parse Sections / Form Fields
        if (e.formSections && Array.isArray(e.formSections) && e.formSections.length > 0) {
            setFormSections(e.formSections);
        } else if (e.formFields && Array.isArray(e.formFields) && e.formFields.length > 0) {
            setFormSections([
                {
                    id: 'sec_1',
                    title: 'Halaman 1: Formulir Pendaftaran',
                    desc: 'Lengkapi formulir pendaftaran di bawah ini.',
                    fields: e.formFields.map((f, i) => ({ id: `f_${i}`, ...f }))
                }
            ]);
        } else {
            setFormSections(defaultSections);
        }

        // Pengaturan Halaman Khusus Gabung Grup
        const savedGroupUrl = e.groupInviteUrl || '';
        setHasGroupStep(Boolean(e.hasGroupStep || savedGroupUrl));
        setGroupInviteTitle(e.groupInviteTitle || 'Gabung Grup WhatsApp Peserta');
        setGroupInviteUrl(savedGroupUrl);
        setGroupInviteDesc(e.groupInviteDesc || 'Silakan bergabung ke dalam grup koordinasi peserta terlebih dahulu melalui tombol di bawah ini sebelum menyelesaikan pendaftaran.');
        setRequireGroupConfirm(e.requireGroupConfirm !== undefined ? e.requireGroupConfirm : true);

        // Pricing Logic
        const detectedPricingType = e.pricingType || (e.htmPrice > 0 ? 'fixed' : 'free');
        setPricingType(detectedPricingType);
        setHtmPrice(e.htmPrice || 0);

        setInternalPricingType(e.internalPricingType || 'free');
        setInternalPrice(e.internalPrice || 0);
        setInternalLabel(e.internalLabel || 'Peserta Internal (Civitas/Member)');

        setExternalPricingType(e.externalPricingType || 'fixed');
        setExternalPrice(e.externalPrice || 50000);
        setExternalLabel(e.externalLabel || 'Peserta Eksternal (Umum)');

        setPaymentMethods(e.paymentMethods || { cash: true, transfer: false, qris: false });
        setBankName(e.bankName || '');
        setBankAccount(e.bankAccount || '');
        setBankAccountName(e.bankAccountName || '');

        setQrisTemplateBgUrl(e.qrisTemplateBgUrl || e.qrisDynamicImgUrl || '');
        setQrisTemplateBgFile(null);
        setQrisStaticImgUrl(e.qrisStaticImgUrl || (detectedPricingType === 'voluntary' ? e.qrisId : ''));
        setQrisStaticImgFile(null);
        setQrisNmid(e.qrisNmid || '');

        setEmailTemplate(e.emailTemplate || 'Terima kasih telah mendaftar di event {event_name}. Berikut adalah detail registrasi Anda...');
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };
    
    const saveEvents = async (e) => { 
        e.preventDefault();
        setLoading(true); 
        try { 
            let finalImg = eventsImgUrl; 
            if (eventsImgFile) finalImg = await uploadToCloudinary(eventsImgFile);

            // Upload Template Background Polosan QRIS
            let finalQrisTemplate = qrisTemplateBgUrl;
            if (qrisTemplateBgFile) finalQrisTemplate = await uploadToCloudinary(qrisTemplateBgFile);

            // Upload QRIS Statis
            let finalQrisStatic = qrisStaticImgUrl;
            if (qrisStaticImgFile) finalQrisStatic = await uploadToCloudinary(qrisStaticImgFile);
            
            // Flatten formFields for backwards compatibility
            const flattenedFields = formSections.flatMap(sec => sec.fields || []);

            const isNeedPayment = isRegistration && pricingType !== 'free';

            const data = { 
                name: eventsName, 
                date: eventsDate, 
                location: eventsLocation, 
                desc: eventsDesc, 
                imgUrl: finalImg,
                isRegistration,
                // Multi-halaman sections
                formSections: isRegistration ? formSections : [],
                formFields: isRegistration ? flattenedFields : [],
                // Halaman Khusus Gabung Grup Peserta Sebelum Klik Daftar
                hasGroupStep: isRegistration && hasGroupStep && Boolean(groupInviteUrl.trim()),
                groupInviteTitle: isRegistration && hasGroupStep ? (groupInviteTitle.trim() || 'Gabung Grup WhatsApp Peserta') : '',
                groupInviteUrl: isRegistration && hasGroupStep ? groupInviteUrl.trim() : '',
                groupInviteDesc: isRegistration && hasGroupStep ? groupInviteDesc.trim() : '',
                requireGroupConfirm: isRegistration && hasGroupStep ? requireGroupConfirm : true,
                // Pricing Model
                pricingType: isRegistration ? pricingType : 'free',
                htmPrice: isRegistration ? (pricingType === 'fixed' ? Number(htmPrice) : 0) : 0,
                // Tiered Pricing
                internalPricingType: isRegistration && pricingType === 'tiered' ? internalPricingType : 'free',
                internalPrice: isRegistration && pricingType === 'tiered' && internalPricingType === 'fixed' ? Number(internalPrice) : 0,
                internalLabel: isRegistration && pricingType === 'tiered' ? internalLabel : '',
                externalPricingType: isRegistration && pricingType === 'tiered' ? externalPricingType : 'fixed',
                externalPrice: isRegistration && pricingType === 'tiered' && externalPricingType === 'fixed' ? Number(externalPrice) : 0,
                externalLabel: isRegistration && pricingType === 'tiered' ? externalLabel : '',
                // Payments
                paymentMethods: isNeedPayment ? paymentMethods : null,
                bankName: isNeedPayment && paymentMethods.transfer ? bankName : '',
                bankAccount: isNeedPayment && paymentMethods.transfer ? bankAccount : '',
                bankAccountName: isNeedPayment && paymentMethods.transfer ? bankAccountName : '',
                // QRIS Dinamis & Background Polosan
                qrisTemplateBgUrl: isNeedPayment && paymentMethods.qris ? finalQrisTemplate : '',
                qrisDynamicImgUrl: isNeedPayment && paymentMethods.qris ? finalQrisTemplate : '',
                qrisStaticImgUrl: isNeedPayment && paymentMethods.qris ? finalQrisStatic : '',
                qrisNmid: isNeedPayment && paymentMethods.qris ? qrisNmid : '',
                qrisId: isNeedPayment && paymentMethods.qris ? (finalQrisTemplate || finalQrisStatic || '') : '',
                emailTemplate: isRegistration ? emailTemplate : ''
            }; 
            
            if (editEventsId) {
                await updateDoc(doc(db, "events", editEventsId), data); 
            } else {
                let slug = eventsName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''); 
                if (!slug) slug = 'event-' + Date.now(); 
                
                const docSnap = await getDoc(doc(db, "events", slug)); 
                if (docSnap.exists()) slug = slug + '-' + Math.floor(Math.random() * 1000); 
                
                await setDoc(doc(db, "events", slug), { ...data, createdAt: serverTimestamp() }); 
            }
            
            alert('Agenda/Events Berhasil Disimpan!');
            resetForm(); 
        } catch(err) { 
            alert('Gagal menyimpan: ' + err.message); 
        } 
        setLoading(false); 
    };

    // --- SECTION (HALAMAN) BUILDER HELPERS ---
    const addSection = () => {
        const nextNum = formSections.length + 1;
        setFormSections([
            ...formSections,
            {
                id: `sec_${Date.now()}`,
                title: `Halaman ${nextNum}: Bagian Baru`,
                desc: '',
                fields: [
                    { id: `f_${Date.now()}`, label: 'Pertanyaan Baru', type: 'text', required: false }
                ]
            }
        ]);
    };

    const removeSection = (secIndex) => {
        if (formSections.length <= 1) {
            alert('Minimal harus ada 1 halaman formulir!');
            return;
        }
        if (confirm(`Hapus halaman "${formSections[secIndex].title}" beserta pertanyaannya?`)) {
            setFormSections(formSections.filter((_, i) => i !== secIndex));
        }
    };

    const moveSectionUp = (secIndex) => {
        if (secIndex === 0) return;
        const newSecs = [...formSections];
        [newSecs[secIndex - 1], newSecs[secIndex]] = [newSecs[secIndex], newSecs[secIndex - 1]];
        setFormSections(newSecs);
    };

    const moveSectionDown = (secIndex) => {
        if (secIndex === formSections.length - 1) return;
        const newSecs = [...formSections];
        [newSecs[secIndex + 1], newSecs[secIndex]] = [newSecs[secIndex], newSecs[secIndex + 1]];
        setFormSections(newSecs);
    };

    const updateSectionInfo = (secIndex, field, value) => {
        const newSecs = [...formSections];
        newSecs[secIndex] = { ...newSecs[secIndex], [field]: value };
        setFormSections(newSecs);
    };

    // Pertanyaan dalam section
    const addFieldToSection = (secIndex) => {
        const newSecs = [...formSections];
        const fields = newSecs[secIndex].fields || [];
        newSecs[secIndex].fields = [
            ...fields,
            { id: `f_${Date.now()}`, label: '', type: 'text', required: false }
        ];
        setFormSections(newSecs);
    };

    const updateField = (secIndex, fIndex, key, value) => {
        const newSecs = [...formSections];
        newSecs[secIndex].fields[fIndex] = {
            ...newSecs[secIndex].fields[fIndex],
            [key]: value
        };
        setFormSections(newSecs);
    };

    const removeField = (secIndex, fIndex) => {
        const newSecs = [...formSections];
        newSecs[secIndex].fields = newSecs[secIndex].fields.filter((_, i) => i !== fIndex);
        setFormSections(newSecs);
    };

    const moveFieldUp = (secIndex, fIndex) => {
        if (fIndex === 0) return;
        const newSecs = [...formSections];
        const fields = [...newSecs[secIndex].fields];
        [fields[fIndex - 1], fields[fIndex]] = [fields[fIndex], fields[fIndex - 1]];
        newSecs[secIndex].fields = fields;
        setFormSections(newSecs);
    };

    const moveFieldDown = (secIndex, fIndex) => {
        const newSecs = [...formSections];
        const fields = [...newSecs[secIndex].fields];
        if (fIndex === fields.length - 1) return;
        [fields[fIndex + 1], fields[fIndex]] = [fields[fIndex], fields[fIndex + 1]];
        newSecs[secIndex].fields = fields;
        setFormSections(newSecs);
    };

    // --- FUNGSI MENGAMBIL DATA PENDAFTAR ---
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
        if (confirm(`Ubah status pembayaran menjadi ${newStatus}?`)) {
            try {
                await updateDoc(doc(db, "events", viewingParticipants.id, "participants", participantId), {
                    paymentStatus: newStatus
                });
                setParticipantsData(prev => prev.map(p => p.id === participantId ? { ...p, paymentStatus: newStatus } : p));
            } catch (error) {
                alert("Gagal mengubah status: " + error.message);
            }
        }
    };

    const handleDeleteParticipant = async (participantId) => {
        if (confirm("Apakah Anda yakin ingin menghapus data pendaftar ini secara permanen?")) {
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

        const allQuestions = viewingParticipants.formSections && viewingParticipants.formSections.length > 0
            ? viewingParticipants.formSections.flatMap(s => s.fields || [])
            : (viewingParticipants.formFields || []);

        const headers = ["No"];
        if (viewingParticipants.pricingType === 'tiered') {
            headers.push("Kategori Peserta");
        }
        allQuestions.forEach(f => headers.push(f.label));
        headers.push("Nominal / Tagihan", "Metode Bayar", "Status Bayar", "Waktu Daftar");

        const rows = participantsData.map((p, index) => {
            const row = [index + 1];
            if (viewingParticipants.pricingType === 'tiered') {
                row.push(p.participantCategory || '-');
            }
            allQuestions.forEach(f => {
                let text = p[f.label] || '-';
                if (typeof text === 'string') {
                    text = text.replace(/"/g, '""'); 
                    if (text.includes(',') || text.includes('\n') || text.includes('"')) {
                        text = `"${text}"`;
                    }
                }
                row.push(text);
            });
            row.push(p.paidAmount ? `Rp ${p.paidAmount.toLocaleString('id-ID')}` : (p.nominal || 'Free'));
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

    // Pratinjau live generator QRIS dinamis
    const liveDynamicPayload = qrisNmid ? generateDynamicQRIS(qrisNmid, previewAmount) : '';
    const liveQrCodeUrl = liveDynamicPayload ? getQRCodeImageUrl(liveDynamicPayload, 260) : '';
    const activeTemplateBgSrc = qrisTemplateBgFile ? URL.createObjectURL(qrisTemplateBgFile) : qrisTemplateBgUrl;

    return (
        <div className="max-w-5xl relative">
            
            {/* FORM INPUT / EDIT EVENT */}
            <form onSubmit={saveEvents} className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-200/80 mb-10 space-y-6">
                
                {/* Header Edit Alert */}
                {editEventsId && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex justify-between items-center shadow-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Sedang Mengedit Event: <span className="underline">{eventsName}</span></span>
                        </div>
                        <button type="button" onClick={resetForm} className="bg-white px-3 py-1.5 rounded-xl text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition shadow-xs cursor-pointer">
                            ✕ Batal Edit
                        </button>
                    </div>
                )}

                <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wide mb-1">Informasi Utama Event</h3>
                    <p className="text-xs text-slate-500">Kelola detail jadwal, banner, deskripsi pelatihan, serta sistem pendaftarannya.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Nama Event / Pelatihan <span className="text-red-500">*</span></label>
                        <input type="text" value={eventsName} onChange={e=>setEventsName(e.target.value)} placeholder="Contoh: Masterclass AI & Digital Transformation 2026" className="w-full border border-slate-300 p-3 rounded-xl font-bold text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Waktu Pelaksanaan <span className="text-red-500">*</span></label>
                        <input type="text" value={eventsDate} onChange={e=>setEventsDate(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition" placeholder="Contoh: 15-16 Oktober 2026" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Lokasi / Tempat Pelaksanaan <span className="text-red-500">*</span></label>
                        <input type="text" value={eventsLocation} onChange={e=>setEventsLocation(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition" placeholder="Contoh: Zoom Meeting / Hotel Grand Horison" required/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Deskripsi Lengkap Event</label>
                        <textarea rows="3" value={eventsDesc} onChange={e=>setEventsDesc(e.target.value)} placeholder="Tuliskan latar belakang, tujuan acara, dan manfaat yang didapatkan peserta..." className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"></textarea>
                    </div>
                    
                    {/* Upload Banner */}
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Upload Banner / Brosur Event (File Gambar)</label>
                        <input type="file" onChange={e=>setEventsImgFile(e.target.files[0])} accept="image/*" className="w-full border border-slate-300 p-2.5 rounded-xl bg-white text-xs cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                        {eventsImgUrl && !eventsImgFile && (
                            <div className="mt-3 flex items-center gap-3">
                                <img src={eventsImgUrl} className="h-20 w-36 rounded-xl object-cover border border-slate-300 shadow-xs" alt="Banner Event" />
                                <span className="text-[11px] text-slate-500 font-medium">Banner saat ini tersimpan di server.</span>
                            </div>
                        )}
                    </div>

                    {/* --- TOGGLE FITUR REGISTRASI --- */}
                    <div className="md:col-span-2 pt-4 border-t border-slate-200">
                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-black text-emerald-950">Aktifkan Formulir Pendaftaran Peserta</h4>
                                <p className="text-xs text-emerald-700">Aktifkan formulir Google Forms multi-step & integrasi pembayaran tiket.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isRegistration} onChange={e => setIsRegistration(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>
                    </div>

                    {isRegistration && (
                        <div className="md:col-span-2 space-y-8 bg-slate-50/70 p-5 md:p-7 rounded-3xl border border-slate-200">
                            
                            {/* ======================================================== */}
                            {/* BAGIAN 1: MULTI-HALAMAN FORMULIR (GOOGLE FORMS STYLE) */}
                            {/* ======================================================== */}
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-5">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">1</span>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Pengaturan Halaman Formulir (Google Forms Style)</h4>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">Bagi pertanyaan ke dalam beberapa halaman (sections) bertahap seperti pada Google Forms.</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={addSection}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer self-start"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                        + Tambah Halaman Baru
                                    </button>
                                </div>

                                {/* Render Tiap Halaman / Section */}
                                <div className="space-y-6">
                                    {formSections.map((section, sIndex) => (
                                        <div key={section.id || sIndex} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-xs">
                                            
                                            {/* Header Section */}
                                            <div className="bg-slate-100/90 border-b border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                                        Halaman {sIndex + 1} dari {formSections.length}
                                                    </span>
                                                </div>

                                                {/* Reorder & Delete Section */}
                                                <div className="flex items-center gap-1.5 self-end md:self-auto">
                                                    {sIndex > 0 && (
                                                        <button type="button" onClick={() => moveSectionUp(sIndex)} title="Pindah Halaman ke Atas" className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300">
                                                            ▲ Naik
                                                        </button>
                                                    )}
                                                    {sIndex < formSections.length - 1 && (
                                                        <button type="button" onClick={() => moveSectionDown(sIndex)} title="Pindah Halaman ke Bawah" className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300">
                                                            ▼ Turun
                                                        </button>
                                                    )}
                                                    {formSections.length > 1 && (
                                                        <button type="button" onClick={() => removeSection(sIndex)} title="Hapus Halaman Ini" className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-200 ml-1">
                                                            ✕ Hapus Halaman
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Section Title & Description */}
                                            <div className="p-4 md:p-5 border-b border-slate-100 bg-emerald-50/20 space-y-3">
                                                <div>
                                                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1">Judul Halaman / Bagian</label>
                                                    <input 
                                                        type="text" 
                                                        value={section.title} 
                                                        onChange={e => updateSectionInfo(sIndex, 'title', e.target.value)} 
                                                        placeholder="Contoh: Halaman 1: Data Diri & Instansi" 
                                                        className="w-full border border-slate-300 p-2.5 rounded-xl font-bold text-sm bg-white focus:border-emerald-500 outline-none" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1">Deskripsi Halaman (Opsional)</label>
                                                    <input 
                                                        type="text" 
                                                        value={section.desc || ''} 
                                                        onChange={e => updateSectionInfo(sIndex, 'desc', e.target.value)} 
                                                        placeholder="Contoh: Silakan isi data diri Anda untuk keperluan e-sertifikat resmi Mahatma Academy." 
                                                        className="w-full border border-slate-300 p-2 rounded-xl text-xs bg-white focus:border-emerald-500 outline-none text-slate-600" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 mb-1">
                                                        <span>💬</span>
                                                        <span>Link Grup WhatsApp / Telegram pada Halaman Ini (Opsional)</span>
                                                    </label>
                                                    <input 
                                                        type="url" 
                                                        value={section.groupLink || ''} 
                                                        onChange={e => updateSectionInfo(sIndex, 'groupLink', e.target.value)} 
                                                        placeholder="Contoh: https://chat.whatsapp.com/... (Jika diisi, akan muncul tombol klik Gabung Grup di halaman ini)" 
                                                        className="w-full border border-emerald-200 p-2 rounded-xl text-xs bg-white focus:border-emerald-500 outline-none text-emerald-800 font-mono" 
                                                    />
                                                </div>
                                            </div>

                                            {/* Questions inside this section */}
                                            <div className="p-4 md:p-5 space-y-4">
                                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Pertanyaan pada Halaman Ini ({section.fields?.length || 0}):</p>
                                                
                                                {(section.fields || []).map((field, fIndex) => (
                                                    <div key={field.id || fIndex} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 relative group">
                                                        
                                                        {/* Actions Top Right */}
                                                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                                            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                                Pertanyaan #{fIndex + 1}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                {fIndex > 0 && (
                                                                    <button type="button" onClick={() => moveFieldUp(sIndex, fIndex)} className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-600 rounded text-xs border" title="Geser ke Atas">↑</button>
                                                                )}
                                                                {fIndex < (section.fields?.length || 0) - 1 && (
                                                                    <button type="button" onClick={() => moveFieldDown(sIndex, fIndex)} className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-600 rounded text-xs border" title="Geser ke Bawah">↓</button>
                                                                )}
                                                                <button type="button" onClick={() => removeField(sIndex, fIndex)} className="w-6 h-6 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded text-xs border border-red-200 ml-1" title="Hapus Pertanyaan">✕</button>
                                                            </div>
                                                        </div>

                                                        {/* Question Input */}
                                                        <div>
                                                            <input 
                                                                type="text" 
                                                                value={field.label} 
                                                                onChange={e => updateField(sIndex, fIndex, 'label', e.target.value)} 
                                                                placeholder="Tuliskan Pertanyaan (Contoh: Asal Instansi / Universitas)" 
                                                                className="w-full border border-slate-300 p-2.5 rounded-lg text-sm font-bold bg-white focus:border-emerald-500 outline-none" 
                                                            />
                                                        </div>

                                                        {/* Type & Required */}
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <select 
                                                                value={field.type} 
                                                                onChange={e => updateField(sIndex, fIndex, 'type', e.target.value)} 
                                                                className="flex-1 min-w-[160px] border border-slate-300 p-2 text-xs rounded-lg bg-white outline-none focus:border-emerald-500 font-medium"
                                                            >
                                                                <option value="text">Teks Pendek (Jawaban Singkat)</option>
                                                                <option value="textarea">Teks Panjang (Paragraf)</option>
                                                                <option value="number">Angka / Nomor</option>
                                                                <option value="email">Email</option>
                                                                <option value="radio">Pilihan Ganda (Satu Pilihan)</option>
                                                                <option value="checkbox">Kotak Centang (Banyak Pilihan)</option>
                                                                <option value="scale">Skala Linier (1 - 5)</option>
                                                            </select>

                                                            <label className="flex items-center gap-1.5 text-xs font-bold bg-white px-3 py-2 rounded-lg border border-slate-200 cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={field.required} 
                                                                    onChange={e => updateField(sIndex, fIndex, 'required', e.target.checked)} 
                                                                    className="text-emerald-600 rounded cursor-pointer w-4 h-4" 
                                                                /> 
                                                                <span>Wajib Diisi</span>
                                                            </label>
                                                        </div>

                                                        {/* Extra Settings for Choice/Scale */}
                                                        {(field.type === 'radio' || field.type === 'checkbox') && (
                                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Pilihan Opsi (Pisahkan dengan koma). Sertakan kata "Yang lain" bila ingin ada input teks bebas.</label>
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Cth: WhatsApp, Instagram, Rekan Kerja, Yang lain: ..." 
                                                                    value={field.options || ''} 
                                                                    onChange={e => updateField(sIndex, fIndex, 'options', e.target.value)} 
                                                                    className="w-full border border-slate-300 p-2 text-xs rounded-lg outline-none focus:border-emerald-500" 
                                                                />
                                                            </div>
                                                        )}

                                                        {field.type === 'scale' && (
                                                            <div className="bg-white p-3 rounded-lg border border-slate-200 flex gap-3 flex-wrap">
                                                                <div className="flex-1 min-w-[130px]">
                                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Label Kiri (Nilai 1)</label>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Cth: Sangat Tidak Setuju" 
                                                                        value={field.scaleMinLabel || ''} 
                                                                        onChange={e => updateField(sIndex, fIndex, 'scaleMinLabel', e.target.value)} 
                                                                        className="w-full border border-slate-300 p-2 text-xs rounded-lg outline-none focus:border-emerald-500" 
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-[130px]">
                                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Label Kanan (Nilai 5)</label>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="Cth: Sangat Setuju" 
                                                                        value={field.scaleMaxLabel || ''} 
                                                                        onChange={e => updateField(sIndex, fIndex, 'scaleMaxLabel', e.target.value)} 
                                                                        className="w-full border border-slate-300 p-2 text-xs rounded-lg outline-none focus:border-emerald-500" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                <button 
                                                    type="button" 
                                                    onClick={() => addFieldToSection(sIndex)} 
                                                    className="w-full py-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                                                    + Tambah Pertanyaan di Halaman Ini
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ======================================================== */}
                                {/* HALAMAN KHUSUS GABUNG GRUP SEBELUM KLIK DAFTAR / KIRIM */}
                                {/* ======================================================== */}
                                <div className="mt-6 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white rounded-2xl border-2 border-emerald-300 p-5 shadow-xs space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
                                                💬
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h5 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                                        Halaman Khusus Gabung Grup (Sebelum Klik Daftar)
                                                    </h5>
                                                    <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                                                        Fitur Khusus Grup
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                                    Buat halaman khusus otomatis di tahap akhir sebelum tombol <b>Daftar / Kirim</b> agar peserta wajib klik tautan grup (WhatsApp / Telegram) terlebih dahulu.
                                                </p>
                                            </div>
                                        </div>

                                        <label className="inline-flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border-2 border-emerald-500 cursor-pointer shrink-0 self-start sm:self-center shadow-2xs">
                                            <input
                                                type="checkbox"
                                                checked={hasGroupStep}
                                                onChange={(e) => setHasGroupStep(e.target.checked)}
                                                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                            />
                                            <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                                                {hasGroupStep ? 'Aktif' : 'Aktifkan Halaman Grup'}
                                            </span>
                                        </label>
                                    </div>

                                    {hasGroupStep && (
                                        <div className="bg-white p-4 md:p-5 rounded-xl border border-emerald-200 space-y-4 pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                                                        Judul Halaman / Nama Grup
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={groupInviteTitle}
                                                        onChange={(e) => setGroupInviteTitle(e.target.value)}
                                                        placeholder="Contoh: Halaman Khusus: Gabung Grup WhatsApp Peserta"
                                                        className="w-full border border-slate-300 p-2.5 rounded-xl text-xs font-bold bg-white focus:border-emerald-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block mb-1">
                                                        Link Undangan Grup (WhatsApp / Telegram) <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={groupInviteUrl}
                                                        onChange={(e) => setGroupInviteUrl(e.target.value)}
                                                        placeholder="https://chat.whatsapp.com/..."
                                                        required={hasGroupStep}
                                                        className="w-full border-2 border-emerald-400 p-2.5 rounded-xl text-xs font-mono font-bold bg-emerald-50/30 focus:bg-white focus:border-emerald-600 outline-none text-emerald-900"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                                                    Pesan Instruksi untuk Peserta
                                                </label>
                                                <input
                                                    type="text"
                                                    value={groupInviteDesc}
                                                    onChange={(e) => setGroupInviteDesc(e.target.value)}
                                                    placeholder="Silakan klik tombol Gabung Grup di bawah ini sebelum menyelesaikan pendaftaran..."
                                                    className="w-full border border-slate-300 p-2.5 rounded-xl text-xs bg-white focus:border-emerald-500 outline-none text-slate-700"
                                                />
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={requireGroupConfirm}
                                                        onChange={(e) => setRequireGroupConfirm(e.target.checked)}
                                                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                                    />
                                                    <span>Wajibkan peserta mencentang konfirmasi <b>&ldquo;Saya sudah masuk grup&rdquo;</b> sebelum bisa klik Daftar</span>
                                                </label>
                                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                    ✓ Muncul otomatis sebagai halaman terakhir sebelum tombol Daftar
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ======================================================== */}
                            {/* BAGIAN 2: SKEMA BIAYA HTM (IKHLAS, SATU HARGA, TIERED) */}
                            {/* ======================================================== */}
                            <div className="border-t border-slate-200 pt-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">2</span>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Skema Biaya / HTM (Harga Tiket Masuk)</h4>
                                </div>
                                <p className="text-xs text-slate-500 mb-4">Pilih sistem HTM: Gratis, Sistem Bayar Seikhlasnya (Donasi Sukarela), Nominal Tetap, atau Beda Harga Internal vs Eksternal.</p>

                                {/* Pilihan Model Biaya */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                                    {[
                                        { id: 'free', title: 'Gratis (Free)', desc: 'Tidak ada biaya pendaftaran apapun.' },
                                        { id: 'voluntary', title: 'Sistem Ikhlas', desc: 'Tanpa nominal harga. Peserta bayar seikhlasnya.' },
                                        { id: 'fixed', title: 'Satu Harga Tetap', desc: 'Nominal harga sama untuk seluruh peserta.' },
                                        { id: 'tiered', title: 'Internal & Eksternal', desc: 'Beda harga untuk peserta internal vs eksternal.' }
                                    ].map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => setPricingType(item.id)}
                                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${pricingType === item.id ? 'bg-emerald-50/80 border-emerald-600 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-black text-slate-900">{item.title}</span>
                                                <input type="radio" name="pricingType" checked={pricingType === item.id} onChange={() => setPricingType(item.id)} className="text-emerald-600" />
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Form Input Berdasarkan Model Biaya */}
                                {pricingType === 'fixed' && (
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 mb-6">
                                        <label className="text-xs font-bold text-slate-700 block mb-1.5">Nominal Harga Tiket (HTM) per Peserta (Rp)</label>
                                        <div className="relative max-w-sm">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">Rp</span>
                                            <input 
                                                type="number" 
                                                value={htmPrice} 
                                                onChange={e => setHtmPrice(Number(e.target.value))} 
                                                placeholder="50000" 
                                                className="w-full border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl font-bold text-sm outline-none focus:border-emerald-500" 
                                            />
                                        </div>
                                    </div>
                                )}

                                {pricingType === 'tiered' && (
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 mb-6 space-y-5">
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                                            💡 Pada formulir pendaftaran, peserta akan diminta memilih apakah mereka termasuk <b>Internal</b> atau <b>Eksternal</b>, dan tagihannya otomatis disesuaikan.
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* Tier Internal */}
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Kategori Internal</span>
                                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Civitas / Member</span>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Label Kategori Internal</label>
                                                    <input 
                                                        type="text" 
                                                        value={internalLabel} 
                                                        onChange={e => setInternalLabel(e.target.value)} 
                                                        placeholder="Cth: Anggota / Mahasiswa Internal" 
                                                        className="w-full border p-2 rounded-lg text-xs bg-white font-medium outline-none focus:border-emerald-500" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Skema Biaya Internal</label>
                                                    <select 
                                                        value={internalPricingType} 
                                                        onChange={e => setInternalPricingType(e.target.value)} 
                                                        className="w-full border p-2 rounded-lg text-xs bg-white outline-none focus:border-emerald-500"
                                                    >
                                                        <option value="free">Gratis (Rp 0)</option>
                                                        <option value="voluntary">Sistem Ikhlas (Donasi Bebas)</option>
                                                        <option value="fixed">Nominal Tetap (Rp)</option>
                                                    </select>
                                                </div>
                                                {internalPricingType === 'fixed' && (
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Nominal Harga Internal (Rp)</label>
                                                        <input 
                                                            type="number" 
                                                            value={internalPrice} 
                                                            onChange={e => setInternalPrice(Number(e.target.value))} 
                                                            className="w-full border p-2 rounded-lg text-xs bg-white font-bold outline-none focus:border-emerald-500" 
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tier Eksternal */}
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Kategori Eksternal</span>
                                                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Umum</span>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Label Kategori Eksternal</label>
                                                    <input 
                                                        type="text" 
                                                        value={externalLabel} 
                                                        onChange={e => setExternalLabel(e.target.value)} 
                                                        placeholder="Cth: Peserta Umum / Eksternal" 
                                                        className="w-full border p-2 rounded-lg text-xs bg-white font-medium outline-none focus:border-emerald-500" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Skema Biaya Eksternal</label>
                                                    <select 
                                                        value={externalPricingType} 
                                                        onChange={e => setExternalPricingType(e.target.value)} 
                                                        className="w-full border p-2 rounded-lg text-xs bg-white outline-none focus:border-emerald-500"
                                                    >
                                                        <option value="fixed">Nominal Tetap (Rp)</option>
                                                        <option value="voluntary">Sistem Ikhlas (Donasi Bebas)</option>
                                                        <option value="free">Gratis (Rp 0)</option>
                                                    </select>
                                                </div>
                                                {externalPricingType === 'fixed' && (
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Nominal Harga Eksternal (Rp)</label>
                                                        <input 
                                                            type="number" 
                                                            value={externalPrice} 
                                                            onChange={e => setExternalPrice(Number(e.target.value))} 
                                                            className="w-full border p-2 rounded-lg text-xs bg-white font-bold outline-none focus:border-emerald-500" 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ======================================================== */}
                                {/* BAGIAN 3: METODE PEMBAYARAN & UPLOAD QRIS (FILE UPLOAD) */}
                                {/* ======================================================== */}
                                {pricingType !== 'free' && (
                                    <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 space-y-5">
                                        <div className="border-b border-slate-200 pb-3">
                                            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">Pilihan Metode Pembayaran Aktif</h5>
                                            <p className="text-[11px] text-slate-500">Centang opsi yang diizinkan untuk digunakan peserta pada saat registrasi.</p>
                                        </div>

                                        <div className="flex flex-wrap gap-4">
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" checked={paymentMethods.cash} onChange={e => setPaymentMethods({...paymentMethods, cash: e.target.checked})} /> 
                                                Bayar di Tempat (Cash)
                                            </label>
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" checked={paymentMethods.transfer} onChange={e => setPaymentMethods({...paymentMethods, transfer: e.target.checked})} /> 
                                                Transfer Bank
                                            </label>
                                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" checked={paymentMethods.qris} onChange={e => setPaymentMethods({...paymentMethods, qris: e.target.checked})} /> 
                                                QRIS Dinamis Otomatis (Scan E-Wallet / M-Banking)
                                            </label>
                                        </div>

                                        {/* Form Rekening Bank */}
                                        {paymentMethods.transfer && (
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                                <p className="text-xs font-black text-slate-800">Detail Rekening Bank:</p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Bank</label>
                                                        <input type="text" placeholder="Cth: Bank BCA / Mandiri" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full border p-2 text-xs rounded-lg outline-none bg-white font-medium" required />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Nomor Rekening</label>
                                                        <input type="text" placeholder="Cth: 1234567890" value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="w-full border p-2 text-xs rounded-lg outline-none bg-white font-mono font-bold" required />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Atas Nama Pemilik</label>
                                                        <input type="text" placeholder="Cth: Mahatma Academy" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} className="w-full border p-2 text-xs rounded-lg outline-none bg-white font-medium" required />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Form QRIS: NMID Generator & Background Polosan */}
                                        {paymentMethods.qris && (
                                            <div className="p-5 bg-emerald-50/50 border border-emerald-300 rounded-2xl space-y-6">
                                                <div>
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-2">
                                                        <span>⚡</span>
                                                        <span>QRIS Dinamis Generator & Template Polosan</span>
                                                    </div>
                                                    <h6 className="text-sm font-black text-emerald-950">Pengaturan QR Code Otomatis Sesuai Harga</h6>
                                                    <p className="text-xs text-emerald-800 leading-relaxed mt-1">
                                                        Cukup salin <b>NMID Anda</b> (atau string QRIS statis). Sistem akan secara otomatis meng-generate QR Code dengan nominal pembayaran yang tepat (misal Rp 50.000). Anda dapat mengunggah <b>gambar background polosan</b> (template kotak kosong), dan posisi QR Code otomatis diletakkan tepat di tengah-tengahnya!
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    
                                                    {/* Input NMID / Payload QRIS */}
                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                                                        <label className="text-xs font-bold text-slate-800 block">
                                                            1. Salin / Masukkan NMID Anda <span className="text-red-500">*</span>
                                                        </label>
                                                        <p className="text-[10px] text-slate-500 leading-tight">
                                                            Ketik kode NMID Anda (contoh: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold text-emerald-700">ID1020304050607</code>) atau paste seluruh string QRIS statis toko Anda (<code className="bg-slate-100 px-1 py-0.5 rounded">000201...</code>).
                                                        </p>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Contoh: ID1020304050607 atau 000201010211..." 
                                                            value={qrisNmid} 
                                                            onChange={e => setQrisNmid(e.target.value)} 
                                                            className="w-full border border-slate-300 p-2.5 text-xs rounded-lg font-mono font-bold outline-none focus:border-emerald-500 bg-slate-50/50" 
                                                            required={paymentMethods.qris}
                                                        />
                                                    </div>

                                                    {/* Upload Background Polosan */}
                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs font-bold text-slate-800">
                                                                2. Upload Background Polosan
                                                            </label>
                                                            <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                                Kotak Kosong
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 leading-tight">
                                                            Unggah gambar template QRIS polosan (poster dengan kotak kosong di tengah).
                                                        </p>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={e => setQrisTemplateBgFile(e.target.files[0])} 
                                                            className="w-full border border-slate-300 p-2 rounded-lg bg-slate-50 text-xs cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-blue-100 file:text-blue-800" 
                                                        />
                                                        {qrisTemplateBgUrl && !qrisTemplateBgFile && (
                                                            <span className="text-[10px] text-emerald-600 font-bold block">✓ Background polosan tersimpan di Cloudinary</span>
                                                        )}
                                                    </div>

                                                    {/* Upload QRIS Statis Utuh (Opsional untuk sistem ikhlas murni) */}
                                                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs font-bold text-slate-800">
                                                                3. Upload Gambar QRIS Statis Utuh (Opsional / Fallback)
                                                            </label>
                                                            <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                                                Sistem Ikhlas
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 leading-tight">
                                                            Gambar QRIS statis biasa untuk opsi pembayaran seikhlasnya tanpa kotak kosong.
                                                        </p>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={e => setQrisStaticImgFile(e.target.files[0])} 
                                                            className="w-full border border-slate-300 p-2 rounded-lg bg-slate-50 text-xs cursor-pointer file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-emerald-100 file:text-emerald-800" 
                                                        />
                                                    </div>
                                                </div>

                                                {/* ======================================================== */}
                                                {/* PRATINJAU INTERAKTIF POSISI QR CODE DI TENGAH TEMPLATE */}
                                                {/* ======================================================== */}
                                                <div className="bg-white p-5 rounded-2xl border-2 border-emerald-400 shadow-sm space-y-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                                        <div>
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                                Live Preview Admin
                                                            </span>
                                                            <h6 className="font-black text-xs md:text-sm text-slate-900 mt-1">Pratinjau Hasil QRIS Dinamis & Posisi di Tengah Template</h6>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-500 font-bold">Coba Nominal:</span>
                                                            <div className="relative w-32">
                                                                <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[10px] font-bold text-slate-400">Rp</span>
                                                                <input 
                                                                    type="number" 
                                                                    value={previewAmount} 
                                                                    onChange={e => setPreviewAmount(Number(e.target.value))} 
                                                                    className="w-full border border-slate-300 pl-7 pr-2 py-1 rounded-lg text-xs font-bold outline-none focus:border-emerald-500" 
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-2">
                                                        
                                                        {/* Container Visual Template Polosan + QR Code Overlay */}
                                                        {activeTemplateBgSrc ? (
                                                            <div className="relative w-72 md:w-80 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-md bg-white">
                                                                {/* Background Polosan */}
                                                                <img 
                                                                    src={activeTemplateBgSrc} 
                                                                    alt="Template Background Polosan" 
                                                                    className="w-full h-auto block" 
                                                                />
                                                                
                                                                {/* QR Code Dinamis Otomatis Tepat di Posisi Tengah (Center) */}
                                                                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                                                                    {liveQrCodeUrl ? (
                                                                        <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-200">
                                                                            <img 
                                                                                src={liveQrCodeUrl} 
                                                                                alt="QR Code Dinamis" 
                                                                                className="w-36 h-36 md:w-40 md:h-40 object-contain block" 
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="bg-white/95 p-4 rounded-xl border border-dashed border-emerald-500 text-center text-xs font-bold text-emerald-800">
                                                                            Isi NMID untuk memunculkan QR Code di tengah
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl max-w-sm">
                                                                {liveQrCodeUrl ? (
                                                                    <div className="space-y-3">
                                                                        <div className="bg-white p-3 rounded-2xl shadow-sm border inline-block">
                                                                            <img src={liveQrCodeUrl} alt="QR Code Dinamis" className="w-40 h-40 object-contain mx-auto" />
                                                                        </div>
                                                                        <p className="text-xs font-bold text-slate-700">QR Code seharga Rp {previewAmount.toLocaleString('id-ID')} siap!</p>
                                                                        <p className="text-[10px] text-slate-400">Unggah template background polosan di atas jika ingin QR code berada di tengah template poster.</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-slate-400 text-xs py-6">
                                                                        Unggah background polosan dan isi NMID untuk melihat pratinjau.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Detail Keterangan Hasil Generator */}
                                                        <div className="text-left text-xs space-y-2 max-w-sm">
                                                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                                                                <p className="font-bold flex items-center gap-1.5">
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                                    Status Generator Dinamis Aktif
                                                                </p>
                                                                <p className="text-[11px] text-emerald-800 leading-snug">
                                                                    Ketika peserta mendaftar seharga <b>Rp {previewAmount.toLocaleString('id-ID')}</b>, QR code di atas otomatis berisi data nominal tersebut dan ketika di-scan langsung terisi nominalnya di m-banking/e-wallet peserta.
                                                                </p>
                                                            </div>

                                                            {qrisNmid && (
                                                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[10px] break-all">
                                                                    <span className="text-slate-400 font-bold block mb-0.5">Payload QRIS Dinamis:</span>
                                                                    <span className="text-slate-700 font-bold">{liveDynamicPayload || '-'}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ======================================================== */}
                            {/* BAGIAN 4: TEMPLATE EMAIL KONFIRMASI */}
                            {/* ======================================================== */}
                            <div className="border-t border-slate-200 pt-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">3</span>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Template Email Konfirmasi Tiket</h4>
                                </div>
                                <p className="text-xs text-slate-500 mb-3">Teks ini dikirimkan otomatis ke alamat email peserta setelah formulir dikirim.</p>
                                
                                <p className="text-[11px] text-slate-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-2 font-medium">
                                    Tag otomatis: Gunakan <b>{'{name}'}</b> untuk nama peserta, <b>{'{event_name}'}</b> untuk nama event, dan <b>{'{payment_status}'}</b> untuk status pembayaran.
                                </p>
                                <textarea rows="4" value={emailTemplate} onChange={e => setEmailTemplate(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl text-xs bg-white font-mono text-slate-700 outline-none focus:border-emerald-500"></textarea>
                            </div>

                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="pt-2 flex items-center gap-3">
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Menyimpan Event...</span>
                            </>
                        ) : (
                            <>
                                <span>{editEventsId ? 'Perbarui Jadwal Event' : 'Simpan Event Baru'}</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                            </>
                        )}
                    </button>
                    {editEventsId && (
                        <button type="button" onClick={resetForm} className="px-5 py-3.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition">
                            Batal
                        </button>
                    )}
                </div>
            </form>

            {/* DAFTAR EVENT YANG ADA */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-black text-slate-900 uppercase">Jadwal Event Aktif ({events.length})</h3>
                    <p className="text-xs text-slate-500">Kelola pendaftar, edit data, atau hapus agenda event.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(ev => {
                    const priceBadge = ev.pricingType === 'tiered' 
                        ? 'Internal & Eksternal' 
                        : ev.pricingType === 'voluntary' 
                        ? 'Sistem Ikhlas' 
                        : ev.htmPrice > 0 
                        ? `Rp ${ev.htmPrice.toLocaleString('id-ID')}` 
                        : 'Gratis';

                    return (
                        <div key={ev.id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col relative overflow-hidden group hover:shadow-md transition">
                            {ev.isRegistration && (
                                <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs z-10 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                                    <span>Formulir Aktif</span>
                                </div>
                            )}

                            <div className="flex gap-4 mb-3">
                                {ev.imgUrl ? (
                                    <img src={ev.imgUrl} className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0" alt={ev.name} />
                                ) : (
                                    <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-bold text-center p-2 shrink-0">
                                        Tanpa Banner
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            📅 {ev.date}
                                        </span>
                                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                            {priceBadge}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-sm text-slate-900 mb-1 leading-snug line-clamp-2">{ev.name}</h4>
                                    <p className="text-[11px] text-slate-500 line-clamp-1">📍 {ev.location}</p>
                                </div>
                            </div>
                            
                            {ev.isRegistration && (
                                <button 
                                    onClick={() => handleViewParticipants(ev)} 
                                    className="w-full mb-3 text-emerald-700 text-xs font-bold py-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    <span>Lihat Data Pendaftar</span>
                                </button>
                            )}
                            
                            <div className="flex gap-2 mt-auto border-t border-slate-100 pt-3">
                                <button onClick={() => handleEditEvents(ev)} className="flex-1 text-slate-700 hover:text-emerald-700 text-xs font-bold py-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl transition cursor-pointer">
                                    Edit
                                </button>
                                <button onClick={() => deleteItem('events', ev.id)} className="flex-1 text-red-600 hover:text-white text-xs font-bold py-2 bg-red-50 hover:bg-red-600 border border-red-200 hover:border-transparent rounded-xl transition cursor-pointer">
                                    Hapus
                                </button>
                            </div>
                        </div>
                    );
                })}
                {events.length === 0 && (
                    <div className="col-span-full text-center text-slate-400 py-16 bg-white rounded-3xl border border-slate-200">
                        Belum ada jadwal event yang ditambahkan.
                    </div>
                )}
            </div>

            {/* ======================================================== */}
            {/* MODAL LIHAT PENDAFTAR */}
            {/* ======================================================== */}
            {viewingParticipants && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[999] flex items-center justify-center p-3 md:p-6 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
                        
                        {/* Modal Header */}
                        <div className="p-5 md:p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                                    Panel Data Pendaftar
                                </span>
                                <h3 className="font-black text-lg md:text-xl text-slate-900 mt-1">{viewingParticipants.name}</h3>
                                <p className="text-xs text-slate-500">📅 {viewingParticipants.date} &bull; 📍 {viewingParticipants.location}</p>
                            </div>
                            <button onClick={closeParticipantsModal} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600 transition font-black text-lg cursor-pointer">
                                &times;
                            </button>
                        </div>
                        
                        {/* Modal Body / Table */}
                        <div className="overflow-y-auto flex-1 bg-white">
                            {loadingParticipants ? (
                                <div className="text-center py-20">
                                    <div className="w-9 h-9 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                    <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Memuat Data Pendaftar...</p>
                                </div>
                            ) : participantsData.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3 text-2xl">📋</div>
                                    <p className="text-slate-600 font-bold text-sm">Belum ada peserta yang mendaftar pada event ini.</p>
                                    <p className="text-slate-400 text-xs mt-1">Data akan otomatis muncul di sini saat peserta mengirim formulir pendaftaran.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-max">
                                        <thead>
                                            <tr className="bg-slate-100/75 text-[11px] text-slate-600 uppercase tracking-wider border-b border-slate-200 font-black">
                                                <th className="p-4">No</th>
                                                {viewingParticipants.pricingType === 'tiered' && (
                                                    <th className="p-4">Kategori</th>
                                                )}
                                                {(viewingParticipants.formSections && viewingParticipants.formSections.length > 0 
                                                    ? viewingParticipants.formSections.flatMap(s => s.fields || []) 
                                                    : (viewingParticipants.formFields || [])
                                                ).map((f, i) => (
                                                    <th key={i} className="p-4">{f.label}</th>
                                                ))}
                                                <th className="p-4">Nominal / HTM</th>
                                                <th className="p-4">Metode Bayar</th>
                                                <th className="p-4 text-center">Status</th>
                                                <th className="p-4 text-center">Bukti Bayar</th>
                                                <th className="p-4">Waktu Daftar</th>
                                                <th className="p-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                                            {participantsData.map((p, index) => (
                                                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-4 font-bold text-slate-400">{index + 1}</td>
                                                    
                                                    {viewingParticipants.pricingType === 'tiered' && (
                                                        <td className="p-4 font-bold">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] ${p.participantCategory === 'Internal' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                {p.participantCategory || 'Eksternal'}
                                                            </span>
                                                        </td>
                                                    )}

                                                    {(viewingParticipants.formSections && viewingParticipants.formSections.length > 0 
                                                        ? viewingParticipants.formSections.flatMap(s => s.fields || []) 
                                                        : (viewingParticipants.formFields || [])
                                                    ).map((f, i) => (
                                                        <td key={i} className="p-4 max-w-[220px] truncate" title={p[f.label]}>
                                                            {p[f.label] || '-'}
                                                        </td>
                                                    ))}
                                                    
                                                    <td className="p-4 font-bold">
                                                        {p.paidAmount ? (
                                                            <span className="text-emerald-700 font-mono">Rp {p.paidAmount.toLocaleString('id-ID')}</span>
                                                        ) : (
                                                            <span className="text-slate-500">{p.nominal || 'Free'}</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 font-bold uppercase text-[10px] text-slate-600">{p.paymentMethod || 'Free'}</td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => updatePaymentStatus(p.id, p.paymentStatus)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition ${p.paymentStatus === 'Lunas' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                                                            title="Klik untuk mengubah status pembayaran"
                                                        >
                                                            {p.paymentStatus}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {p.paymentProof ? (
                                                            <a href={p.paymentProof} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-bold text-[11px] underline">
                                                                <span>Lihat Bukti</span>
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                                            </a>
                                                        ) : <span className="text-slate-300">-</span>}
                                                    </td>
                                                    <td className="p-4 text-[11px] text-slate-500 font-mono">
                                                        {p.registeredAt ? p.registeredAt.toDate().toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '-'}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => handleDeleteParticipant(p.id)}
                                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition cursor-pointer"
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
                        <div className="p-4 md:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <span className="text-xs font-bold text-slate-600">Total: <span className="text-emerald-700 font-black">{participantsData.length}</span> Peserta Terdaftar</span>
                            <div className="flex gap-2.5 w-full sm:w-auto">
                                {participantsData.length > 0 && (
                                    <button 
                                        onClick={handleDownloadExcel} 
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        Export CSV / Excel
                                    </button>
                                )}
                                <button onClick={closeParticipantsModal} className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition cursor-pointer">
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
