"use client";
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, serverTimestamp, doc, onSnapshot, updateDoc, orderBy, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PortalClient() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState('client'); 
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});

  // State Form Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State Data
  const [loggedInClient, setLoggedInClient] = useState(null);
  const [isoTypes, setIsoTypes] = useState([]);
  const [isoFolders, setIsoFolders] = useState([]);
  const [docMasters, setDocMasters] = useState([]);
  const [clientDocs, setClientDocs] = useState([]);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  // State UI Dashboard Baru
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
        if(snap.exists()) setSettings(snap.data());
    });
    
    const storedClient = localStorage.getItem('mase_client');
    if (storedClient) {
        const parsed = JSON.parse(storedClient);
        setLoggedInClient(parsed);
        if(parsed.assignedFolders?.length > 0) setActiveFolderId(parsed.assignedFolders[0]);
    }
    return () => unsubSettings();
  }, []);

  useEffect(() => {
      if (loggedInClient) {
          const unsubIsoTypes = onSnapshot(query(collection(db, "iso_types"), orderBy("createdAt", "asc")), snap => {
              setIsoTypes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });
          const unsubFolders = onSnapshot(query(collection(db, "iso_folders"), orderBy("createdAt", "asc")), snap => {
              setIsoFolders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });
          const unsubMasters = onSnapshot(query(collection(db, "doc_masters"), orderBy("createdAt", "asc")), snap => {
              setDocMasters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });
          const unsubClientDocs = onSnapshot(query(collection(db, "client_docs"), where("clientId", "==", loggedInClient.id)), snap => {
              setClientDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          });

          return () => { unsubIsoTypes(); unsubFolders(); unsubMasters(); unsubClientDocs(); }
      }
  }, [loggedInClient]);

  // Upload Cloudinary
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

  // MULTIPLE FILE UPLOAD LOGIC
  const handleFileUpload = async (e, masterId) => {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length === 0) return;

      // Cek limit ukuran semua file
      for (let f of selectedFiles) {
          if (f.size > 5 * 1024 * 1024) {
              alert(`File "${f.name}" terlalu besar! Maksimal 5MB per file.`);
              e.target.value = null;
              return;
          }
      }

      setUploadingDocId(masterId);
      try {
          // Upload semua file yang dipilih sekaligus
          const uploadedFiles = [];
          for (let f of selectedFiles) {
              const url = await uploadToCloudinary(f);
              uploadedFiles.push({ url, name: f.name, uploadedAt: new Date().toISOString() });
          }

          const existingDoc = clientDocs.find(d => d.masterId === masterId);
          
          if (existingDoc) {
              // Jika sudah ada data sebelumnya, kita GABUNGKAN (Append) array file-nya
              let currentFiles = existingDoc.files || [];
              
              // Migrasi aman jika klien masih pakai versi 1 file sebelumnya (fileUrl)
              if (existingDoc.fileUrl && currentFiles.length === 0) {
                  currentFiles = [{ url: existingDoc.fileUrl, name: 'Dokumen_Lama.pdf' }];
              }
              
              await updateDoc(doc(db, "client_docs", existingDoc.id), {
                  files: [...currentFiles, ...uploadedFiles],
                  status: 'pending', // kembali pending agar dicek admin lagi
                  updatedAt: serverTimestamp()
              });
          } else {
              // Buat dokumen baru dengan Array files
              await addDoc(collection(db, "client_docs"), {
                  clientId: loggedInClient.id,
                  masterId: masterId,
                  files: uploadedFiles,
                  status: 'pending', 
                  adminComment: '',
                  createdAt: serverTimestamp()
              });
          }
          alert(`Berhasil mengunggah ${selectedFiles.length} dokumen!`);
      } catch (err) {
          alert("Gagal mengunggah dokumen: " + err.message);
      }
      setUploadingDocId(null);
      e.target.value = null;
  };

  // Hapus File Spesifik (Jika klien salah upload)
  const handleDeleteFile = async (cDoc, fileIndex) => {
      if(!confirm("Yakin ingin menghapus file ini?")) return;
      
      let currentFiles = cDoc.files || [];
      if (cDoc.fileUrl && currentFiles.length === 0) {
          currentFiles = [{ url: cDoc.fileUrl, name: 'Dokumen_Lama.pdf' }];
      }
      
      const newFiles = [...currentFiles];
      newFiles.splice(fileIndex, 1);
      
      try {
          await updateDoc(doc(db, "client_docs", cDoc.id), { 
              files: newFiles,
              updatedAt: serverTimestamp()
          });
      } catch(err) {
          alert("Gagal menghapus: " + err.message);
      }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (loginMode === 'admin') {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/admin'); 
        } catch (err) { alert("Login Admin Gagal! Email atau Password salah."); }
    } else {
        try {
            const q = query(collection(db, "clients"), where("email", "==", email), where("password", "==", password));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                alert("Akun tidak ditemukan! Pastikan Email dan Password sudah benar.");
            } else {
                const clientData = querySnapshot.docs[0].data();
                const clientId = querySnapshot.docs[0].id;
                const sessionData = { id: clientId, ...clientData };
                localStorage.setItem('mase_client', JSON.stringify(sessionData));
                setLoggedInClient(sessionData);
                if(sessionData.assignedFolders?.length > 0) setActiveFolderId(sessionData.assignedFolders[0]);
            }
        } catch (err) { alert("Terjadi kesalahan: " + err.message); }
    }
    setLoading(false);
  };

  const handleLogout = () => {
      localStorage.removeItem('mase_client');
      setLoggedInClient(null); setEmail(''); setPassword('');
  };

  // ============================================
  // TAMPILAN DASHBOARD KLIEN (SIDEBAR + CONTENT)
  // ============================================
  if (loggedInClient) {
      const assignedFolders = loggedInClient.assignedFolders || [];
      const assignedMasterDocs = docMasters.filter(d => assignedFolders.includes(d.folderId));
      const totalDocs = assignedMasterDocs.length;
      const approvedDocs = clientDocs.filter(d => d.status === 'approved').length;
      const progressPercentage = totalDocs === 0 ? 0 : Math.round((approvedDocs / totalDocs) * 100);

      // Pastikan ada folder yang aktif
      const currentFolderId = activeFolderId || assignedFolders[0];
      const activeFolder = isoFolders.find(f => f.id === currentFolderId);
      const activeDocsInFolder = docMasters.filter(d => d.folderId === currentFolderId);

      return (
          <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
              
              {/* Header Mobile untuk Hamburger Menu */}
              <div className="md:hidden absolute top-0 left-0 w-full bg-slate-900 text-white p-4 flex justify-between items-center z-20 shadow-md">
                  <h1 className="text-sm font-black text-emerald-500 tracking-widest uppercase truncate">{loggedInClient.lembagaName}</h1>
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-800 rounded">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg>
                  </button>
              </div>
              
              {/* Overlay untuk nutup sidebar di Mobile */}
              {isSidebarOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-20" onClick={() => setIsSidebarOpen(false)}></div>}

              {/* --- SIDEBAR KIRI --- */}
              <aside className={`fixed md:relative top-0 left-0 w-64 h-full bg-slate-900 text-slate-300 flex flex-col shadow-xl z-30 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 border-r border-slate-800`}>
                  <div className="p-6 border-b border-slate-800 mt-14 md:mt-0 bg-slate-950">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">Area Klien</p>
                      <h1 className="text-lg font-black text-emerald-500 leading-tight">{loggedInClient.lembagaName}</h1>
                      <p className="text-xs text-slate-400 mt-2">PIC: {loggedInClient.picName}</p>
                  </div>
                  
                  <div className="p-6 border-b border-slate-800 bg-slate-900">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold flex justify-between">
                          <span>Progress</span> <span>{progressPercentage}%</span>
                      </p>
                      <div className="w-full bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden">
                          <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400">{approvedDocs} dari {totalDocs} Dokumen Disetujui</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 px-2 font-bold">Daftar Folder Syarat</p>
                      {assignedFolders.length === 0 ? (
                          <p className="text-xs text-slate-500 px-2 italic">Belum ada folder.</p>
                      ) : assignedFolders.map(folderId => {
                          const folder = isoFolders.find(f => f.id === folderId);
                          if (!folder) return null;
                          const isActive = currentFolderId === folder.id;
                          const docsCount = docMasters.filter(d => d.folderId === folder.id).length;
                          return (
                              <button key={folder.id} onClick={() => { setActiveFolderId(folder.id); setIsSidebarOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl transition flex justify-between items-center ${isActive ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                                  <span className="font-bold text-sm truncate pr-2">📁 {folder.name}</span>
                                  <span className={`text-[10px] py-1 px-2.5 rounded-full font-bold ${isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-500'}`}>{docsCount}</span>
                              </button>
                          )
                      })}
                  </div>

                  <div className="p-4 border-t border-slate-800 bg-slate-950">
                      <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition">Keluar / Logout</button>
                  </div>
              </aside>

              {/* --- KONTEN KANAN (UPLOAD FILE) --- */}
              <main className="flex-1 h-full overflow-y-auto bg-slate-50/50 p-4 md:p-10 pt-20 md:pt-10">
                  {activeFolder ? (
                      <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
                          <div className="mb-6 pb-6 border-b border-slate-200">
                              <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-600 mb-1">Sedang Membuka Folder</p>
                              <h2 className="text-2xl md:text-3xl font-black text-slate-900">{activeFolder.name}</h2>
                              <p className="text-sm text-slate-500 mt-2">Silakan lengkapi {activeDocsInFolder.length} persyaratan dokumen di bawah ini.</p>
                          </div>

                          <div className="space-y-4">
                              {activeDocsInFolder.length === 0 ? (
                                  <div className="p-10 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-slate-400 text-sm">Belum ada syarat dokumen di dalam folder ini.</div>
                              ) : activeDocsInFolder.map((master, idx) => {
                                  const uploadedDoc = clientDocs.find(d => d.masterId === master.id);
                                  
                                  // Ekstrak array file (dukungan backward compatibility untuk data lama)
                                  let currentFiles = uploadedDoc?.files || [];
                                  if (uploadedDoc?.fileUrl && currentFiles.length === 0) {
                                      currentFiles = [{ url: uploadedDoc.fileUrl, name: 'Dokumen_Lama.pdf' }];
                                  }

                                  let statusBadge = <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200">Belum Upload</span>;
                                  if (uploadedDoc) {
                                      if (uploadedDoc.status === 'pending') statusBadge = <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[10px] font-bold uppercase tracking-widest animate-pulse border border-yellow-200">Menunggu Review</span>;
                                      if (uploadedDoc.status === 'approved') statusBadge = <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-200">Disetujui (ACC)</span>;
                                      if (uploadedDoc.status === 'revision') statusBadge = <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-red-200">Perlu Revisi</span>;
                                  }

                                  return (
                                      <div key={master.id} className={`p-4 md:p-6 rounded-2xl border ${uploadedDoc?.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' : uploadedDoc?.status === 'revision' ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'} shadow-sm transition-all hover:shadow-md`}>
                                          
                                          {/* Header Syarat Dokumen */}
                                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                              <div className="flex-1">
                                                  <div className="flex items-start gap-3">
                                                      <span className="w-6 h-6 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{idx + 1}</span>
                                                      <div>
                                                          <h4 className="font-bold text-sm md:text-base text-slate-800 mb-2">{master.name}</h4>
                                                          <div className="flex flex-wrap items-center gap-2">
                                                              {statusBadge}
                                                          </div>
                                                      </div>
                                                  </div>
                                                  
                                                  {/* Pesan Revisi */}
                                                  {uploadedDoc?.status === 'revision' && uploadedDoc?.adminComment && (
                                                      <div className="ml-9 mt-3 p-3 bg-red-100/50 border border-red-200 rounded-xl text-xs text-red-800">
                                                          <strong>Pesan Revisi:</strong> {uploadedDoc.adminComment}
                                                      </div>
                                                  )}

                                                  {/* List Multiple File Upload */}
                                                  {currentFiles.length > 0 && (
                                                      <div className="ml-9 mt-4 space-y-2">
                                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">File Terunggah ({currentFiles.length}):</p>
                                                          {currentFiles.map((fileItem, fIdx) => (
                                                              <div key={fIdx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                                                                  <a href={fileItem.url} target="_blank" className="text-xs text-indigo-600 font-bold hover:underline truncate max-w-[200px] md:max-w-md flex items-center gap-2">
                                                                      📄 {fileItem.name}
                                                                  </a>
                                                                  {uploadedDoc?.status !== 'approved' && (
                                                                      <button onClick={() => handleDeleteFile(uploadedDoc, fIdx)} className="text-[10px] text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 rounded">Hapus</button>
                                                                  )}
                                                              </div>
                                                          ))}
                                                      </div>
                                                  )}
                                              </div>

                                              {/* Area Upload Multiple */}
                                              <div className="md:w-64 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center shrink-0">
                                                  {uploadedDoc?.status !== 'approved' ? (
                                                      <div className="relative w-full">
                                                          <label className="text-[10px] font-bold text-slate-500 mb-2 block">Tambah File (Bisa lebih dari 1)</label>
                                                          <input 
                                                              type="file" 
                                                              multiple // <-- INI YANG BIKIN BISA UPLOAD BANYAK SEKALIGUS
                                                              accept=".pdf,image/*,.doc,.docx,.xls,.xlsx"
                                                              onChange={(e) => handleFileUpload(e, master.id)}
                                                              disabled={uploadingDocId === master.id}
                                                              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer disabled:opacity-50 border border-dashed border-slate-300 rounded-xl p-1 bg-slate-50"
                                                          />
                                                          {uploadingDocId === master.id && <p className="text-[10px] text-orange-600 font-bold mt-2 animate-pulse text-center">Sedang Mengunggah File...</p>}
                                                      </div>
                                                  ) : (
                                                      <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-xl border border-emerald-100 h-full">
                                                          <span className="text-2xl mb-1">✅</span>
                                                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 text-center">Syarat<br/>Terpenuhi</span>
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-pulse">
                          <span className="text-6xl mb-4">📂</span>
                          <p className="font-bold">Silakan pilih folder di menu samping</p>
                      </div>
                  )}
              </main>
          </div>
      );
  }

  // --- TAMPILAN FORM LOGIN TETAP SAMA ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl relative z-10 overflow-hidden">
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

        <div className="flex border-b border-slate-100 bg-slate-50">
            <button onClick={() => setLoginMode('client')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${loginMode === 'client' ? 'bg-white text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:bg-slate-100'}`}>Login Klien</button>
            <button onClick={() => setLoginMode('admin')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${loginMode === 'admin' ? 'bg-white text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:bg-slate-100'}`}>Login Admin</button>
        </div>

        <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Email</label>
                    <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className={`w-full border-2 border-slate-100 p-3 rounded-xl outline-none text-sm transition-colors ${loginMode === 'admin' ? 'focus:border-orange-500' : 'focus:border-emerald-500'}`} placeholder={loginMode === 'admin' ? "email.admin@mase.com" : "email.klien@lembaga.com"} />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Password</label>
                    <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className={`w-full border-2 border-slate-100 p-3 rounded-xl outline-none text-sm transition-colors ${loginMode === 'admin' ? 'focus:border-orange-500' : 'focus:border-emerald-500'}`} placeholder="••••••••" />
                </div>
                <button disabled={loading} className={`w-full text-white font-bold tracking-widest uppercase text-xs py-4 rounded-xl transition shadow-lg mt-4 ${loginMode === 'admin' ? 'bg-slate-900 hover:bg-orange-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                    {loading ? 'Memproses...' : (loginMode === 'admin' ? 'Masuk Panel Admin' : 'Masuk Portal Klien')}
                </button>
                {loginMode === 'client' && (
                    <p className="text-[9px] text-slate-400 text-center leading-relaxed mt-4">Masukkan Email dan Password yang telah diberikan oleh pihak Admin MASE kepada Anda.</p>
                )}
            </form>
        </div>
      </div>
    </div>
  );
}