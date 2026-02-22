"use client";
import { useEffect, useState, use } from 'react';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function BeritaDetail({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  // State Utama
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Sidebar & Rekomendasi
  const [latestPosts, setLatestPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [teams, setTeams] = useState([]); // Untuk mencari foto penulis
  
  // State Komentar
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

  useEffect(() => {
    // 1. Fetch Berita Utama & Tambah View Count
    const fetchPost = async () => {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setPost(docSnap.data());
            // Tambahkan jumlah views otomatis +1 setiap kali halaman dibuka
            try { await updateDoc(docRef, { views: increment(1) }); } catch (error) { console.log("View counter init"); }
        }
        setLoading(false);
    };
    fetchPost();

    // 2. Fetch Komentar Real-time
    const unsubComments = onSnapshot(query(collection(db, "posts", id, "comments"), orderBy("createdAt", "desc")), snap => {
        setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Fetch Berita Terbaru (Sidebar)
    const unsubLatest = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(6)), snap => {
        setLatestPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Fetch Berita Terpopuler (Sidebar)
    const unsubPopular = onSnapshot(query(collection(db, "posts"), orderBy("views", "desc"), limit(6)), snap => {
        setPopularPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Fetch Data Tim Pakar (Untuk Foto Penulis)
    const unsubTeams = onSnapshot(query(collection(db, "teams")), snap => {
        setTeams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubComments(); unsubLatest(); unsubPopular(); unsubTeams(); };
  }, [id]);

  const submitComment = async (e) => {
      e.preventDefault(); setLoadingComment(true);
      try {
          await addDoc(collection(db, "posts", id, "comments"), { name: name, text: text, createdAt: serverTimestamp() });
          setName(''); setText('');
      } catch (err) { alert("Gagal kirim komentar."); }
      setLoadingComment(false);
  };

  // Tampilan Loading & Error
  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div><p className="mt-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Memuat Berita...</p></div>;
  if (!post) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4"><h1 className="text-5xl font-bold text-slate-800 mb-2">404</h1><p className="text-slate-500 mb-6 text-sm">Berita tidak ditemukan.</p><Link href="/" className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest">Kembali ke Beranda</Link></div>;

  let publishDate = "Baru saja";
  if (post.createdAt) {
      publishDate = post.createdAt.toDate().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // CARI DATA PENULIS DI DATABASE TIM
  const authorName = post.author || 'Tim Redaksi';
  const authorProfile = teams.find(t => t.name.toLowerCase() === authorName.toLowerCase());

  // PEMBERSIH SPASI KAKU & ENTER KOSONG DARI EDITOR
  let finalContent = post.content || '';
  finalContent = finalContent.replace(/&nbsp;/g, ' '); 
  finalContent = finalContent.replace(/^(<p><br><\/p>\s*)+/g, ''); 
  finalContent = finalContent.replace(/^(<p>\s*<\/p>\s*)+/g, ''); 

  // SISIPKAN DATELINE
  if (post.dateline) {
      const datelineHtml = `<strong class="text-slate-900 font-black mr-2 uppercase">${post.dateline} &mdash;</strong>`;
      if (finalContent.includes('<p>')) finalContent = finalContent.replace(/<p>/, `<p>${datelineHtml} `);
      else finalContent = `<p>${datelineHtml} ${finalContent}</p>`;
  }

  // MENGHITUNG ESTIMASI WAKTU BACA (ESTIMATED READING TIME)
  // Menghapus semua tag HTML hanya untuk keperluan menghitung jumlah kata
  const plainText = finalContent.replace(/<[^>]+>/g, ''); 
  const wordCount = plainText.trim().split(/\s+/).length;
  // Rata-rata orang membaca 200 kata per menit
  const readTime = Math.max(1, Math.ceil(wordCount / 200)); 

  const formatDateSidebar = (timestamp) => timestamp ? timestamp.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "Baru saja";

  // DATA UNTUK SIDEBAR & BACA JUGA (Hanya tampilkan yang bukan DRAF)
  const validLatestPosts = latestPosts.filter(p => !p.isDraft && p.id !== id).slice(0, 4);
  const validPopularPosts = popularPosts.filter(p => !p.isDraft && p.id !== id).slice(0, 5);
  const bacaJugaPosts = latestPosts.filter(p => !p.isDraft && p.id !== id).slice(0, 2);

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pb-20 overflow-x-hidden selection:bg-orange-500 selection:text-white">
      
      {/* CSS KHUSUS EDITOR TEKS - TERMASUK PERBAIKAN GAMBAR DI DALAM ARTIKEL */}
      <style jsx global>{`
        .article-content { text-align: left; color: #374151; width: 100%; }
        .article-content p { margin-bottom: 1.25rem; line-height: 1.8; font-size: 1rem; word-break: normal; overflow-wrap: break-word; }
        @media (min-width: 768px) { .article-content p { font-size: 1.125rem; } }
        .article-content strong, .article-content b { font-weight: 800; color: #111827; }
        .article-content h2, .article-content h3 { font-weight: 800; color: #111827; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.4; }
        .article-content h2 { font-size: 1.5rem; } .article-content h3 { font-size: 1.25rem; }
        @media (min-width: 768px) { .article-content h2 { font-size: 1.875rem; margin-top: 2.5rem; } .article-content h3 { font-size: 1.5rem; } }
        .article-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; line-height: 1.8; font-size: 1rem; }
        .article-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.5rem; line-height: 1.8; font-size: 1rem; }
        @media (min-width: 768px) { .article-content ul, .article-content ol { font-size: 1.125rem; } }
        .article-content li { margin-bottom: 0.5rem; }
        .article-content a { color: #ea580c; text-decoration: underline; font-weight:bold; }
        .article-content blockquote { border-left: 4px solid #ea580c; padding-left: 1rem; font-style: italic; background: #fff7ed; padding: 1rem; border-radius: 0 0.5rem 0.5rem 0; margin-bottom: 1.5rem; font-size: 0.9rem;}
        @media (min-width: 768px) { .article-content blockquote { padding-left: 1.5rem; padding: 1.5rem; margin-bottom: 2rem; font-size: 1rem;} }
        
        /* CSS KHUSUS GAMBAR HASIL UPLOAD DARI TENGAH ARTIKEL */
        .article-content img { 
            border-radius: 0.75rem; 
            margin: 2.5rem auto; 
            max-width: 100%; 
            height: auto; 
            display: block; 
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
        }
      `}</style>

      {/* Navbar Atas */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 md:px-8 lg:px-16 h-14 md:h-16 flex items-center justify-between max-w-7xl">
            <Link href="/" className="font-extrabold text-lg md:text-2xl tracking-tight text-slate-900">MAHATMA <span className="text-orange-600">ACADEMY</span></Link>
            <Link href="/berita" className="text-[10px] md:text-sm font-bold text-slate-500 hover:text-orange-600 transition flex items-center gap-2 uppercase tracking-widest">&larr; Berita Lainnya</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 lg:px-16 mt-4 md:mt-10 max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
        
        {/* KOLOM KIRI: ARTIKEL UTAMA (8 Kolom) */}
        <article className="lg:col-span-8 bg-white p-5 md:p-10 lg:p-12 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 h-fit">
            
            {/* Header Berita */}
            <div className="mb-6 md:mb-8">
                <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-orange-50 text-orange-700 rounded-full text-[9px] md:text-xs font-bold uppercase tracking-widest mb-3 md:mb-4">
                    {post.category || 'Berita'}
                </span>
                
                {/* JIKA BERITA INI ADALAH DRAF, TAMPILKAN LABEL PERINGATAN */}
                {post.isDraft && (
                    <span className="ml-2 inline-block px-3 py-1 md:px-4 md:py-1.5 bg-red-600 text-white rounded-full text-[9px] md:text-xs font-bold uppercase tracking-widest mb-3 md:mb-4">
                        STATUS: DRAF (TIDAK PUBLIK)
                    </span>
                )}
                
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.3] md:leading-[1.25] mb-4 md:mb-6">
                    {post.title}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-b border-slate-100 py-3 md:py-5 mt-4">
                    
                    {/* BAGIAN AUTHOR (DENGAN FOTO PAKAR & WAKTU BACA) */}
                    <div className="flex items-center gap-3 md:gap-4">
                        {authorProfile ? (
                            <img src={authorProfile.img} alt={authorName} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-sm border border-slate-100" />
                        ) : (
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm md:text-lg">
                                {authorName[0].toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-xs md:text-sm text-slate-900">{authorName}</p>
                            {authorProfile && <p className="text-[9px] md:text-[10px] text-orange-600 font-bold mb-0.5 line-clamp-1">{authorProfile.role}</p>}
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                                {publishDate} • ⏱️ {readTime} MNT BACA • 👀 {post.views || 0} DIBACA
                            </p>
                        </div>
                    </div>

                    {/* Tombol Share */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => {navigator.clipboard.writeText(window.location.href); alert('Link Tersalin!')}} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition text-xs">🔗</button>
                        <a href={`https://api.whatsapp.com/send?text=${post.title} - ${typeof window !== 'undefined' ? window.location.href : ''}`} target="_blank" className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition font-bold text-[10px] md:text-xs">WA</a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${typeof window !== 'undefined' ? window.location.href : ''}`} target="_blank" className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition font-bold text-[10px] md:text-xs">FB</a>
                    </div>
                </div>
            </div>

            {/* Gambar Sampul */}
            {post.coverUrl && (
                <div className="w-full h-48 md:h-auto md:aspect-[2/1] bg-slate-200 rounded-xl md:rounded-2xl overflow-hidden mb-8 md:mb-10 shadow-sm">
                    <img src={post.coverUrl} alt={post.title} className="w-full h-full object-cover" />
                </div>
            )}

            {/* Isi Berita (Gambar yang diupload via Editor akan masuk ke sini dan rapi otomatis) */}
            <div className="article-content w-full" dangerouslySetInnerHTML={{ __html: finalContent }}></div>

            {/* BAGIAN "BACA JUGA" */}
            {bacaJugaPosts.length > 0 && (
                <div className="mt-12 mb-8 bg-orange-50/50 border-l-4 border-orange-500 p-5 md:p-6 rounded-r-xl">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs md:text-sm mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                        Baca Juga
                    </h4>
                    <ul className="space-y-3">
                        {bacaJugaPosts.map(bp => (
                            <li key={bp.id}>
                                <Link href={`/berita/${bp.id}`} className="text-sm md:text-base font-bold text-orange-600 hover:text-orange-800 transition leading-snug flex items-start group">
                                    <span className="mr-2 opacity-50 group-hover:opacity-100 transition">&rarr;</span> 
                                    <span className="group-hover:underline underline-offset-4">{bp.title}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* TAGS (HASHTAG BISA DIKLIK) */}
            {post.tags && (
                <div className="mt-8 md:mt-12 pt-6 border-t border-slate-100 flex flex-wrap gap-2">
                    {post.tags.split(',').map((tag, index) => (
                        <Link 
                            href={`/berita?tag=${tag.trim()}`} 
                            key={index} 
                            className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 text-slate-600 rounded-lg text-[9px] md:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            #{tag.trim()}
                        </Link>
                    ))}
                </div>
            )}

            {/* Komentar */}
            <div className="mt-10 md:mt-16 bg-slate-50 p-5 md:p-8 rounded-xl md:rounded-2xl border border-slate-100">
                <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-4 md:mb-6">Komentar ({comments.length})</h3>
                <form onSubmit={submitComment} className="mb-8 md:mb-10 bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <input type="text" required placeholder="Nama Anda" className="w-full mb-3 md:mb-4 border border-slate-300 p-2.5 md:p-3 rounded-lg outline-none focus:border-orange-500 font-medium text-xs md:text-sm" value={name} onChange={e => setName(e.target.value)} />
                    <textarea required rows="3" placeholder="Tulis pendapat Anda tentang berita ini..." className="w-full mb-3 md:mb-4 border border-slate-300 p-2.5 md:p-3 rounded-lg outline-none focus:border-orange-500 text-xs md:text-sm" value={text} onChange={e => setText(e.target.value)}></textarea>
                    <button disabled={loadingComment} type="submit" className="bg-slate-900 text-white font-bold py-2.5 px-6 md:py-3 md:px-8 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-xs md:text-sm w-full md:w-auto">
                        {loadingComment ? 'Mengirim...' : 'Kirim Komentar'}
                    </button>
                </form>

                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-slate-400 italic text-xs md:text-sm text-center py-4">Belum ada komentar jadilah yang pertama.</p>
                    ) : (
                        comments.map(c => {
                            let cDate = 'Baru saja';
                            if(c.createdAt) cDate = c.createdAt.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
                            return (
                                <div key={c.id} className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-2 md:mb-3">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs">{c.name.charAt(0).toUpperCase()}</div>
                                            <span className="font-bold text-slate-800 text-xs md:text-sm">{c.name}</span>
                                        </div>
                                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider">{cDate}</span>
                                    </div>
                                    <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{c.text}</p>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </article>

        {/* KOLOM KANAN: SIDEBAR */}
        <aside className="lg:col-span-4 space-y-6 md:space-y-8">
            
            {/* Widget: Berita Terbaru */}
            <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="font-extrabold text-base md:text-lg text-slate-900 mb-4 md:mb-6 border-b border-slate-100 pb-3 flex items-center">
                    <span className="w-2 h-5 md:h-6 bg-orange-500 rounded-full mr-2 md:mr-3"></span> Berita Terbaru
                </h3>
                <div className="flex flex-col gap-4 md:gap-5">
                    {validLatestPosts.map(p => (
                        <Link href={`/berita/${p.id}`} key={p.id} className="flex gap-3 md:gap-4 group items-center">
                            <div className="w-20 h-16 md:w-24 md:h-20 flex-shrink-0 bg-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <img src={p.coverUrl || 'https://placehold.co/600x400'} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            </div>
                            <div className="flex-1">
                                <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-orange-600 mb-0.5 md:mb-1 block">{p.category}</span>
                                <h4 className="font-bold text-xs md:text-sm text-slate-800 group-hover:text-orange-600 transition line-clamp-2 leading-snug">{p.title}</h4>
                                <span className="text-[9px] md:text-[10px] text-slate-400 mt-1 font-medium block">{formatDateSidebar(p.createdAt)}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Widget: Berita Terpopuler */}
            <div className="bg-slate-900 p-5 md:p-6 rounded-2xl md:rounded-[2rem] shadow-lg">
                <h3 className="font-extrabold text-base md:text-lg text-white mb-4 md:mb-6 border-b border-slate-800 pb-3 flex items-center">
                    <span className="w-2 h-5 md:h-6 bg-orange-500 rounded-full mr-2 md:mr-3"></span> Terpopuler
                </h3>
                <div className="flex flex-col gap-4 md:gap-5">
                    {validPopularPosts.map((p, index) => (
                        <Link href={`/berita/${p.id}`} key={p.id} className="flex gap-3 md:gap-4 group items-center">
                            <div className="w-6 md:w-8 flex-shrink-0 flex items-center justify-center font-black text-2xl md:text-3xl text-slate-700 group-hover:text-orange-500 transition italic">
                                {index + 1}
                            </div>
                            <div className="flex-1 border-b border-slate-800 pb-3 md:pb-4 group-last:border-0 group-last:pb-0">
                                <h4 className="font-bold text-xs md:text-sm text-gray-200 group-hover:text-white transition line-clamp-2 leading-snug">{p.title}</h4>
                                <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{p.category}</span>
                                    <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">👀 {p.views || 0}x</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>

      </main>
    </div>
  );
}