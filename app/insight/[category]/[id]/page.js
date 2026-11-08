"use client";
import { useEffect, useState, use } from 'react';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCategorySlug, getCategoryLabel, estimateReadingTime } from '@/lib/insight';

export default function InsightArticleDetail({ params }) {
  const resolvedParams = use(params);
  const routeCategory = resolvedParams.category || 'berita';
  const id = resolvedParams.id;

  // State
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [teams, setTeams] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  
  // Reading mode state
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0: Small, 1: Normal, 2: Large
  const [copied, setCopied] = useState(false);

  // Comment state
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    // 1. Fetch settings
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), snap => {
      if (snap.exists()) setSettings(snap.data());
    });

    // 2. Fetch post
    const fetchPost = async () => {
      try {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost(docSnap.data());
          try {
            await updateDoc(docRef, { views: increment(1) });
          } catch (e) {
            // views increment optional
          }
        }
      } catch (err) {
        console.error("Error fetching article:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();

    // 3. Comments listener
    const unsubComments = onSnapshot(
      query(collection(db, "posts", id, "comments"), orderBy("createdAt", "desc")),
      snap => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // 4. Latest posts
    const unsubLatest = onSnapshot(
      query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(6)),
      snap => setLatestPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // 5. Popular posts
    const unsubPopular = onSnapshot(
      query(collection(db, "posts"), orderBy("views", "desc"), limit(6)),
      snap => setPopularPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // 6. Teams for author avatars
    const unsubTeams = onSnapshot(
      query(collection(db, "teams")),
      snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubSettings();
      unsubComments();
      unsubLatest();
      unsubPopular();
      unsubTeams();
    };
  }, [id]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!name.trim() || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await addDoc(collection(db, "posts", id, "comments"), {
        name: name.trim(),
        text: commentText.trim(),
        createdAt: serverTimestamp()
      });
      setName('');
      setCommentText('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch (err) {
      alert("Gagal mengirim komentar: " + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat Redaksi Mahatma...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-center px-4">
        <span className="text-6xl mb-4">📰</span>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Artikel Tidak Ditemukan</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm max-w-md">
          Artikel yang Anda tuju mungkin telah dipindahkan, diperbarui tautannya, atau disimpan sebagai draf.
        </p>
        <Link 
          href="/insight" 
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-md"
        >
          &larr; Kembali ke Indeks Insight
        </Link>
      </div>
    );
  }

  const categorySlug = getCategorySlug(post.category || routeCategory);
  const isOpini = categorySlug === 'opini';
  const categoryLabel = getCategoryLabel(categorySlug);

  // Publication date
  let publishDate = "Baru saja diterbitkan";
  if (post.createdAt && typeof post.createdAt.toDate === 'function') {
    publishDate = post.createdAt.toDate().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // Author resolution
  const authorName = post.author || 'Tim Redaksi Mahatma';
  const authorProfile = teams.find(t => t.name?.toLowerCase() === authorName.toLowerCase());

  // Format Content
  let finalContent = post.content || '';
  finalContent = finalContent.replace(/&nbsp;/g, ' ');
  finalContent = finalContent.replace(/^(<p><br><\/p>\s*)+/g, '');
  finalContent = finalContent.replace(/^(<p>\s*<\/p>\s*)+/g, '');

  if (post.dateline) {
    const datelineHtml = `<span class="inline-block font-black text-slate-900 dark:text-white uppercase tracking-wider mr-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] md:text-xs border border-slate-200 dark:border-slate-700">${post.dateline} &mdash;</span>`;
    if (finalContent.includes('<p>')) {
      finalContent = finalContent.replace(/<p>/, `<p class="article-lead">${datelineHtml} `);
    } else {
      finalContent = `<p class="article-lead">${datelineHtml} ${finalContent}</p>`;
    }
  }

  const readTime = estimateReadingTime(post.content);

  // Recommendations
  const relatedPosts = latestPosts.filter(p => !p.isDraft && p.id !== id && getCategorySlug(p.category) === categorySlug).slice(0, 3);
  const validPopular = popularPosts.filter(p => !p.isDraft && p.id !== id).slice(0, 5);
  const inlineBacaJuga = latestPosts.filter(p => !p.isDraft && p.id !== id).slice(0, 2);

  // Current page share link
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://mahatma.id/insight/${categorySlug}/${id}`;
  const shareTitle = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(currentUrl);

  // Font size styling
  const fontSizeClasses = {
    0: 'prose-sm text-[0.95rem] leading-[1.75]',
    1: 'prose-base text-[1.075rem] leading-[1.85]',
    2: 'prose-lg text-[1.2rem] leading-[1.95]'
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-800 dark:text-slate-200 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      
      {/* GLOBAL ARTICLE STYLES FOR HIGH-COMFORT READING */}
      <style jsx global>{`
        .news-article-content {
          color: #334155;
          width: 100%;
        }
        .dark .news-article-content {
          color: #cbd5e1;
        }
        .news-article-content p {
          margin-bottom: 1.5rem;
          word-break: normal;
          overflow-wrap: break-word;
        }
        .news-article-content p.article-lead {
          font-size: 1.15em;
          line-height: 1.85;
          color: #0f172a;
        }
        .dark .news-article-content p.article-lead {
          color: #f1f5f9;
        }
        .news-article-content strong, .news-article-content b {
          font-weight: 800;
          color: #0f172a;
        }
        .dark .news-article-content strong, .dark .news-article-content b {
          color: #f8fafc;
        }
        .news-article-content h2 {
          font-size: 1.6em;
          font-weight: 800;
          color: #0f172a;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          line-height: 1.35;
          letter-spacing: -0.02em;
        }
        .dark .news-article-content h2 {
          color: #f8fafc;
        }
        .news-article-content h3 {
          font-size: 1.35em;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        .dark .news-article-content h3 {
          color: #f8fafc;
        }
        .news-article-content blockquote {
          position: relative;
          border-left: 4px solid ${isOpini ? '#d97706' : '#059669'};
          padding: 1.25rem 1.5rem;
          margin: 2rem 0;
          background: ${isOpini ? '#fffbeb' : '#ecfdf5'};
          border-radius: 0 1rem 1rem 0;
          font-style: italic;
          font-size: 1.05em;
          color: ${isOpini ? '#78350f' : '#065f46'};
        }
        .dark .news-article-content blockquote {
          background: ${isOpini ? '#451a03' : '#064e3b'};
          color: ${isOpini ? '#fef3c7' : '#d1fae5'};
        }
        .news-article-content ul, .news-article-content ol {
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .news-article-content ul { list-style-type: disc; }
        .news-article-content ol { list-style-type: decimal; }
        .news-article-content li {
          margin-bottom: 0.5rem;
          padding-left: 0.25rem;
        }
        .news-article-content a {
          color: #059669;
          text-decoration: underline;
          text-underline-offset: 4px;
          font-weight: 600;
        }
        .dark .news-article-content a {
          color: #34d399;
        }
        .news-article-content img {
          border-radius: 1rem;
          margin: 2rem auto;
          max-width: 100%;
          height: auto;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
        }
        @media print {
          header, footer, .no-print { display: none !important; }
          main { padding-top: 0 !important; }
          article { border: none !important; box-shadow: none !important; }
        }
      `}</style>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 md:px-8 lg:px-16 pt-32 md:pt-36 pb-20 max-w-7xl">
        
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 no-print overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-emerald-600 transition">Beranda</Link>
          <span>/</span>
          <Link href="/insight" className="hover:text-emerald-600 transition">Insight</Link>
          <span>/</span>
          <Link href={`/insight/${categorySlug}`} className="hover:text-emerald-600 transition">
            {isOpini ? 'Opini' : 'Berita'}
          </Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 truncate max-w-xs">{post.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* MAIN ARTICLE COLUMN (8 of 12) */}
          <article className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 md:p-10 lg:p-12 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-300">
            
            {/* CATEGORY & DRAFT BADGE */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Link 
                href={`/insight/${categorySlug}`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest text-white shadow-sm transition hover:opacity-90 ${
                  isOpini ? 'bg-amber-600' : 'bg-emerald-600'
                }`}
              >
                <span>{isOpini ? '💡' : '📰'}</span>
                <span>{categoryLabel}</span>
              </Link>

              {post.isDraft && (
                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                  DRAF (BELUM DIPUBLIKASIKAN)
                </span>
              )}
            </div>

            {/* HEADLINE */}
            <h1 className="text-2xl md:text-4xl lg:text-[2.6rem] font-black text-slate-900 dark:text-white leading-[1.25] tracking-tight mb-6">
              {post.title}
            </h1>

            {/* EXCERPT / LEAD JIKA ADA */}
            {post.excerpt && (
              <p className="text-base md:text-lg font-medium text-slate-600 dark:text-slate-300 mb-6 italic leading-relaxed border-l-2 border-slate-300 dark:border-slate-700 pl-4">
                {post.excerpt}
              </p>
            )}

            {/* AUTHOR BYLINE & READING CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-100 dark:border-slate-800 my-6">
              
              {/* Author Info */}
              <div className="flex items-center gap-3.5">
                {authorProfile?.img ? (
                  <img 
                    src={authorProfile.img} 
                    alt={authorName} 
                    className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700" 
                  />
                ) : (
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center font-black text-base shadow-inner">
                    {authorName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white">
                      {authorName}
                    </p>
                    <span className="text-emerald-500 text-xs" title="Terverifikasi Redaksi">✓</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                    {publishDate} • ⏱️ {readTime} MENIT BACA • 👁️ {post.views || 0} DIBACA
                  </p>
                </div>
              </div>

              {/* Reading Tools: Font Resizer & Print */}
              <div className="flex items-center gap-2 self-start sm:self-center no-print">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <button 
                    onClick={() => setFontSizeLevel(0)} 
                    className={`px-2 py-1 rounded ${fontSizeLevel === 0 ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-60'}`}
                    title="Ukuran teks kecil"
                  >
                    A-
                  </button>
                  <button 
                    onClick={() => setFontSizeLevel(1)} 
                    className={`px-2 py-1 rounded ${fontSizeLevel === 1 ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-60'}`}
                    title="Ukuran teks standar"
                  >
                    A
                  </button>
                  <button 
                    onClick={() => setFontSizeLevel(2)} 
                    className={`px-2 py-1 rounded ${fontSizeLevel === 2 ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-60'}`}
                    title="Ukuran teks besar"
                  >
                    A+
                  </button>
                </div>

                <button 
                  onClick={handlePrint} 
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition text-xs font-bold"
                  title="Cetak Berita (Print)"
                >
                  🖨️
                </button>
              </div>
            </div>

            {/* HERO FEATURED IMAGE */}
            {post.coverUrl && (
              <figure className="mb-8 md:mb-10">
                <div className="w-full aspect-[16/9] bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <img 
                    src={post.coverUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                {post.coverCaption ? (
                  <figcaption className="text-center text-[11px] md:text-xs text-slate-400 dark:text-slate-500 mt-2.5 italic">
                    {post.coverCaption}
                  </figcaption>
                ) : (
                  <figcaption className="text-right text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider font-semibold">
                    Foto: Dokumentasi Mahatma Academy
                  </figcaption>
                )}
              </figure>
            )}

            {/* OPINI DISCLAIMER BOX JIKA KATEGORI OPINI */}
            {isOpini && (
              <div className="mb-8 p-4 md:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs md:text-sm leading-relaxed">
                <div className="font-extrabold flex items-center gap-1.5 mb-1 text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[11px]">
                  <span>💡</span> Catatan Redaksi (Kolom Opini):
                </div>
                Tulisan ini merupakan analisis, esai, dan opini independen dari penulis. Seluruh materi, data, dan gagasan yang disampaikan merupakan tanggung jawab pribadi penulis serta tidak mencerminkan sikap institusi secara resmi.
              </div>
            )}

            {/* ARTICLE CONTENT */}
            <div 
              className={`news-article-content ${fontSizeClasses[fontSizeLevel]}`} 
              dangerouslySetInnerHTML={{ __html: finalContent }} 
            />

            {/* INLINE "BACA JUGA" WIDGET */}
            {inlineBacaJuga.length > 0 && (
              <div className="mt-10 mb-8 bg-emerald-50/60 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-5 rounded-r-2xl no-print">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-3 flex items-center">
                  <span className="mr-2">👉</span> Baca Juga:
                </h4>
                <ul className="space-y-2">
                  {inlineBacaJuga.map(bp => (
                    <li key={bp.id}>
                      <Link 
                        href={`/insight/${getCategorySlug(bp.category)}/${bp.id}`} 
                        className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition leading-snug flex items-center gap-2 group"
                      >
                        <span className="text-emerald-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                        <span className="group-hover:underline">{bp.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TAGS */}
            {post.tags && (
              <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 no-print">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Topik:</span>
                  {post.tags.split(',').map((tag, idx) => {
                    const cleanTag = tag.trim();
                    if (!cleanTag) return null;
                    return (
                      <Link 
                        key={idx} 
                        href={`/insight?tag=${encodeURIComponent(cleanTag)}`} 
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold transition"
                      >
                        #{cleanTag}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SHARE BAR (BOTTOM VIRALITY) */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 no-print">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Bagikan Artikel:
              </span>
              <div className="flex items-center gap-2">
                {/* WhatsApp */}
                <a 
                  href={`https://api.whatsapp.com/send?text=${shareTitle}%20-%20${encodedUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3.5 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <span>WhatsApp</span>
                </a>

                {/* Twitter / X */}
                <a 
                  href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodedUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <span>X (Twitter)</span>
                </a>

                {/* Facebook */}
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <span>Facebook</span>
                </a>

                {/* Telegram */}
                <a 
                  href={`https://t.me/share/url?url=${encodedUrl}&text=${shareTitle}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <span>Telegram</span>
                </a>

                {/* Copy Link Button */}
                <button 
                  onClick={handleCopyLink} 
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <span>{copied ? '✓ Tersalin!' : '🔗 Salin Link'}</span>
                </button>
              </div>
            </div>

            {/* ABOUT THE AUTHOR (AUTHOR BOX) */}
            <div className="mt-12 p-6 md:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 no-print flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {authorProfile?.img ? (
                <img 
                  src={authorProfile.img} 
                  alt={authorName} 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-sm shrink-0" 
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
                  {authorName[0].toUpperCase()}
                </div>
              )}
              <div className="text-center sm:text-left flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  {isOpini ? 'Profil Kolumnis' : 'Tentang Penulis'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {authorName}
                </h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {authorProfile?.role 
                    ? `${authorProfile.role} di Mahatma Academy. Berdedikasi pada pengembangan kurikulum, kepemimpinan visioner, dan transformasi masa depan pendidikan.`
                    : 'Kontributor dan tim redaksi riset & wawasan Mahatma Academy.'}
                </p>
                <div className="mt-4">
                  <Link 
                    href="/tim" 
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Lihat Seluruh Dewan Pakar Mahatma &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* READER COMMENTS & DISCUSSIONS */}
            <section className="mt-14 pt-10 border-t border-slate-100 dark:border-slate-800 no-print">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                    Diskusi Pembaca
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {comments.length} gagasan dan tanggapan dari pembaca
                  </p>
                </div>
              </div>

              {/* Form Komentar */}
              <form onSubmit={submitComment} className="mb-10 bg-slate-50 dark:bg-slate-800/40 p-5 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nama Lengkap
                  </label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Contoh: Dr. Budi Santoso" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs md:text-sm focus:outline-none focus:border-emerald-500 transition" 
                    required 
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Komentar / Gagasan Tanggapan
                  </label>
                  <textarea 
                    value={commentText} 
                    onChange={e => setCommentText(e.target.value)} 
                    rows={4} 
                    placeholder="Tuliskan pandangan atau feedback konstruktif Anda mengenai artikel ini..." 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs md:text-sm focus:outline-none focus:border-emerald-500 transition" 
                    required 
                  />
                </div>
                <div className="flex items-center justify-between">
                  {commentSuccess && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ Komentar Anda berhasil diterbitkan!
                    </span>
                  )}
                  <button 
                    type="submit" 
                    disabled={submittingComment} 
                    className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
                  >
                    {submittingComment ? 'Mengirim...' : 'Kirim Komentar'}
                  </button>
                </div>
              </form>

              {/* Daftar Komentar */}
              <div className="space-y-4">
                {comments.map(c => {
                  const cDate = c.createdAt ? c.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja';
                  return (
                    <div key={c.id} className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs md:text-sm text-slate-900 dark:text-white">
                          💬 {c.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cDate}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {c.text}
                      </p>
                    </div>
                  );
                })}

                {comments.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">
                    Jadilah yang pertama memberikan tanggapan atau gagasan untuk artikel ini.
                  </p>
                )}
              </div>
            </section>
          </article>

          {/* SIDEBAR COLUMN (4 of 12) */}
          <aside className="lg:col-span-4 space-y-8 no-print">
            
            {/* WIDGET 1: CARI DI MAHATMA INSIGHT */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white mb-4">
                Telusuri Insight
              </h4>
              <form onSubmit={e => {
                e.preventDefault();
                const q = e.target.q.value;
                if (q) window.location.href = `/insight?tag=${encodeURIComponent(q)}`;
              }}>
                <div className="relative">
                  <input 
                    name="q"
                    type="text" 
                    placeholder="Ketik topik atau kata kunci..." 
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-emerald-500" 
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600">
                    🔍
                  </button>
                </div>
              </form>
            </div>

            {/* WIDGET 2: ARTIKEL TERKAIT (SAME CATEGORY) */}
            {relatedPosts.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white mb-5 flex items-center justify-between">
                  <span>{isOpini ? 'Opini Lainnya' : 'Berita Lainnya'}</span>
                  <Link href={`/insight/${categorySlug}`} className="text-[10px] text-emerald-600 font-bold hover:underline">
                    Semua &rarr;
                  </Link>
                </h4>
                <div className="space-y-4">
                  {relatedPosts.map(rp => (
                    <Link 
                      key={rp.id} 
                      href={`/insight/${categorySlug}/${rp.id}`} 
                      className="group flex gap-3 items-start"
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                        <img 
                          src={rp.coverUrl || 'https://placehold.co/200x200'} 
                          alt={rp.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 leading-snug line-clamp-2">
                          {rp.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {rp.createdAt ? rp.createdAt.toDate().toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : ''} • ⏱️ {estimateReadingTime(rp.content)}m
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* WIDGET 3: TERPOPULER */}
            {validPopular.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white mb-5">
                  🔥 Terpopuler di Mahatma
                </h4>
                <div className="space-y-4">
                  {validPopular.map((pp, idx) => {
                    const ppSlug = getCategorySlug(pp.category);
                    return (
                      <Link 
                        key={pp.id} 
                        href={`/insight/${ppSlug}/${pp.id}`} 
                        className="group flex items-start gap-3.5"
                      >
                        <span className="text-2xl font-black text-slate-300 dark:text-slate-700 w-6 shrink-0 group-hover:text-emerald-500 transition-colors">
                          0{idx + 1}
                        </span>
                        <div>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            ppSlug === 'opini' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {ppSlug === 'opini' ? 'Opini' : 'Berita'}
                          </span>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 leading-snug line-clamp-2 mt-1">
                            {pp.title}
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            👁️ {pp.views || 0} pembaca
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WIDGET 4: CALL TO ACTION NEWSLETTER / KONSULTASI */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-6 rounded-3xl text-white shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                MAHATMA ADVISORY
              </span>
              <h4 className="text-lg font-black mt-3 mb-2 leading-snug">
                Butuh Konsultasi Strategis untuk Institusi Anda?
              </h4>
              <p className="text-xs text-white/80 leading-relaxed mb-5">
                Diskusikan transformasi pendidikan dan integrasi AI bersama dewan pakar kami.
              </p>
              <a 
                href={`https://wa.me/${(settings.phone || '6285185639375').replace(/[^0-9]/g, '')}?text=Halo%20Mahatma,%20saya%20tertarik%20dengan%20layanan%20konsultasi.`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block text-center w-full py-2.5 rounded-xl bg-white text-emerald-800 font-extrabold text-xs uppercase tracking-wider hover:bg-slate-100 transition shadow-md"
              >
                Hubungi Kami via WhatsApp
              </a>
            </div>

          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
