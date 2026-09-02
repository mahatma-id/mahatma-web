"use client";
import { useEffect, useState, use } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { uploadToCloudinary } from '@/app/admin/utils'; 

export default function EventDetail({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // State Formulir
    const [formData, setFormData] = useState({});
    const [otherData, setOtherData] = useState({}); // State khusus untuk menyimpan isian teks "Yang lain"
    
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

    // Fungsi khusus menangani input Checkbox (Multiple Choice)
    const handleCheckboxChange = (label, option, isChecked) => {
        setFormData(prev => {
            const currentArr = prev[label] || [];
            if (isChecked) {
                return { ...prev, [label]: [...currentArr, option] };
            } else {
                return { ...prev, [label]: currentArr.filter(item => item !== option) };
            }
        });
    };

    // Fungsi cerdas untuk mengecek apakah opsi tersebut adalah "Yang lain"
    const isOtherOption = (opt) => {
        if (!opt) return false;
        const lower = opt.toLowerCase();
        return lower.includes('yang lain') || lower.includes('lainnya') || lower.includes('other');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Memproses data formulir (merubah Array checkbox jadi String & menyisipkan jawaban "Yang lain")
            const processedFormData = {};
            for (const field of eventData.formFields) {
                if (field.type === 'checkbox') {
                    const arr = formData[field.label] || [];
                    if (field.required && arr.length === 0) {
                        alert(`Pertanyaan "${field.label}" wajib dipilih minimal satu!`);
                        setIsSubmitting(false);
                        return;
                    }
                    const mappedArr = arr.map(item => {
                        if (isOtherOption(item) && otherData[field.label]) {
                            return `${item} (${otherData[field.label]})`; // Format: Yang lain: ... (Jawaban User)
                        }
                        return item;
                    });
                    processedFormData[field.label] = mappedArr.join(', ');
                } else if (field.type === 'radio') {
                    let val = formData[field.label] || '';
                    if (isOtherOption(val) && otherData[field.label]) {
                        val = `${val} (${otherData[field.label]})`;
                    }
                    processedFormData[field.label] = val;
                } else {
                    processedFormData[field.label] = formData[field.label] || '';
                }
            }

            // 1. Cari field email untuk tujuan pengiriman
            let recipientEmail = '';
            let participantName = '';
            
            eventData.formFields.forEach(field => {
                if (field.type === 'email') recipientEmail = processedFormData[field.label];
                if (field.label.toLowerCase().includes('nama')) participantName = processedFormData[field.label];
            });

            if (!recipientEmail) throw new Error("Formulir tidak memiliki field Email untuk pengiriman tiket!");

            // 2. Upload Bukti Bayar (Jika Ada)
            let proofUrl = '';
            if (paymentProof) {
                proofUrl = await uploadToCloudinary(paymentProof);
            }

            // 3. Simpan Data ke Firestore
            const participantData = {
                ...processedFormData,
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
            
            const htmlEmail = emailBody.replace(/\n/g, '<br>');

            // 5. Kirim Request Email
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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold tracking-widest text-slate-400">MEMUAT EVENT...</p></div>;
    if (!eventData) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl font-bold">Event Tidak Ditemukan</h1></div>;

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-12">
            <div className="max-w-3xl mx-auto">
                <Link href="/events" className="text-emerald-600 font-bold text-xs uppercase tracking-widest mb-6 inline-block hover:underline">&larr; Kembali ke Jadwal</Link>
                
                {/* Info Event */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                    {eventData.imgUrl && <img src={eventData.imgUrl} className="w-full h-48 md:h-72 object-cover" alt="Banner" />}
                    <div className="p-6 md:p-8">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-widest">{eventData.date}</span>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-4 mb-2">{eventData.name}</h1>
                        <p className="text-sm font-bold text-slate-500 mb-6">📍 {eventData.location}</p>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{eventData.desc}</p>
                    </div>
                </div>

                {/* Formulir Pendaftaran */}
                {eventData.isRegistration && !isSuccess && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Formulir Pendaftaran</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Render Pertanyaan Dinamis */}
                            {eventData.formFields.map((field, idx) => (
                                <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                    <label className="text-sm font-bold text-slate-800 block mb-3">
                                        {field.label} {field.required && <span className="text-red-500 ml-1" title="Wajib diisi">*</span>}
                                    </label>
                                    
                                    {/* Render Teks Panjang */}
                                    {field.type === 'textarea' && (
                                        <textarea required={field.required} onChange={(e) => handleInputChange(field.label, e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" rows="3"></textarea>
                                    )}

                                    {/* Render Radio Button */}
                                    {field.type === 'radio' && (
                                        <div className="space-y-3 pl-1">
                                            {field.options?.split(',').map((opt, i) => {
                                                const trimmedOpt = opt.trim();
                                                const isOther = isOtherOption(trimmedOpt);
                                                const isSelected = formData[field.label] === trimmedOpt;
                                                return (
                                                    <div key={i} className="flex flex-col gap-2">
                                                        <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer w-fit">
                                                            <input type="radio" name={field.label} value={trimmedOpt} required={field.required && !formData[field.label]} onChange={(e) => handleInputChange(field.label, e.target.value)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                                            {trimmedOpt}
                                                        </label>
                                                        {isOther && isSelected && (
                                                            <input type="text" placeholder="Sebutkan..." required={field.required} value={otherData[field.label] || ''} onChange={(e) => setOtherData({...otherData, [field.label]: e.target.value})} className="ml-7 w-full md:w-2/3 border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Render Checkbox */}
                                    {field.type === 'checkbox' && (
                                        <div className="space-y-3 pl-1">
                                            {field.options?.split(',').map((opt, i) => {
                                                const trimmedOpt = opt.trim();
                                                const isOther = isOtherOption(trimmedOpt);
                                                const isSelected = (formData[field.label] || []).includes(trimmedOpt);
                                                return (
                                                    <div key={i} className="flex flex-col gap-2">
                                                        <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer w-fit">
                                                            <input type="checkbox" value={trimmedOpt} onChange={(e) => handleCheckboxChange(field.label, trimmedOpt, e.target.checked)} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer" />
                                                            {trimmedOpt}
                                                        </label>
                                                        {isOther && isSelected && (
                                                            <input type="text" placeholder="Sebutkan..." required={field.required} value={otherData[field.label] || ''} onChange={(e) => setOtherData({...otherData, [field.label]: e.target.value})} className="ml-7 w-full md:w-2/3 border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Render Skala Linier */}
                                    {field.type === 'scale' && (
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
                                            <span className="text-xs md:text-sm font-bold text-slate-500 text-center md:text-left">{field.scaleMinLabel || 'Belum Pernah'}</span>
                                            <div className="flex gap-4 md:gap-8">
                                                {[1, 2, 3, 4, 5].map(val => (
                                                    <label key={val} className="flex flex-col items-center gap-2 cursor-pointer">
                                                        <span className="text-xs font-bold text-slate-400">{val}</span>
                                                        <input type="radio" name={field.label} value={val} required={field.required} onChange={(e) => handleInputChange(field.label, e.target.value)} className="w-5 h-5 text-emerald-600 cursor-pointer" />
                                                    </label>
                                                ))}
                                            </div>
                                            <span className="text-xs md:text-sm font-bold text-slate-500 text-center md:text-right">{field.scaleMaxLabel || 'Sering Sekali'}</span>
                                        </div>
                                    )}

                                    {/* Render Input Standar (Text, Number, Email) */}
                                    {(field.type === 'text' || field.type === 'number' || field.type === 'email') && (
                                        <input type={field.type} required={field.required} onChange={(e) => handleInputChange(field.label, e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" />
                                    )}
                                </div>
                            ))}

                            {/* Pembayaran HTM */}
                            {eventData.htmPrice > 0 && (
                                <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-200 mt-8">
                                    <h3 className="text-sm font-black text-slate-800 mb-1">Pilih Metode Pembayaran</h3>
                                    <p className="text-xs font-medium text-slate-500 mb-5">Total Tagihan Anda: <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded text-sm ml-1">Rp {eventData.htmPrice.toLocaleString('id-ID')}</span></p>
                                    
                                    <select required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl text-sm mb-5 outline-none focus:border-emerald-500 bg-white cursor-pointer">
                                        <option value="">-- Silakan Pilih Metode Bayar --</option>
                                        {eventData.paymentMethods?.cash && <option value="cash">Bayar di Tempat (Cash)</option>}
                                        {eventData.paymentMethods?.transfer && <option value="transfer">Transfer Bank</option>}
                                        {eventData.paymentMethods?.qris && <option value="qris">QRIS (E-Wallet/M-Banking)</option>}
                                    </select>

                                    {/* Tampilan Detail Transfer Bank */}
                                    {paymentMethod === 'transfer' && (
                                        <div className="bg-white p-5 rounded-xl border border-blue-100 mb-5 shadow-sm text-sm">
                                            <p className="font-bold text-slate-800 mb-3 border-b pb-2">Silakan transfer ke rekening berikut:</p>
                                            <div className="space-y-2 text-slate-600">
                                                <div className="flex justify-between items-center"><span className="text-xs">Bank:</span> <span className="font-bold">{eventData.bankName || '-'}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-xs">No. Rekening:</span> <span className="font-mono font-black text-emerald-700 text-lg">{eventData.bankAccount || '-'}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-xs">Atas Nama:</span> <span className="font-bold">{eventData.bankAccountName || '-'}</span></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tampilan Detail QRIS */}
                                    {paymentMethod === 'qris' && eventData.qrisId && (
                                        <div className="bg-white p-5 rounded-xl border border-blue-100 mb-5 shadow-sm text-center">
                                            <p className="font-bold text-slate-800 mb-3 border-b pb-2">Scan QRIS di bawah ini:</p>
                                            {eventData.qrisId.includes('http') ? (
                                                <img src={eventData.qrisId} className="w-48 h-48 mx-auto object-contain border border-slate-100 rounded-xl mb-3 shadow-sm" alt="QRIS" />
                                            ) : (
                                                <p className="text-sm font-mono bg-slate-100 p-2 rounded mb-3 break-all">{eventData.qrisId}</p>
                                            )}
                                            {eventData.qrisNmid && (
                                                <div className="inline-block bg-blue-50 text-blue-800 text-xs font-bold px-4 py-2 rounded-lg border border-blue-200">
                                                    NMID: <span className="font-mono tracking-widest">{eventData.qrisNmid}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Input Bukti Transfer/QRIS */}
                                    {(paymentMethod === 'transfer' || paymentMethod === 'qris') && (
                                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                                            <label className="text-xs font-bold text-slate-700 block mb-2">Upload Bukti Pembayaran <span className="text-red-500">*</span></label>
                                            <input type="file" required accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} className="w-full border border-slate-200 p-2 rounded-lg text-xs bg-slate-50 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-full hover:bg-emerald-500 transition mt-6 disabled:opacity-50 shadow-lg hover:-translate-y-1">
                                {isSubmitting ? 'Memproses Pendaftaran...' : 'Selesaikan Pendaftaran'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Status Sukses */}
                {isSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-3xl text-center shadow-sm">
                        <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-lg">✓</div>
                        <h2 className="text-3xl font-black text-emerald-800 mb-3">Pendaftaran Berhasil!</h2>
                        <p className="text-emerald-700 text-sm leading-relaxed max-w-md mx-auto">
                            Terima kasih telah mendaftar. Silakan cek inbox atau folder spam pada email Anda untuk melihat tiket dan detail acara.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}