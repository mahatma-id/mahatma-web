"use client";
import { useEffect, useState, use } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
// Note: Pastikan utils.js ada di luar folder admin jika ingin dipakai global, 
// atau buat fungsi upload ulang disini. Kita asumsikan letaknya bisa diakses.
import { uploadToCloudinary } from '@/app/admin/utils'; 

export default function EventDetail({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // State Formulir
    const [formData, setFormData] = useState({});
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const docRef = doc(db, "events", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setEventData({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) { console.error(error); }
            setLoading(false);
        };
        fetchEvent();
    }, [id]);

    const handleInputChange = (label, value) => {
        setFormData({ ...formData, [label]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Cari field email untuk tujuan pengiriman
            let recipientEmail = '';
            let participantName = '';
            
            eventData.formFields.forEach(field => {
                if (field.type === 'email') recipientEmail = formData[field.label];
                if (field.label.toLowerCase().includes('nama')) participantName = formData[field.label];
            });

            if (!recipientEmail) throw new Error("Formulir tidak memiliki field Email untuk pengiriman tiket!");

            // 2. Upload Bukti Bayar (Jika Ada)
            let proofUrl = '';
            if (paymentProof) {
                proofUrl = await uploadToCloudinary(paymentProof);
            }

            // 3. Simpan Data ke Firestore (Subkoleksi participants)
            const participantData = {
                ...formData,
                paymentMethod: paymentMethod || 'Free',
                paymentProof: proofUrl,
                paymentStatus: (eventData.htmPrice > 0 && paymentMethod !== 'cash') ? 'Menunggu Konfirmasi' : 'Lunas',
                registeredAt: serverTimestamp()
            };
            
            await addDoc(collection(db, "events", id, "participants"), participantData);

            // 4. Parsing Template Email
            let emailBody = eventData.emailTemplate || `Terima kasih {name} telah mendaftar di {event_name}.`;
            emailBody = emailBody.replace(/{name}/g, participantName || 'Peserta');
            emailBody = emailBody.replace(/{event_name}/g, eventData.name);
            emailBody = emailBody.replace(/{payment_status}/g, participantData.paymentStatus);
            
            // Konversi newline (enter) jadi tag <br> untuk HTML email
            const htmlEmail = emailBody.replace(/\n/g, '<br>');

            // 5. Kirim Request ke API Nodemailer
            const emailRes = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipientEmail,
                    subject: `Pendaftaran Berhasil: ${eventData.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #059669;">Pendaftaran Berhasil!</h2>
                            <p>${htmlEmail}</p>
                            <hr style="border: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #888;">Email ini dikirim otomatis oleh sistem Mahatma Academy.</p>
                        </div>
                    `
                })
            });

            if (!emailRes.ok) throw new Error("Gagal mengirim email konfirmasi.");

            setIsSuccess(true);
        } catch (error) {
            alert("Error: " + error.message);
        }
        setIsSubmitting(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold tracking-widest">MEMUAT EVENT...</p></div>;
    if (!eventData) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl font-bold">Event Tidak Ditemukan</h1></div>;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-12">
            <div className="max-w-3xl mx-auto">
                <Link href="/events" className="text-emerald-600 font-bold text-xs uppercase tracking-widest mb-6 inline-block">&larr; Kembali ke Jadwal</Link>
                
                {/* Info Event */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                    {eventData.imgUrl && <img src={eventData.imgUrl} className="w-full h-64 object-cover" alt="Banner" />}
                    <div className="p-6 md:p-8">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-widest">{eventData.date}</span>
                        <h1 className="text-3xl font-black text-slate-900 mt-4 mb-2">{eventData.name}</h1>
                        <p className="text-sm font-bold text-slate-500 mb-6">📍 {eventData.location}</p>
                        <p className="text-slate-600 text-sm leading-relaxed">{eventData.desc}</p>
                    </div>
                </div>

                {/* Formulir Pendaftaran */}
                {eventData.isRegistration && !isSuccess && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                        <h2 className="text-xl font-black text-slate-900 mb-6 border-b pb-4">Formulir Pendaftaran</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            {/* Render Pertanyaan Dinamis */}
                            {eventData.formFields.map((field, idx) => (
                                <div key={idx}>
                                    <label className="text-xs font-bold text-slate-700 block mb-2">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                                    {field.type === 'textarea' ? (
                                        <textarea required={field.required} onChange={(e) => handleInputChange(field.label, e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-emerald-500" rows="3"></textarea>
                                    ) : (
                                        <input type={field.type} required={field.required} onChange={(e) => handleInputChange(field.label, e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none focus:border-emerald-500" />
                                    )}
                                </div>
                            ))}

                            {/* Pembayaran */}
                            {eventData.htmPrice > 0 && (
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-8">
                                    <h3 className="text-sm font-black text-slate-800 mb-2">Pilih Metode Pembayaran</h3>
                                    <p className="text-xs text-slate-500 mb-4">Total Tagihan: <span className="font-bold text-emerald-600">Rp {eventData.htmPrice.toLocaleString('id-ID')}</span></p>
                                    
                                    <select required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-slate-200 p-3 rounded-xl text-sm mb-4 outline-none">
                                        <option value="">-- Pilih Metode --</option>
                                        {eventData.paymentMethods?.cash && <option value="cash">Bayar di Tempat (Cash)</option>}
                                        {eventData.paymentMethods?.transfer && <option value="transfer">Transfer Bank</option>}
                                        {eventData.paymentMethods?.qris && <option value="qris">QRIS</option>}
                                    </select>

                                    {paymentMethod === 'qris' && eventData.qrisId && (
                                        <div className="text-center bg-white p-4 rounded-xl border mb-4">
                                            <p className="text-xs font-bold mb-2">Scan QRIS di bawah ini:</p>
                                            {eventData.qrisId.includes('http') ? (
                                                <img src={eventData.qrisId} className="w-48 h-48 mx-auto object-contain border rounded-xl" alt="QRIS" />
                                            ) : (
                                                <p className="text-sm font-mono bg-slate-100 p-2 rounded">{eventData.qrisId}</p>
                                            )}
                                        </div>
                                    )}

                                    {(paymentMethod === 'transfer' || paymentMethod === 'qris') && (
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 block mb-2">Upload Bukti Pembayaran</label>
                                            <input type="file" required accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} className="w-full border border-slate-200 p-2 rounded-xl text-xs bg-white" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-full hover:bg-emerald-500 transition mt-6 disabled:opacity-50">
                                {isSubmitting ? 'Memproses Pendaftaran...' : 'Daftar Sekarang'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Status Sukses */}
                {isSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-3xl text-center">
                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
                        <h2 className="text-2xl font-black text-emerald-800 mb-2">Pendaftaran Berhasil!</h2>
                        <p className="text-emerald-700 text-sm">Silakan cek inbox atau folder spam email Anda untuk tiket dan konfirmasi pendaftaran.</p>
                    </div>
                )}

            </div>
        </div>
    );
}