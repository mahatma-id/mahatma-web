"use client";
import { useEffect, useState, useMemo, useRef, use } from 'react';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCategorySlug, getCategoryLabel, estimateReadingTime, stripHtml } from '@/lib/insight';
import { generateQrMatrix } from '@/lib/qrcode';

function QrCodeSvg({ value, size = 84 }) {
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(value || 'https://mahatma.id');
    } catch (e) {
      return null;
    }
  }, [value]);

  if (!matrix) return null;
  const n = matrix.length;
  const quietZone = 2;
  const total = n + quietZone * 2;

  let pathData = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        pathData += `M${c + quietZone},${r + quietZone}h1v1h-1z `;
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className="bg-white rounded border border-slate-300"
      aria-label="QR Code Artikel"
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={pathData} fill="#0f172a" />
    </svg>
  );
}

function formatInstagramDisplay(igInput) {
  if (!igInput) return '@mahatma.id';
  let clean = igInput.trim();
  try {
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const u = new URL(clean);
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length > 0) return `@${parts[0].replace(/^@/, '')}`;
    }
  } catch (e) {
    // ignore URL parse error
  }
  clean = clean.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '');
  if (!clean) return '@mahatma.id';
  return clean.startsWith('@') ? clean : `@${clean}`;
}

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
  
  // Reading & Print Preview mode state
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0: Small, 1: Normal, 2: Large
  const [copied, setCopied] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);
  const newspaperPreviewRef = useRef(null);
  const newspaperPrintRef = useRef(null);

  // Auto-Fit Full A4 State (menyesuaikan jumlah karakter & ukuran teks agar lembar A4 210x297mm selalu terisi penuh dari atas ke bawah)
  const [fitCharLimit, setFitCharLimit] = useState(null);
  const [fitFontPt, setFitFontPt] = useState(9.4);
  const fitTrackerRef = useRef({ step: 220, dir: 0, tries: 0, postKey: '' });

  // Comment state
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    // 1. Fetch settings (untuk nomor WA, email, instagram di footer koran/majalah)
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

  // Auto-Fit Engine: Pastikan isi koran + QR Code selalu memenuhi tinggi kertas Full A4 (210mm x 297mm) tanpa terpotong dan tanpa ruang kosong
  useEffect(() => {
    if (!post) return;
    const defaultCap = post.coverUrl ? 3450 : 4450;
    if (fitTrackerRef.current.postKey !== id) {
      fitTrackerRef.current = { step: 240, dir: 0, tries: 0, postKey: id };
      setFitCharLimit(defaultCap);
      setFitFontPt(8.5);
      return;
    }
    if (fitCharLimit === null) {
      setFitCharLimit(defaultCap);
      return;
    }

    const timer = setTimeout(() => {
      const sheetEl = newspaperPreviewRef.current || newspaperPrintRef.current;
      if (!sheetEl) return;
      const wrapperEl = sheetEl.querySelector('[data-newspaper-body-wrapper]');
      const colsEl = sheetEl.querySelector('[data-newspaper-columns]');
      if (!wrapperEl || !colsEl) return;

      const availH = wrapperEl.clientHeight;
      const contentH = colsEl.offsetHeight;
      if (availH <= 100 || contentH <= 0) return;

      const tracker = fitTrackerRef.current;
      if (tracker.tries >= 14) return;

      const totalPlainLen = stripHtml(post.content || '').length;

      if (contentH > availH - 2) {
        // Isi melebihi batas bawah A4 -> kurangi kapasitas karakter agar QR Code tidak terpotong
        if (tracker.dir === 1) {
          tracker.step = Math.max(25, Math.floor(tracker.step / 2));
        }
        tracker.dir = -1;
        tracker.tries += 1;
        setFitCharLimit(prev => Math.max(700, (prev || defaultCap) - tracker.step));
      } else if (contentH < availH - 22) {
        // Masih ada ruang kosong di bagian bawah A4 -> tambah karakter atau perbesar sedikit font
        if (tracker.dir === -1) {
          tracker.step = Math.max(25, Math.floor(tracker.step / 2));
        }
        tracker.dir = 1;
        tracker.tries += 1;
        if ((fitCharLimit || defaultCap) < totalPlainLen + 300) {
          setFitCharLimit(prev => (prev || defaultCap) + tracker.step);
        } else if (fitFontPt < 11) {
          setFitFontPt(prev => Number((prev + 0.25).toFixed(2)));
        }
      }
    }, 25);

    return () => clearTimeout(timer);
  }, [post, id, showPrintPreview, fitCharLimit, fitFontPt]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTriggerPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadJpg = async () => {
    const sheetEl = newspaperPreviewRef.current || newspaperPrintRef.current;
    if (!sheetEl || typeof window === 'undefined') return;

    setIsDownloadingJpg(true);
    try {
      const width = sheetEl.offsetWidth || 794;
      const height = Math.round(width * (297 / 210)); // Strict Full A4 aspect ratio (210mm x 297mm)

      const fetchUrlAsDataUrl = async (url, cacheMode = 'force-cache') => {
        if (!url || url.startsWith('data:')) return url;
        try {
          const res = await fetch(url, { mode: 'cors', cache: cacheMode });
          const blob = await res.blob();
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          return '';
        }
      };

      // Helper to convert any image element or URL to Base64 Data URL so SVG foreignObject never taints canvas
      const imgElementToDataUrl = async (origImgEl) => {
        if (!origImgEl) return '';
        const resolvedSrc = origImgEl.currentSrc || origImgEl.src || origImgEl.getAttribute('src') || '';
        if (!resolvedSrc || resolvedSrc.startsWith('data:')) return resolvedSrc;

        // 1. Try drawing the already-loaded DOM image directly to a canvas
        if (origImgEl.complete && origImgEl.naturalWidth > 0) {
          try {
            const c = document.createElement('canvas');
            c.width = origImgEl.naturalWidth;
            c.height = origImgEl.naturalHeight;
            const cCtx = c.getContext('2d');
            cCtx.drawImage(origImgEl, 0, 0);
            return c.toDataURL('image/png');
          } catch (e) {
            // fallback to fetch below
          }
        }

        // 2. Fallback: fetch with CORS & no-cache
        return await fetchUrlAsDataUrl(resolvedSrc, 'no-cache');
      };

      // Inline external url(...) assets (such as @font-face woff2 files) inside CSS text
      const inlineCssUrls = async (cssText, baseUrl) => {
        const urlRegex = /url\((['"]?)([^)'"]+)\1\)/g;
        const matches = Array.from(cssText.matchAll(urlRegex));
        if (matches.length === 0) return cssText;

        let updatedCss = cssText;
        for (const m of matches) {
          const fullToken = m[0];
          const rawUrl = m[2];
          if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('#')) continue;
          let absUrl = rawUrl;
          try {
            absUrl = new URL(rawUrl, baseUrl || window.location.href).href;
          } catch (e) {
            // ignore
          }
          const dataUrl = await fetchUrlAsDataUrl(absUrl, 'force-cache');
          if (dataUrl) {
            updatedCss = updatedCss.split(fullToken).join(`url("${dataUrl}")`);
          }
        }
        return updatedCss;
      };

      // Collect all real CSS rules & @font-face declarations from the page so foreignObject renders identically to Preview & PDF
      let pageCss = '';
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.type === CSSRule.IMPORT_RULE && rule.href) {
              try {
                const res = await fetch(rule.href);
                const importedText = await res.text();
                pageCss += (await inlineCssUrls(importedText, rule.href)) + '\n';
              } catch (e) {
                // ignore
              }
            } else if (rule.cssText.includes('@font-face')) {
              pageCss += (await inlineCssUrls(rule.cssText, sheet.href || window.location.href)) + '\n';
            } else {
              pageCss += rule.cssText + '\n';
            }
          }
        } catch (e) {
          if (sheet.href) {
            try {
              const res = await fetch(sheet.href);
              const extCss = await res.text();
              pageCss += (await inlineCssUrls(extCss, sheet.href)) + '\n';
            } catch (err) {
              // ignore
            }
          }
        }
      }

      const clone = sheetEl.cloneNode(true);
      clone.style.margin = '0';
      clone.style.transform = 'none';
      clone.style.boxShadow = 'none';
      clone.style.border = 'none';
      clone.style.width = `${width}px`;
      clone.style.height = `${height}px`;
      clone.style.minHeight = `${height}px`;
      clone.style.maxHeight = `${height}px`;
      clone.style.backgroundColor = '#ffffff';
      clone.style.boxSizing = 'border-box';

      // Convert all <img> tags inside the clone to Base64 data URLs
      const origImgs = sheetEl.querySelectorAll('img');
      const cloneImgs = clone.querySelectorAll('img');
      await Promise.all(
        Array.from(cloneImgs).map(async (imgEl, idx) => {
          const dataUrl = await imgElementToDataUrl(origImgs[idx] || imgEl);
          if (dataUrl) {
            imgEl.setAttribute('src', dataUrl);
          } else {
            imgEl.removeAttribute('src');
          }
        })
      );

      // Escape closing style tags if any exist inside CSS strings
      const safeCss = pageCss.replace(/<\/style/gi, '<\\/style');
      const bodyClasses = (document.body?.className || '').replace(/dark/g, '').trim();
      const serializedHtml = new XMLSerializer().serializeToString(clone);
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <style type="text/css"><![CDATA[
            ${safeCss}
          ]]></style>
        </defs>
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" class="${bodyClasses}" style="margin:0;padding:0;width:${width}px;height:${height}px;background:#ffffff;">
            ${serializedHtml}
          </div>
        </foreignObject>
      </svg>`;

      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgDataUrl;
      });

      const scale = 2; // High-resolution 2x output (1588 x 2246 px Full A4)
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);

      const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `Koran-Mahatma-${id}.jpg`;
      link.href = jpgDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Gagal mengunduh JPG:', err);
      alert('Gagal mengunduh format JPG. Silakan gunakan tombol Cetak / Download PDF.');
    } finally {
      setIsDownloadingJpg(false);
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

  // Format Web Content: Bersihkan paragraf/baris kosong di awal & sisipkan Dateline tepat di samping kalimat pertama
  let finalContent = (post.content || '').replace(/&nbsp;/gi, ' ').replace(/\u200B/g, '').trim();
  const leadingTagsMatch = finalContent.match(/^((?:\s*<[^>]+>\s*)*)/);
  let leadingPrefix = leadingTagsMatch ? leadingTagsMatch[0] : '';
  let contentBodyRest = finalContent.slice(leadingPrefix.length).trimStart();

  // Hapus semua <br> dan tag kosong (seperti <p></p> atau <p class="..."><br></p>) di awal artikel
  leadingPrefix = leadingPrefix.replace(/<br\s*\/?>/gi, '');
  let prevPrefix;
  do {
    prevPrefix = leadingPrefix;
    leadingPrefix = leadingPrefix.replace(/<([a-zA-Z0-9]+)(\s[^>]*)?>\s*<\/\1>/g, '');
  } while (leadingPrefix !== prevPrefix);
  leadingPrefix = leadingPrefix.trim();

  if (post.dateline && post.dateline.trim()) {
    const datelineHtml = `<span class="inline font-black text-slate-900 dark:text-white uppercase tracking-wider mr-2 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] md:text-xs border border-slate-200 dark:border-slate-700">${post.dateline.trim()} &mdash;</span>`;
    if (leadingPrefix) {
      finalContent = `${leadingPrefix}${datelineHtml} ${contentBodyRest}`;
    } else {
      finalContent = `<p>${datelineHtml} ${contentBodyRest}</p>`;
    }
  } else {
    finalContent = leadingPrefix ? `${leadingPrefix}${contentBodyRest}` : `<p>${contentBodyRest}</p>`;
  }

  const readTime = estimateReadingTime(post.content);

  // Prepare Print Newspaper Blocks (Sequential Paragraphs, Bold Subheadings, & Inline Images)
  const normalizedPrintHtml = (post.content || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u200B/g, '')
    // Pisahkan <br> agar subjudul tebal yang dipisah <br> dengan paragraf tetap menjadi blok terpisah secara berurutan
    .replace(/<br\s*\/?>/gi, '</p><p>')
    // Pisahkan gambar inline <img> di tengah tulisan agar masuk secara berurutan sesuai posisinya
    .replace(/(<img\b[^>]*>)/gi, '</p>$1<p>');

  const blockRegex = /<(h[1-6]|p|div|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>|<img\b[^>]*>/gi;
  const allArticleBlocks = [];
  let match;
  while ((match = blockRegex.exec(normalizedPrintHtml)) !== null) {
    const fullMatch = match[0];
    if (/^<img\b/i.test(fullMatch)) {
      const srcMatch = fullMatch.match(/src=["']([^"']+)["']/i);
      const altMatch = fullMatch.match(/alt=["']([^"']*)["']/i);
      if (srcMatch && srcMatch[1] && srcMatch[1] !== post.coverUrl) {
        allArticleBlocks.push({
          type: 'image',
          src: srcMatch[1],
          alt: altMatch ? altMatch[1] : 'Ilustrasi Artikel',
          cost: 220
        });
      }
      continue;
    }

    const tag = (match[1] || 'p').toLowerCase();
    const innerRaw = (match[2] || '').trim();
    if (!innerRaw) continue;

    // Pertahankan tag format teks tebal/miring/garis bawah (strong, b, em, i, u) di dalam kalimat
    const cleanInlineHtml = innerRaw
      .replace(/<(?!\/?(?:strong|b|em|i|u)\b)[^>]+>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const plainText = stripHtml(cleanInlineHtml).replace(/\s+/g, ' ').trim();
    if (!plainText) continue;

    const isHeadingTag = /^h[1-6]$/.test(tag);
    const isStandaloneBold =
      plainText.length <= 120 &&
      /^<(strong|b)\b[^>]*>[\s\S]+<\/\1>$/i.test(cleanInlineHtml) &&
      !/<\/(strong|b)>\s*\S+/i.test(cleanInlineHtml.replace(/<\/(strong|b)>$/i, ''));

    if (isHeadingTag || isStandaloneBold) {
      allArticleBlocks.push({
        type: 'heading',
        text: plainText,
        html: plainText,
        cost: Math.max(plainText.length, 70)
      });
    } else {
      allArticleBlocks.push({
        type: 'paragraph',
        text: plainText,
        html: cleanInlineHtml,
        cost: plainText.length
      });
    }
  }

  // Ambil paragraf/blok secara berurutan dengan kapasitas dinamis (Auto-Fit Full A4 210x297mm)
  const hasCover = Boolean(post.coverUrl);
  const maxCharCapacity = fitCharLimit || (hasCover ? 3450 : 4450);
  const printBlocks = [];
  let accumulatedCost = 0;

  for (let i = 0; i < allArticleBlocks.length; i++) {
    const blk = allArticleBlocks[i];
    if (accumulatedCost + blk.cost <= maxCharCapacity) {
      printBlocks.push(blk);
      accumulatedCost += blk.cost;
    } else if (blk.type === 'paragraph') {
      const remaining = maxCharCapacity - accumulatedCost;
      if (remaining > 60) {
        let cut = blk.text.substring(0, remaining);
        const lastPeriod = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
        if (lastPeriod > remaining - 95 && lastPeriod > 40) {
          cut = cut.substring(0, lastPeriod + 1);
        } else {
          const lastSpace = cut.lastIndexOf(' ');
          if (lastSpace > 30) cut = cut.substring(0, lastSpace);
          cut = cut.replace(/[.,;:\s]+$/, '') + '...';
        }
        printBlocks.push({
          type: 'paragraph',
          text: cut,
          html: cut,
          cost: cut.length
        });
      }
      break;
    } else {
      break;
    }
  }

  // Jika blok terakhir kebetulan subjudul menggantung tanpa paragraf di bawahnya, lepaskan subjudul tersebut
  if (printBlocks.length > 1 && printBlocks[printBlocks.length - 1].type === 'heading') {
    printBlocks.pop();
  }

  // Indeks paragraf pertama untuk penempatan Dateline (MALANG —) atau Drop Cap
  const firstParagraphIdx = printBlocks.findIndex(b => b.type === 'paragraph');

  // Ukuran font & kolom koran menyesuaikan panjang isi agar memenuhi 1 halaman Full A4 (210mm x 297mm)
  const totalArticlePlainLen = stripHtml(post.content || '').length;
  const printFontSize = `${fitFontPt}pt`;
  const printLineHeight = fitFontPt > 9.2 ? '1.5' : '1.4';
  const printCols = totalArticlePlainLen < 1400 ? 2 : 3;

  // Footer contact data from Admin Settings
  const footerPhone = settings.phone || '+62 851-8563-9375';
  const footerEmail = settings.email || 'official.mahatma.id@gmail.com';
  const footerIg = formatInstagramDisplay(settings.instagram);

  // Recommendations
  const relatedPosts = latestPosts.filter(p => !p.isDraft && p.id !== id && getCategorySlug(p.category) === categorySlug).slice(0, 3);
  const validPopular = popularPosts.filter(p => !p.isDraft && p.id !== id).slice(0, 5);
  const inlineBacaJuga = latestPosts.filter(p => !p.isDraft && p.id !== id).slice(0, 2);

  // Current page share link (Canonical for QR & Social)
  const canonicalArticleUrl = `https://mahatma.id/insight/${categorySlug}/${id}`;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : canonicalArticleUrl;
  const shareTitle = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(currentUrl);

  // Font size styling for web view
  const fontSizeClasses = {
    0: 'prose-sm text-[0.95rem] leading-[1.75]',
    1: 'prose-base text-[1.075rem] leading-[1.85]',
    2: 'prose-lg text-[1.2rem] leading-[1.95]'
  };

  // Reusable Full A4 Newspaper Sheet Component (210mm x 297mm Penuh untuk Preview, JPG, & PDF)
  const renderNewspaperA4Sheet = (isPreview = false) => (
    <div
      ref={isPreview ? newspaperPreviewRef : newspaperPrintRef}
      className={`newspaper-a4-sheet bg-white text-slate-900 flex flex-col justify-between box-border ${
        isPreview
          ? 'w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[9mm_11mm] shadow-2xl border border-slate-300 mx-auto overflow-hidden'
          : 'w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[9mm_11mm] overflow-hidden'
      }`}
    >
      {/* TOP SECTION: MASTHEAD + HEADLINE + HERO + BODY */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        
        {/* 1. MASTHEAD KORAN / MAJALAH MAHATMA */}
        <header className="border-b-[2.5px] border-slate-900 pb-2 mb-2.5 shrink-0">
          {/* Top thin decorative line */}
          <div className="flex items-center justify-between text-[7pt] font-sans font-extrabold uppercase tracking-[0.18em] text-slate-500 border-b border-slate-300 pb-1 mb-2">
            <span>EDISI CETAK EKSEKUTIF</span>
            <span>BEYOND EXCELLENT, TOWARD SUSTAINABILITY</span>
            <span>WWW.MAHATMA.ID</span>
          </div>

          <div className="grid grid-cols-12 items-center gap-3">
            {/* Left: Official Logo */}
            <div className="col-span-3 flex items-center">
              <img
                src="/Logo Mode Terang.png"
                alt="Mahatma Academy"
                crossOrigin="anonymous"
                className="h-11 w-auto object-contain"
              />
            </div>

            {/* Center: Newspaper / Magazine Name */}
            <div className="col-span-6 text-center border-x border-slate-300 px-2">
              <div className="text-[20pt] font-black tracking-tight text-slate-950 leading-none uppercase">
                MAJALAH MAHATMA
              </div>
              <div className="text-[7pt] font-sans font-bold uppercase tracking-[0.22em] text-emerald-800 mt-1">
                KORAN &amp; JURNAL TRANSFORMASI PENDIDIKAN BERKELANJUTAN
              </div>
            </div>

            {/* Right: Edition & Category Box */}
            <div className="col-span-3 text-right font-sans">
              <span
                className={`inline-block px-2.5 py-0.5 text-[7.5pt] font-black uppercase tracking-widest text-white rounded-sm ${
                  isOpini ? 'bg-amber-700' : 'bg-emerald-800'
                }`}
              >
                RUBRIK: {isOpini ? 'KOLOM OPINI' : 'BERITA UTAMA'}
              </span>
              <div className="text-[7.5pt] font-bold text-slate-700 mt-1 uppercase leading-tight">
                {publishDate}
              </div>
              <div className="text-[6.5pt] text-slate-500 font-semibold">
                Waktu Baca: ~{readTime} Menit
              </div>
            </div>
          </div>
        </header>

        {/* 2. HEADLINE & BYLINE */}
        <div className="mb-2.5 shrink-0">
          <h1 className="text-[16.5pt] font-black text-slate-950 leading-[1.18] tracking-tight mb-2">
            {post.title}
          </h1>

          {/* Editorial Byline Strip */}
          <div className="flex items-center justify-between border-y border-slate-300 py-1.5 px-2 bg-slate-50 font-sans">
            <div className="flex items-center gap-2">
              {authorProfile?.img ? (
                <img
                  src={authorProfile.img}
                  alt={authorName}
                  crossOrigin="anonymous"
                  className="w-6 h-6 rounded-full object-cover border border-slate-400"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[7.5pt]">
                  {authorName.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-[7.5pt] leading-tight">
                <span className="font-bold text-slate-500 uppercase mr-1">OLEH:</span>
                <span className="font-black text-slate-900 uppercase">{authorName}</span>
              </div>
            </div>

            {isOpini ? (
              <div className="text-[6.5pt] text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded font-semibold italic max-w-[260px] text-right leading-tight">
                *Gagasan independen penulis.
              </div>
            ) : (
              <div className="text-[7pt] font-bold text-slate-500 uppercase tracking-wider">
                REDAKSI MAHATMA INSIGHT
              </div>
            )}
          </div>
        </div>

        {/* 3. HERO PHOTO (IF PRESENT) */}
        {post.coverUrl && (
          <figure className="mb-2.5 shrink-0">
            <div className="w-full h-[50mm] rounded-sm overflow-hidden border border-slate-300 bg-slate-100 relative">
              <img
                src={post.coverUrl}
                alt={post.title}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            </div>
            <figcaption className="flex justify-between items-center text-[6.5pt] font-sans text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
              <span>{post.coverCaption || 'ILUSTRASI / DOKUMENTASI UTAMA ARTIKEL'}</span>
              <span>FOTO: DOKUMENTASI MAHATMA ACADEMY</span>
            </figcaption>
          </figure>
        )}

        {/* 4. MULTI-COLUMN NEWSPAPER BODY + INLINE IMAGES + CORNER QR CODE */}
        <div
          data-newspaper-body-wrapper="true"
          className="flex-1 min-h-0 overflow-hidden relative"
        >
          <div
            data-newspaper-columns="true"
            style={{
              columnCount: printCols,
              columnGap: '15px',
              columnRule: '1px solid #cbd5e1',
              fontSize: printFontSize,
              lineHeight: printLineHeight,
              textAlign: 'justify',
            }}
            className="text-slate-800 overflow-hidden"
          >
            {printBlocks.map((block, idx) => {
              if (block.type === 'heading') {
                return (
                  <h3
                    key={idx}
                    className="font-sans font-black text-[9.5pt] text-slate-950 mt-2.5 mb-1 leading-snug tracking-tight"
                    style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
                  >
                    {block.text}
                  </h3>
                );
              }

              if (block.type === 'image') {
                return (
                  <figure
                    key={idx}
                    className="my-2 break-inside-avoid bg-slate-50 border border-slate-300 rounded-xs p-1"
                  >
                    <img
                      src={block.src}
                      alt={block.alt || 'Ilustrasi Artikel'}
                      crossOrigin="anonymous"
                      className="w-full max-h-[36mm] object-contain mx-auto block rounded-xs"
                    />
                    {block.alt && block.alt !== 'Ilustrasi Artikel' && (
                      <figcaption className="text-[6pt] font-sans text-slate-500 text-center mt-0.5 italic">
                        {block.alt}
                      </figcaption>
                    )}
                  </figure>
                );
              }

              const isFirstPara = idx === firstParagraphIdx;
              return (
                <p key={idx} className="mb-2">
                  {isFirstPara && post.dateline && (
                    <strong className="font-sans font-black uppercase tracking-wider text-slate-950 mr-1.5 text-[0.92em]">
                      {post.dateline} &mdash;
                    </strong>
                  )}
                  {isFirstPara && !post.dateline && block.text.length > 1 ? (
                    <>
                      <span className="float-left text-[24pt] font-black leading-[0.82] mr-1.5 mt-0.5 text-slate-950 font-serif">
                        {block.text.charAt(0)}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: block.html.slice(1) }} />
                    </>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: block.html }} />
                  )}
                </p>
              );
            })}

            {/* CALLOUT BACA SELENGKAPNYA & QR CODE BOX */}
            <div className="break-inside-avoid mt-2 pt-1">
              <div className="text-[7.8pt] font-sans font-extrabold text-emerald-800 italic mb-1.5">
                Selengkapnya di QR Code di bawah ini 👇
              </div>

              <div className="border-[1.5px] border-slate-900 bg-slate-50 p-2 rounded-sm flex items-center gap-2.5 font-sans shadow-2xs">
                <div className="shrink-0 bg-white p-0.5 rounded-xs border border-slate-200">
                  <QrCodeSvg value={canonicalArticleUrl} size={54} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-[6.8pt] font-black uppercase tracking-widest text-emerald-800 leading-none mb-0.5">
                    SCAN BACA ONLINE
                  </div>
                  <div className="text-[7.5pt] font-extrabold text-slate-900 leading-tight mb-0.5">
                    Versi Digital &amp; Artikel Lengkap
                  </div>
                  <div className="text-[6pt] text-slate-600 leading-tight break-all font-mono">
                    mahatma.id/insight/{categorySlug}/{id.substring(0, 28)}{id.length > 28 ? '...' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FOOTER KORAN / MAJALAH (RAPAT DI BAWAH TANPA SPACE KOSONG BERLEBIH) */}
      <footer className="border-t-[2px] border-slate-900 pt-2.5 mt-3.5 shrink-0 font-sans">
        <div className="flex items-center justify-between gap-2 text-[7.5pt] text-slate-800 font-bold">
          {/* WhatsApp */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[7pt] font-black">
              WA
            </span>
            <div>
              <span className="text-[6pt] text-slate-400 uppercase block leading-none font-extrabold">WhatsApp Resmi</span>
              <span className="text-slate-900 font-extrabold">{footerPhone}</span>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[7pt] font-black">
              ✉
            </span>
            <div>
              <span className="text-[6pt] text-slate-400 uppercase block leading-none font-extrabold">Email Redaksi</span>
              <span className="text-slate-900 font-extrabold">{footerEmail}</span>
            </div>
          </div>

          {/* Instagram */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-pink-700 text-white flex items-center justify-center text-[7pt] font-black">
              IG
            </span>
            <div>
              <span className="text-[6pt] text-slate-400 uppercase block leading-none font-extrabold">Instagram</span>
              <span className="text-slate-900 font-extrabold">{footerIg}</span>
            </div>
          </div>

          {/* Website & Copyright */}
          <div className="text-right">
            <span className="text-[6pt] text-slate-400 uppercase block leading-none font-extrabold">Portal Resmi</span>
            <span className="text-emerald-800 font-black">www.mahatma.id</span>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-800 dark:text-slate-200 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      
      {/* GLOBAL ARTICLE & 1-PAGE A4 NEWSPAPER PRINT STYLES */}
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

        /* STRICT 1-PAGE FULL A4 (210mm x 297mm) MAGAZINE / NEWSPAPER PRINT ENGINE */
        @page {
          size: 210mm 297mm;
          margin: 0mm !important;
        }
        @media print {
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .screen-only-wrapper,
          .print-preview-modal,
          .no-print {
            display: none !important;
          }
          .print-only-newspaper-container {
            position: static !important;
            left: 0 !important;
            top: 0 !important;
            opacity: 1 !important;
            z-index: auto !important;
            pointer-events: auto !important;
            display: block !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
          .newspaper-a4-sheet {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* DEDICATED 1-PAGE FULL A4 NEWSPAPER SHEET (ALWAYS MEASURED FOR AUTO-FIT & DIRECT PRINTING) */}
      <div className="print-only-newspaper-container fixed -left-[9999px] top-0 z-[-1] pointer-events-none opacity-0 print:static print:left-0 print:opacity-100 print:pointer-events-auto print:block">
        {renderNewspaperA4Sheet(false)}
      </div>

      {/* INTERACTIVE PRINT PREVIEW MODAL (KORAN / MAJALAH A4) */}
      {showPrintPreview && (
        <div className="print-preview-modal fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex flex-col overflow-hidden no-print">
          {/* Top Modal Toolbar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 text-white shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">📰</span>
              <div>
                <h3 className="text-sm font-black tracking-wide uppercase">
                  Pratinjau Edisi Cetak
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleDownloadJpg}
                disabled={isDownloadingJpg}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition"
              >
                <span>{isDownloadingJpg ? 'Memproses JPG...' : 'JPG'}</span>
              </button>
              <button
                onClick={handleTriggerPrint}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition"
              >
                <span>PDF</span>
              </button>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer transition"
              >
                ✕ Tutup
              </button>
            </div>
          </div>

          {/* Scrollable Preview Canvas */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start bg-slate-900/50">
            <div className="origin-top scale-[0.45] sm:scale-[0.65] md:scale-[0.85] lg:scale-100 transition-transform">
              {renderNewspaperA4Sheet(true)}
            </div>
          </div>
        </div>
      )}

      {/* NORMAL WEB VIEW WRAPPER (HIDDEN DURING PRINT) */}
      <div className="screen-only-wrapper flex flex-col min-h-screen print:hidden">
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

                {/* Reading Tools: Font Resizer & Print Magazine Button */}
                <div className="flex items-center gap-2 self-start sm:self-center no-print">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <button 
                      onClick={() => setFontSizeLevel(0)} 
                      className={`px-2 py-1 rounded cursor-pointer ${fontSizeLevel === 0 ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-60'}`}
                      title="Ukuran teks kecil"
                    >
                      A-
                    </button>
                    <button 
                      onClick={() => setFontSizeLevel(1)} 
                      className={`px-2 py-1 rounded cursor-pointer ${fontSizeLevel === 1 ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-60'}`}
                      title="Ukuran teks standar"
                    >
                      A
                    </button>
                    <button 
                      onClick={() => setFontSizeLevel(2)} 
                      className={`px-2 py-1 rounded cursor-pointer ${fontSizeLevel === 2 ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-60'}`}
                      title="Ukuran teks besar"
                    >
                      A+
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowPrintPreview(true)} 
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Cetak atau Unduh Edisi Koran/Majalah 1 Halaman A4"
                  >
                    <span>Edisi Cetak</span>
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

              {/* SHARE BAR (BOTTOM VIRALITY + PRINT BUTTON) */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 no-print">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Bagikan &amp; Unduh Artikel:
                </span>
                <div className="flex flex-wrap items-center gap-2">
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

                  {/* Copy Link Button */}
                  <button 
                    onClick={handleCopyLink} 
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>{copied ? '✓ Tersalin!' : '🔗 Salin Link'}</span>
                  </button>

                  {/* Newspaper Print / PDF Button */}
                  <button 
                    onClick={() => setShowPrintPreview(true)} 
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <span>📰 Unduh Koran A4</span>
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
    </div>
  );
}