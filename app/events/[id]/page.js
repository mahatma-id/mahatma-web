"use client";
import { useEffect, useState, use } from 'react';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { uploadToCloudinary } from '@/app/admin/utils'; 
import { generateDynamicQRIS, getQRCodeImageUrl } from '@/lib/qris';

export default function EventDetail({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Multi-Halaman Google Forms State
    const [currentStep, setCurrentStep] = useState(0);
    const [stepValidationError, setStepValidationError] = useState('');

    // State Formulir
    const [formData, setFormData] = useState({});
    const [otherData, setOtherData] = useState({}); 

    // State Tiered Pricing (Internal vs Eksternal)
    const [participantCategory, setParticipantCategory] = useState('internal'); // 'internal' | 'external'
    const [voluntaryAmount, setVoluntaryAmount] = useState('');

    // State Pembayaran
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Copy feedback state
    const [copiedNmid, setCopiedNmid] = useState(false);
    const [copiedAccount, setCopiedAccount] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const docRef = doc(db, "events", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    setEventData(data);
                }
            } catch (error) { 
                console.error("Error fetching event:", error); 
            }
            setLoading(false);
        };
        fetchEvent();
    }, [id]);

    const handleInputChange = (label, value) => {
        setFormData(prev => ({ ...prev, [label]: value }));
        setStepValidationError('');
    };

    const handleCheckboxChange = (label, option, isChecked) => {
        setFormData(prev => {
            const currentArr = prev[label] || [];
            if (isChecked) {
                return { ...prev, [label]: [...currentArr, option] };
            } else {
                return { ...prev, [label]: currentArr.filter(item => item !== option) };
            }
        });
        setStepValidationError('');
    };

    const isOtherOption = (opt) => {
        if (!opt) return false;
        const lower = opt.toLowerCase();
        return lower.includes('yang lain') || lower.includes('lainnya') || lower.includes('other');
    };

    const copyToClipboard = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'nmid') {
                setCopiedNmid(true);
                setTimeout(() => setCopiedNmid(false), 2000);
            } else if (type === 'account') {
                setCopiedAccount(true);
                setTimeout(() => setCopiedAccount(false), 2000);
            }
        } catch (err) {
            console.error('Gagal menyalin:', err);
        }
    };

    // --- HITUNG STRUKTUR HALAMAN / SECTIONS ---
    const getSections = () => {
        if (!eventData) return [];
        if (eventData.formSections && Array.isArray(eventData.formSections) && eventData.formSections.length > 0) {
            return eventData.formSections;
        }
        if (eventData.formFields && Array.isArray(eventData.formFields) && eventData.formFields.length > 0) {
            return [{
                id: 'sec_1',
                title: 'Data Pendaftaran',
                desc: 'Silakan isi formulir di bawah ini dengan lengkap.',
                fields: eventData.formFields
            }];
        }
        return [];
    };

    const sections = getSections();
    const totalSteps = sections.length > 0 ? sections.length : 1;

    // --- HITUNG BIAYA / HTM SECARA DINAMIS ---
    const calculatePricing = () => {
        if (!eventData) return { isFree: true, isVoluntary: false, amount: 0, label: 'Gratis' };

        const pricingType = eventData.pricingType || (eventData.htmPrice > 0 ? 'fixed' : 'free');

        if (pricingType === 'free') {
            return { isFree: true, isVoluntary: false, amount: 0, label: 'Gratis' };
        }

        if (pricingType === 'voluntary') {
            const vol = Number(voluntaryAmount) || 0;
            return { isFree: false, isVoluntary: true, amount: vol, label: 'Sistem Ikhlas / Sukarela' };
        }

        if (pricingType === 'fixed') {
            const price = Number(eventData.htmPrice) || 0;
            return { isFree: price === 0, isVoluntary: false, amount: price, label: `Rp ${price.toLocaleString('id-ID')}` };
        }

        if (pricingType === 'tiered') {
            const isInternal = participantCategory === 'internal';
            const tierType = isInternal ? eventData.internalPricingType : eventData.externalPricingType;
            const tierPrice = isInternal ? Number(eventData.internalPrice || 0) : Number(eventData.externalPrice || 0);

            if (tierType === 'free') {
                return { isFree: true, isVoluntary: false, amount: 0, label: 'Gratis' };
            }
            if (tierType === 'voluntary') {
                const vol = Number(voluntaryAmount) || 0;
                return { isFree: false, isVoluntary: true, amount: vol, label: 'Sistem Ikhlas / Sukarela' };
            }
            return { isFree: tierPrice === 0, isVoluntary: false, amount: tierPrice, label: `Rp ${tierPrice.toLocaleString('id-ID')}` };
        }

        return { isFree: true, isVoluntary: false, amount: 0, label: 'Gratis' };
    };

    const activePricing = calculatePricing();

    // Validasi field pada step tertentu
    const validateCurrentStep = (stepIndex) => {
        if (!sections[stepIndex]) return true;
        const currentFields = sections[stepIndex].fields || [];
        
        for (const field of currentFields) {
            if (field.required) {
                if (field.type === 'checkbox') {
                    const arr = formData[field.label] || [];
                    if (arr.length === 0) {
                        setStepValidationError(`Pertanyaan "${field.label}" wajib dipilih minimal satu jawaban.`);
                        return false;
                    }
                } else {
                    const val = formData[field.label];
                    if (!val || val.toString().trim() === '') {
                        setStepValidationError(`Pertanyaan "${field.label}" wajib diisi.`);
                        return false;
                    }
                }
            }
        }
        setStepValidationError('');
        return true;
    };

    const handleNextStep = () => {
        if (validateCurrentStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 300, behavior: 'smooth' });
        }
    };

    const handlePrevStep = () => {
        setStepValidationError('');
        setCurrentStep(prev => Math.max(0, prev - 1));
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    // Submit Formulir
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateCurrentStep(currentStep)) return;

        if (!activePricing.isFree) {
            if (!paymentMethod) {
                alert("Silakan pilih metode pembayaran terlebih dahulu!");
                return;
            }
            if ((paymentMethod === 'transfer' || paymentMethod === 'qris') && !paymentProof) {
                alert("Harap unggah bukti pembayaran / transfer sebelum menyelesaikan pendaftaran.");
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const allFields = sections.flatMap(sec => sec.fields || []);
            const processedFormData = {};

            for (const field of allFields) {
                if (field.type === 'checkbox') {
                    const arr = formData[field.label] || [];
                    const mappedArr = arr.map(item => {
                        if (isOtherOption(item) && otherData[field.label]) {
                            return `${item} (${otherData[field.label]})`; 
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

            let recipientEmail = '';
            let participantName = '';
            
            allFields.forEach(field => {
                if (field.type === 'email' && !recipientEmail) {
                    recipientEmail = processedFormData[field.label];
                }
                if (field.label.toLowerCase().includes('nama') && !participantName) {
                    participantName = processedFormData[field.label];
                }
            });

            if (!recipientEmail) {
                for (const key of Object.keys(processedFormData)) {
                    if (key.toLowerCase().includes('email') && processedFormData[key]) {
                        recipientEmail = processedFormData[key];
                        break;
                    }
                }
            }

            if (!recipientEmail) {
                throw new Error("Formulir tidak memiliki kolom Email yang valid untuk pengiriman tiket konfirmasi.");
            }

            let proofUrl = '';
            if (paymentProof) {
                proofUrl = await uploadToCloudinary(paymentProof);
            }

            const participantData = {
                ...processedFormData,
                participantCategory: eventData.pricingType === 'tiered' ? (participantCategory === 'internal' ? 'Internal' : 'Eksternal') : 'Umum',
                paidAmount: activePricing.amount,
                pricingScheme: activePricing.label,
                paymentMethod: activePricing.isFree ? 'Free' : (paymentMethod || 'Free'),
                paymentProof: proofUrl,
                paymentStatus: (!activePricing.isFree && paymentMethod !== 'cash') ? 'Menunggu Konfirmasi' : 'Lunas',
                registeredAt: serverTimestamp()
            };
            
            await addDoc(collection(db, "events", id, "participants"), participantData);

            let emailBody = eventData.emailTemplate || `Terima kasih {name} telah mendaftar di {event_name}.`;
            emailBody = emailBody.replace(/{name}/g, participantName || 'Peserta');
            emailBody = emailBody.replace(/{event_name}/g, eventData.name);
            emailBody = emailBody.replace(/{payment_status}/g, participantData.paymentStatus);
            
            const htmlEmail = emailBody.replace(/\n/g, '<br>');

            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipientEmail,
                    subject: `Pendaftaran Berhasil: ${eventData.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 25px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
                            <h2 style="color: #059669; margin-top: 0;">Pendaftaran Anda Berhasil!</h2>
                            <p style="font-size: 14px; line-height: 1.6;">${htmlEmail}</p>
                            <div style="background-color: #f8fafc; padding: 15px; border-radius: 10px; margin: 20px 0; font-size: 13px;">
                                <p style="margin: 4px 0;"><strong>Status Pembayaran:</strong> ${participantData.paymentStatus}</p>
                                <p style="margin: 4px 0;"><strong>Metode:</strong> ${participantData.paymentMethod}</p>
                                ${activePricing.amount > 0 ? `<p style="margin: 4px 0;"><strong>Nominal:</strong> Rp ${activePricing.amount.toLocaleString('id-ID')}</p>` : ''}
                            </div>
                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
                            <p style="font-size: 11px; color: #94a3b8; text-align: center;">Email ini dikirim otomatis oleh sistem resmi Mahatma Academy.</p>
                        </div>
                    `
                })
            });

            setIsSuccess(true);
            window.scrollTo({ top: 100, behavior: 'smooth' });
        } catch (error) {
            alert("Error: " + error.message);
        }
        setIsSubmitting(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-mono text-xs font-bold tracking-widest text-slate-500 uppercase animate-pulse">Memuat Formulir Event...</p>
            </div>
        );
    }

    if (!eventData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl font-bold mb-4">✕</div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Event Tidak Ditemukan</h1>
                <p className="text-sm text-slate-500 mb-6">Agenda pelatihan yang Anda cari mungkin telah ditutup atau tautan telah kedaluwarsa.</p>
                <Link href="/events" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition">
                    Kembali ke Jadwal Event
                </Link>
            </div>
        );
    }

    const currentSection = sections[currentStep] || sections[0];
    const isLastStep = currentStep === totalSteps - 1;

    // --- GENERATOR QRIS DINAMIS OTOMATIS SESUAI HARGA ---
    const qrisSource = eventData.qrisNmid || '';
    const dynamicPayload = qrisSource ? generateDynamicQRIS(qrisSource, activePricing.amount) : '';
    const dynamicQrCodeUrl = dynamicPayload ? getQRCodeImageUrl(dynamicPayload, 300) : '';

    // Template background polosan yang diupload admin
    const templateBgUrl = eventData.qrisTemplateBgUrl || eventData.qrisDynamicImgUrl;
    // Fallback QRIS statis biasa
    const staticFallbackImage = eventData.qrisStaticImgUrl || eventData.qrisId;

    return (
        <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 selection:bg-emerald-500 selection:text-white flex flex-col justify-between">
            <Navbar />
            
            <main className="flex-1 pt-32 pb-16 px-4 md:px-12">
                <div className="max-w-3xl mx-auto">
                    
                    {/* Back Link */}
                    <Link href="/events" className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-6 hover:text-emerald-800 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        <span>Kembali ke Jadwal Event</span>
                    </Link>
                
                {/* Event Card Header */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    {eventData.imgUrl && (
                        <div className="relative w-full h-52 md:h-80 bg-slate-900 overflow-hidden">
                            <img src={eventData.imgUrl} className="w-full h-full object-cover" alt="Banner Event" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </div>
                    )}
                    <div className="p-6 md:p-8">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 text-[11px] font-black uppercase rounded-full tracking-wider">
                                📅 {eventData.date}
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 text-[11px] font-black uppercase rounded-full tracking-wider">
                                {eventData.pricingType === 'tiered' 
                                    ? 'Internal & Eksternal' 
                                    : eventData.pricingType === 'voluntary' 
                                    ? 'Sistem Ikhlas' 
                                    : eventData.htmPrice > 0 
                                    ? `HTM: Rp ${eventData.htmPrice.toLocaleString('id-ID')}` 
                                    : 'Gratis'}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-2">{eventData.name}</h1>
                        <p className="text-xs md:text-sm font-bold text-slate-500 mb-5 flex items-center gap-1.5">
                            <span>📍</span>
                            <span>{eventData.location}</span>
                        </p>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-line">{eventData.desc}</p>
                    </div>
                </div>

                {/* ======================================================== */}
                {/* FORMULIR PENDAFTARAN (GOOGLE FORMS STYLE MULTI-STEP) */}
                {/* ======================================================== */}
                {eventData.isRegistration && !isSuccess && (
                    <div className="space-y-6">
                        
                        {/* Google Forms Header Card with Progress Bar */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                            
                            {/* Google Forms colored top accent strip */}
                            <div className="h-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500"></div>

                            {/* Multi-step Progress Indicator */}
                            {totalSteps > 1 && (
                                <div className="px-6 md:px-8 pt-5 pb-2 border-b border-slate-100">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                                        <span className="text-emerald-700 uppercase tracking-wider font-black">
                                            Halaman {currentStep + 1} dari {totalSteps}
                                        </span>
                                        <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% Selesai</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 transition-all duration-300 rounded-full" 
                                            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                                        ></div>
                                    </div>

                                    {/* Step Chips on Tablet/Desktop */}
                                    <div className="hidden sm:flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                                        {sections.map((sec, idx) => (
                                            <div 
                                                key={idx}
                                                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                                                    idx === currentStep 
                                                        ? 'bg-emerald-600 text-white shadow-xs' 
                                                        : idx < currentStep 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}
                                            >
                                                {idx + 1}. {sec.title.replace(/^Halaman \d+:\s*/i, '')}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section Title & Description Card */}
                            <div className="p-6 md:p-8">
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                                    {currentSection?.title || 'Formulir Pendaftaran'}
                                </h2>
                                {currentSection?.desc && (
                                    <p className="text-xs md:text-sm text-slate-500 mt-2 leading-relaxed">
                                        {currentSection.desc}
                                    </p>
                                )}
                                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-red-500 font-semibold">
                                    * Menandakan pertanyaan yang wajib diisi
                                </div>
                            </div>
                        </div>

                        {/* Error Alert if Validation Fails */}
                        {stepValidationError && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-[shake_0.3s_ease]">
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{stepValidationError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Render Questions for Current Section */}
                            <div className="space-y-4">
                                {(currentSection?.fields || []).map((field, idx) => (
                                    <div key={idx} className="bg-white p-5 md:p-6 rounded-2xl shadow-xs border border-slate-200 transition-all hover:border-slate-300">
                                        
                                        <label className="text-sm font-bold text-slate-800 block mb-3">
                                            {field.label} {field.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
                                        </label>

                                        {/* Input Teks Panjang */}
                                        {field.type === 'textarea' && (
                                            <textarea 
                                                required={field.required} 
                                                value={formData[field.label] || ''} 
                                                onChange={(e) => handleInputChange(field.label, e.target.value)} 
                                                placeholder="Jawaban Anda..."
                                                className="w-full border border-slate-300 p-3 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" 
                                                rows="3"
                                            ></textarea>
                                        )}

                                        {/* Pilihan Ganda (Radio) */}
                                        {field.type === 'radio' && (
                                            <div className="space-y-3 pl-1">
                                                {field.options?.split(',').map((opt, i) => {
                                                    const trimmedOpt = opt.trim();
                                                    const isOther = isOtherOption(trimmedOpt);
                                                    const isSelected = formData[field.label] === trimmedOpt;
                                                    return (
                                                        <div key={i} className="flex flex-col gap-2">
                                                            <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer w-fit group">
                                                                <input 
                                                                    type="radio" 
                                                                    name={field.label} 
                                                                    value={trimmedOpt} 
                                                                    checked={isSelected}
                                                                    required={field.required && !formData[field.label]} 
                                                                    onChange={(e) => handleInputChange(field.label, e.target.value)} 
                                                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                                                                />
                                                                <span className="group-hover:text-emerald-700 transition-colors font-medium">{trimmedOpt}</span>
                                                            </label>
                                                            {isOther && isSelected && (
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Ketik jawaban Anda di sini..." 
                                                                    required={field.required} 
                                                                    value={otherData[field.label] || ''} 
                                                                    onChange={(e) => setOtherData({...otherData, [field.label]: e.target.value})} 
                                                                    className="ml-7 w-full md:w-3/4 border border-slate-300 p-2 rounded-lg text-sm outline-none focus:border-emerald-500" 
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Kotak Centang (Checkbox) */}
                                        {field.type === 'checkbox' && (
                                            <div className="space-y-3 pl-1">
                                                {field.options?.split(',').map((opt, i) => {
                                                    const trimmedOpt = opt.trim();
                                                    const isOther = isOtherOption(trimmedOpt);
                                                    const isSelected = (formData[field.label] || []).includes(trimmedOpt);
                                                    return (
                                                        <div key={i} className="flex flex-col gap-2">
                                                            <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer w-fit group">
                                                                <input 
                                                                    type="checkbox" 
                                                                    value={trimmedOpt} 
                                                                    checked={isSelected}
                                                                    onChange={(e) => handleCheckboxChange(field.label, trimmedOpt, e.target.checked)} 
                                                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer" 
                                                                />
                                                                <span className="group-hover:text-emerald-700 transition-colors font-medium">{trimmedOpt}</span>
                                                            </label>
                                                            {isOther && isSelected && (
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Ketik jawaban Anda di sini..." 
                                                                    required={field.required} 
                                                                    value={otherData[field.label] || ''} 
                                                                    onChange={(e) => setOtherData({...otherData, [field.label]: e.target.value})} 
                                                                    className="ml-7 w-full md:w-3/4 border border-slate-300 p-2 rounded-lg text-sm outline-none focus:border-emerald-500" 
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Skala Linier (1 - 5) */}
                                        {field.type === 'scale' && (
                                            <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200 mt-2">
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-3 px-1">
                                                    <span className="text-left w-1/3">{field.scaleMinLabel || 'Sangat Kurang'}</span>
                                                    <span className="text-right w-1/3">{field.scaleMaxLabel || 'Sangat Baik'}</span>
                                                </div>
                                                <div className="flex justify-between items-center px-2 md:px-8">
                                                    {[1, 2, 3, 4, 5].map(val => (
                                                        <label key={val} className="flex flex-col items-center gap-2 cursor-pointer group">
                                                            <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-600 transition">{val}</span>
                                                            <input 
                                                                type="radio" 
                                                                name={field.label} 
                                                                value={val} 
                                                                checked={formData[field.label] === String(val)}
                                                                required={field.required} 
                                                                onChange={(e) => handleInputChange(field.label, e.target.value)} 
                                                                className="w-5 h-5 text-emerald-600 cursor-pointer focus:ring-emerald-500" 
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Standar Text, Number, Email */}
                                        {(field.type === 'text' || field.type === 'number' || field.type === 'email') && (
                                            <input 
                                                type={field.type} 
                                                required={field.required} 
                                                value={formData[field.label] || ''} 
                                                placeholder="Jawaban Anda..."
                                                onChange={(e) => handleInputChange(field.label, e.target.value)} 
                                                className="w-full border border-slate-300 p-3 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition" 
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* ======================================================== */}
                            {/* STEP TERAKHIR: PEMILIHAN KATEGORI TIKET & PEMBAYARAN */}
                            {/* ======================================================== */}
                            {isLastStep && (
                                <div className="space-y-6 pt-2">
                                    
                                    {/* Pilihan Kategori Internal vs Eksternal jika Tiered */}
                                    {eventData.pricingType === 'tiered' && (
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Pilih Kategori Kepesertaan <span className="text-red-500">*</span></h3>
                                            <p className="text-xs text-slate-500">Tentukan status kepesertaan Anda untuk penyesuaian biaya HTM.</p>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Card Internal */}
                                                <div 
                                                    onClick={() => setParticipantCategory('internal')}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${participantCategory === 'internal' ? 'bg-emerald-50 border-emerald-600 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-black text-slate-800">
                                                            {eventData.internalLabel || 'Peserta Internal'}
                                                        </span>
                                                        <input type="radio" checked={participantCategory === 'internal'} onChange={() => setParticipantCategory('internal')} className="text-emerald-600" />
                                                    </div>
                                                    <p className="text-xs font-bold text-emerald-700">
                                                        {eventData.internalPricingType === 'free' 
                                                            ? 'Gratis (Free)' 
                                                            : eventData.internalPricingType === 'voluntary' 
                                                            ? 'Sistem Ikhlas (Donasi)' 
                                                            : `Rp ${(eventData.internalPrice || 0).toLocaleString('id-ID')}`}
                                                    </p>
                                                </div>

                                                {/* Card Eksternal */}
                                                <div 
                                                    onClick={() => setParticipantCategory('external')}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${participantCategory === 'external' ? 'bg-emerald-50 border-emerald-600 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-black text-slate-800">
                                                            {eventData.externalLabel || 'Peserta Eksternal (Umum)'}
                                                        </span>
                                                        <input type="radio" checked={participantCategory === 'external'} onChange={() => setParticipantCategory('external')} className="text-emerald-600" />
                                                    </div>
                                                    <p className="text-xs font-bold text-blue-700">
                                                        {eventData.externalPricingType === 'free' 
                                                            ? 'Gratis (Free)' 
                                                            : eventData.externalPricingType === 'voluntary' 
                                                            ? 'Sistem Ikhlas (Donasi)' 
                                                            : `Rp ${(eventData.externalPrice || 0).toLocaleString('id-ID')}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Input Nominal Sukarela jika Sistem Ikhlas */}
                                    {activePricing.isVoluntary && (
                                        <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">🤝</span>
                                                <h4 className="text-sm font-black text-emerald-950">Event Ini Menggunakan Sistem Bayar Seikhlasnya</h4>
                                            </div>
                                            <p className="text-xs text-emerald-800 leading-relaxed">
                                                Anda dapat menentukan nominal donasi / kontribusi pendaftaran secara sukarela tanpa batasan minimal tertentu.
                                            </p>
                                            <div className="pt-2">
                                                <label className="text-xs font-bold text-slate-700 block mb-1">Nominal Kontribusi Anda (Rp)</label>
                                                <div className="relative max-w-sm">
                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">Rp</span>
                                                    <input 
                                                        type="number" 
                                                        value={voluntaryAmount} 
                                                        onChange={e => setVoluntaryAmount(e.target.value)} 
                                                        placeholder="Contoh: 25000 (Bebas / Seikhlasnya)" 
                                                        className="w-full bg-white border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl font-bold text-sm outline-none focus:border-emerald-500" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Panel Pembayaran & Upload Bukti jika Berbayar / Sukarela */}
                                    {!activePricing.isFree && (
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                                            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-900 uppercase">Metode Pembayaran</h3>
                                                    <p className="text-xs text-slate-500">Pilih salah satu metode pembayaran yang tersedia.</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tagihan</span>
                                                    <span className="text-base font-black text-emerald-600 bg-emerald-50 px-3 py-0.5 rounded-lg border border-emerald-200">
                                                        {activePricing.isVoluntary 
                                                            ? (activePricing.amount > 0 ? `Rp ${activePricing.amount.toLocaleString('id-ID')}` : 'Seikhlasnya') 
                                                            : `Rp ${activePricing.amount.toLocaleString('id-ID')}`}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Pilihan Metode */}
                                            <select 
                                                required 
                                                value={paymentMethod} 
                                                onChange={(e) => setPaymentMethod(e.target.value)} 
                                                className="w-full border border-slate-300 p-3 rounded-xl text-sm outline-none focus:border-emerald-500 bg-slate-50 cursor-pointer font-bold text-slate-800"
                                            >
                                                <option value="">-- Silakan Pilih Metode Bayar --</option>
                                                {eventData.paymentMethods?.cash && <option value="cash">💵 Bayar di Tempat (Cash on Location)</option>}
                                                {eventData.paymentMethods?.transfer && <option value="transfer">🏦 Transfer Bank</option>}
                                                {eventData.paymentMethods?.qris && <option value="qris">📱 QRIS Dinamis (E-Wallet: GoPay, OVO, Dana, ShopeePay & M-Banking)</option>}
                                            </select>

                                            {/* Tampilan Detail Transfer Bank */}
                                            {paymentMethod === 'transfer' && (
                                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                                                    <p className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">Instruksi Transfer Bank:</p>
                                                    <div className="space-y-2 text-xs">
                                                        <div className="flex justify-between items-center"><span className="text-slate-500">Bank:</span> <span className="font-bold text-slate-800">{eventData.bankName || '-'}</span></div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-500">No. Rekening:</span> 
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-black text-emerald-700 text-sm md:text-base">{eventData.bankAccount || '-'}</span>
                                                                {eventData.bankAccount && (
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => copyToClipboard(eventData.bankAccount, 'account')}
                                                                        className="px-2 py-1 bg-white hover:bg-slate-200 border rounded text-[10px] font-bold text-slate-600 transition"
                                                                    >
                                                                        {copiedAccount ? '✓ Tersalin' : 'Salin'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center"><span className="text-slate-500">Atas Nama:</span> <span className="font-bold text-slate-800">{eventData.bankAccountName || '-'}</span></div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ======================================================== */}
                                            {/* TAMPILAN QRIS DINAMIS & BACKGROUND POLOSAN DENGAN QR DI TENGAH */}
                                            {/* ======================================================== */}
                                            {paymentMethod === 'qris' && (
                                                <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border-2 border-emerald-300 text-center space-y-4">
                                                    <div>
                                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                                                            {activePricing.amount > 0 ? 'QRIS Dinamis Otomatis' : 'QRIS Statis'}
                                                        </span>
                                                        <h5 className="font-black text-base text-slate-900 mt-2">Scan QRIS Pembayaran</h5>
                                                        
                                                        {activePricing.amount > 0 ? (
                                                            <div className="mt-1.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200 max-w-md mx-auto">
                                                                <p className="text-xs font-bold text-emerald-800">
                                                                    ✓ QR Code di bawah telah otomatis terisi nominal sebesar: <span className="text-emerald-950 font-black underline">Rp {activePricing.amount.toLocaleString('id-ID')}</span>
                                                                </p>
                                                                <p className="text-[11px] text-emerald-700 mt-0.5">
                                                                    Buka M-Banking atau E-Wallet (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana), scan kode di bawah, dan nominal otomatis muncul!
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                Scan QRIS di bawah ini, lalu masukkan nominal pembayaran sesuai keikhlasan Anda.
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* KONTEN GAMBAR: BACKGROUND POLOSAN DENGAN QR CODE BERADA DI TENGAH */}
                                                    {templateBgUrl ? (
                                                        <div className="relative w-72 md:w-80 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-xl bg-white">
                                                            {/* Background Polosan Template */}
                                                            <img 
                                                                src={templateBgUrl} 
                                                                alt="Template QRIS Polosan" 
                                                                className="w-full h-auto block select-none" 
                                                            />
                                                            
                                                            {/* QR Code Dinamis Otomatis Tepat di Posisi Tengah (Center Overlay) */}
                                                            <div className="absolute inset-0 flex items-center justify-center p-6">
                                                                <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-200">
                                                                    <img 
                                                                        src={dynamicQrCodeUrl || staticFallbackImage} 
                                                                        alt="QR Code Dinamis" 
                                                                        className="w-36 h-36 md:w-44 md:h-44 object-contain block" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-block p-4 bg-white rounded-2xl border-2 border-emerald-400 shadow-xl">
                                                            <img 
                                                                src={dynamicQrCodeUrl || staticFallbackImage} 
                                                                className="w-52 h-52 md:w-60 md:h-60 mx-auto object-contain rounded-xl block" 
                                                                alt="QR Code Pembayaran" 
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Tombol Unduh / Buka QR Code untuk Kemudahan Scan dari Galeri HP */}
                                                    <div className="flex items-center justify-center gap-2 pt-1">
                                                        <a 
                                                            href={dynamicQrCodeUrl || staticFallbackImage} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            download="QRIS-Pembayaran.png"
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition shadow-xs"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                                            <span>Buka / Unduh QR Code</span>
                                                        </a>
                                                    </div>

                                                    {/* Kotak NMID dan Tombol Salin */}
                                                    {eventData.qrisNmid && (
                                                        <div className="max-w-sm mx-auto bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                                                            <div className="text-left min-w-0">
                                                                <span className="text-[9px] font-black uppercase text-slate-400 block leading-none">NMID Merchant</span>
                                                                <span className="font-mono font-bold text-xs text-slate-800 tracking-wider truncate block mt-0.5">{eventData.qrisNmid}</span>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => copyToClipboard(eventData.qrisNmid, 'nmid')}
                                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                                                            >
                                                                {copiedNmid ? (
                                                                    <span>✓ Tersalin</span>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                                                                        <span>Salin NMID</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Upload Bukti Pembayaran */}
                                            {(paymentMethod === 'transfer' || paymentMethod === 'qris') && (
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                                                    <label className="text-xs font-bold text-slate-800 block">
                                                        Upload Bukti Transfer / Scan QRIS <span className="text-red-500">*</span>
                                                    </label>
                                                    <input 
                                                        type="file" 
                                                        required 
                                                        accept="image/*" 
                                                        onChange={(e) => setPaymentProof(e.target.files[0])} 
                                                        className="w-full border border-slate-300 p-2.5 rounded-xl text-xs bg-white cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
                                                    />
                                                    {paymentProof && (
                                                        <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ File dipilih: {paymentProof.name}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            )}

                            {/* ======================================================== */}
                            {/* BOTTOM NAVIGATION (KEMBALI, BERIKUTNYA, SUBMIT) */}
                            {/* ======================================================== */}
                            <div className="pt-4 flex items-center justify-between gap-4 border-t border-slate-200">
                                
                                {currentStep > 0 ? (
                                    <button 
                                        type="button" 
                                        onClick={handlePrevStep}
                                        className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-300 transition cursor-pointer flex items-center gap-2 shadow-xs"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                                        <span>Kembali</span>
                                    </button>
                                ) : (
                                    <div></div>
                                )}

                                {!isLastStep ? (
                                    <button 
                                        type="button" 
                                        onClick={handleNextStep}
                                        className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-900/20"
                                    >
                                        <span>Berikutnya</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                                    </button>
                                ) : (
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting} 
                                        className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Memproses Pendaftaran...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Selesaikan Pendaftaran</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* Status Pendaftaran Sukses */}
                {isSuccess && (
                    <div className="bg-white border border-emerald-200 p-8 md:p-12 rounded-3xl text-center shadow-lg">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 shadow-inner">
                            ✓
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Pendaftaran Anda Berhasil!</h2>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed max-w-lg mx-auto mb-6">
                            Terima kasih telah mendaftar di event <b>{eventData.name}</b>. Kami telah mengirimkan detail pendaftaran ke email Anda. Silakan periksa inbox atau folder spam Anda.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Link href="/events" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs uppercase tracking-wider">
                                Lihat Event Lainnya
                            </Link>
                            <Link href="/" className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition uppercase tracking-wider">
                                Ke Beranda
                            </Link>
                        </div>
                    </div>
                )}

                </div>
            </main>
            <Footer />
        </div>
    );
}
