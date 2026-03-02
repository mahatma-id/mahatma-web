"use client";
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, onSnapshot, updateDoc, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PortalClient() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState('client'); // 'client' atau 'admin'
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});

  // State Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State Login Session & Data Dokumen (Khusus Klien)
  const [loggedInClient, setLoggedInClient] = useState(null);
  const [docMasters, setDocMasters] = useState([]);
  const [clientDocs, setClientDocs] = useState([]);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
        if(snap.exists()) setSettings(snap.data());
    });
    
    // Cek apakah sudah login klien
    const storedClient = localStorage.getItem('mase_client');
    if (storedClient) {
        setLoggedInClient(JSON.parse(storedClient));
    }

    return () => unsubSettings();
  }, []);

  useEffect(() => {
      if (loggedInClient) {
          const unsubMasters = onSnapshot(query(collection(db, "doc_masters"), orderBy("createdAt", "asc")), snap => {
              setDocMasters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });

          const unsubClientDocs = onSnapshot(query(collection(db, "client_docs"), where("clientId", "==", loggedInClient.id)), snap => {
              setClientDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });

          return () => { unsubMasters(); unsubClientDocs(); }
      }
  }, [loggedInClient]);

  // Fungsi Upload ke Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'mahatma_upload'); 
    const cloudName = 'dgexjl9sf'; 

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || "Gagal upload file");
  };

  const handleFileUpload = async (e, masterId) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
          alert("Ukuran file terlalu besar! Maksimal 5MB.");
          e.target.value = null;
          return;
      }

      setUploadingDocId(masterId);
      try {
          const fileUrl = await uploadToCloudinary(file);
          const existingDoc = clientDocs.find(d => d.masterId === masterId);
          
          if (existingDoc) {
              await updateDoc(doc(db, "client_docs", existingDoc.id), {
                  fileUrl: fileUrl,
                  status: 'pending',
                  updatedAt: serverTimestamp()
              });
          } else {
              await addDoc(collection(db, "client_docs"), {
                  clientId: loggedInClient.id,
                  masterId: masterId,
                  fileUrl: fileUrl,
                  status: 'pending', 
                  adminComment: '',
                  createdAt: serverTimestamp()
              });
          }
          alert("Dokumen berhasil diunggah dan sedang menuggu peninjauan!");
      } catch (err) {
          alert("Gagal mengunggah dokumen: " + err.message);
      }
      setUploadingDocId(null);
      e.target.value = null;
  };

  // --- FUNGSI LOGIN (KLIEN ATAU ADMIN) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (loginMode === 'admin') {
        // --- LOGIN ADMIN VIA FIREBASE AUTH ---
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/admin'); // Jika sukses, lempar ke halaman admin
        } catch (err) {
            alert("Login Admin Gagal! Email atau Password salah.");
        }
    } else {
        // --- LOGIN KLIEN VIA KOLEKSI FIRESTORE ---
        try {
            const q = query(collection(db, "clients"), where("email", "==", email), where("password", "==", password));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                alert("Email atau Password salah!");
            } else {
                const clientData = querySnapshot.docs[0].data();
                const clientId = querySnapshot.docs[0].id;
                
                // Login Berhasil (Semua klien buatan admin pasti berstatus approved)
                const sessionData = { id: clientId, ...clientData };
                localStorage.setItem('mase_client', JSON.stringify(sessionData));
                setLoggedInClient(sessionData);
            }
        } catch (err) {
            alert("Terjadi kesalahan: " + err.message);
        }
    }
    setLoading(false);
  };

  const handleLogout = () => {
      localStorage.removeItem('mase_client');
      setLoggedInClient(null);
      setEmail('');
      setPassword('');
  };

  // --- TAMPILAN DASHBOARD KLIEN ---
  if (loggedInClient) {
      const totalDocs = docMasters.length;
      const approvedDocs = clientDocs.filter(d => d.status === 'approved').length;
      const progressPercentage = totalDocs === 0 ? 0 : Math.round((approvedDocs / totalDocs) * 100);

      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 md:py-10 px-4 transition-colors">
              <div className="w-full max-w-5xl bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-100">
                  
                  <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 pb-6 border-b border-slate-100 gap-4">
                      <div>
                          <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-1">Dashboard Klien ISO</p>
                          <h1 className="text-2xl md:text-3xl font-black text-slate-900">{loggedInClient.lembagaName}</h1>
                          <p className="text-sm text-emerald-600 font-bold mt-1">PIC: {loggedInClient.picName}</p>
                      </div>
                      <button onClick={handleLogout} className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-600 hover:text-white transition w-full md:w-auto">
                          Keluar / Logout
                      </button>
                  </div>
                  
                  <div className="mb-10 bg-slate-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
                      <h3 className="font-bold mb-2 relative z-10">Progress Kesiapan Audit</h3>
                      <div className="w-full bg-slate-800 rounded-full h-4 mb-2 relative z-10 overflow-hidden">
                          <div className="bg-emerald-500 h-4 rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                      <p className="text-xs text-slate-400 relative z-10">{approvedDocs} dari {totalDocs} Dokumen Disetujui ({progressPercentage}%)</p>
                  </div>

                  <div className="mb-4">
                      <h2 className="text-lg font-black text-slate-800 mb-2">Persyaratan Dokumen</h2>
                      <p className="text-xs text-slate-500 mb-6">Silakan unggah dokumen persyaratan di bawah ini. Dokumen akan diperiksa oleh tim Admin.</p>
                      
                      <div className="grid grid-cols-1 gap-4">
                          {docMasters.length === 0 ? (
                              <div className="text-center py-10 bg-slate-50 rounded-xl text-slate-400 text-sm">Admin belum menetapkan syarat dokumen.</div>
                          ) : docMasters.map((master, idx) => {
                              const uploadedDoc = clientDocs.find(d => d.masterId === master.id);
                              
                              let statusBadge = <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-widest">Belum Upload</span>;
                              if (uploadedDoc) {
                                  if (uploadedDoc.status === 'pending') statusBadge = <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">Menunggu Review Admin</span>;
                                  if (uploadedDoc.status === 'approved') statusBadge = <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Disetujui (ACC)</span>;
                                  if (uploadedDoc.status === 'revision') statusBadge = <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Perlu Revisi</span>;
                              }

                              return (
                                  <div key={master.id} className={`p-5 rounded-2xl border ${uploadedDoc?.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' : uploadedDoc?.status === 'revision' ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'} shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all`}>
                                      
                                      <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                              <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                                              <h3 className="font-bold text-slate-800">{master.name}</h3>
                                          </div>
                                          <p className="text-xs text-slate-500 ml-9 mb-3">{master.desc}</p>
                                          
                                          <div className="ml-9 flex flex-col items-start gap-2">
                                              {statusBadge}
                                              {uploadedDoc?.status === 'revision' && uploadedDoc?.adminComment && (
                                                  <div className="mt-2 p-3 bg-red-100/50 border border-red-200 rounded-lg text-xs text-red-800">
                                                      <strong>Komentar Admin:</strong> {uploadedDoc.adminComment}
                                                  </div>
                                              )}
                                              {uploadedDoc && (
                                                  <a href={uploadedDoc.fileUrl} target="_blank" className="text-[10px] text-indigo-600 font-bold hover:underline mt-1">
                                                      Lihat File Terunggah ↗
                                                  </a>
                                              )}
                                          </div>
                                      </div>

                                      <div className="md:w-64 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4">
                                          {uploadedDoc?.status !== 'approved' ? (
                                              <div className="relative">
                                                  <input 
                                                      type="file" 
                                                      accept=".pdf,image/*"
                                                      onChange={(e) => handleFileUpload(e, master.id)}
                                                      disabled={uploadingDocId === master.id}
                                                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer disabled:opacity-50"
                                                  />
                                                  {uploadingDocId === master.id && <p className="text-[10px] text-orange-600 font-bold mt-2 animate-pulse">Mengunggah...</p>}
                                              </div>
                                          ) : (
                                              <div className="flex items-center gap-2 text-emerald-600 justify-center h-full">
                                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                  <span className="text-xs font-bold uppercase tracking-widest">Selesai</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                  </div>

              </div>
          </div>
      );
  }

  // --- TAMPILAN FORM LOGIN (KLIEN / ADMIN) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl relative z-10 overflow-hidden">
        {/* Header Form */}
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100 relative">
            <Link href="/" className="absolute top-6 left-6 text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </Link>
            {settings.logoUrl ? (
                <img src={settings.logoUrl} className="h-10 mx-auto object-contain mb-4" alt="Logo" />
            ) : (
                <h2 className="text-xl font-black text-emerald-600 mb-4">MASE</h2>
            )}
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Portal ISO</h1>
            <p className="text-xs text-slate-500 mt-2">Sistem Verifikasi & Audit Dokumen</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-100 bg-slate-50">
            <button onClick={() => setLoginMode('client')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${loginMode === 'client' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:bg-slate-100'}`}>Login Klien</button>
            <button onClick={() => setLoginMode('admin')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${loginMode === 'admin' ? 'bg-white text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:bg-slate-100'}`}>Login Admin</button>
        </div>

        <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Email</label>
                    <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e=>setEmail(e.target.value)} 
                        className={`w-full border-2 border-slate-100 p-3 rounded-xl outline-none text-sm transition-colors ${loginMode === 'admin' ? 'focus:border-orange-500' : 'focus:border-emerald-500'}`} 
                        placeholder={loginMode === 'admin' ? "email.admin@mase.com" : "email.klien@lembaga.com"} 
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Password</label>
                    <input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={e=>setPassword(e.target.value)} 
                        className={`w-full border-2 border-slate-100 p-3 rounded-xl outline-none text-sm transition-colors ${loginMode === 'admin' ? 'focus:border-orange-500' : 'focus:border-emerald-500'}`} 
                        placeholder="••••••••" 
                    />
                </div>
                <button disabled={loading} className={`w-full text-white font-bold tracking-widest uppercase text-xs py-4 rounded-xl transition shadow-lg mt-4 ${loginMode === 'admin' ? 'bg-slate-900 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                    {loading ? 'Memproses...' : (loginMode === 'admin' ? 'Masuk Panel Admin' : 'Masuk Portal Klien')}
                </button>
                {loginMode === 'client' && (
                    <p className="text-[9px] text-slate-400 text-center leading-relaxed mt-4">
                        Hanya klien yang telah didaftarkan oleh Admin yang dapat masuk ke dalam Portal ini.
                    </p>
                )}
            </form>
        </div>
      </div>
    </div>
  );
}