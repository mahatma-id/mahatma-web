"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { collection, serverTimestamp, query, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, deleteItem } from '../utils';
import { getCategorySlug, getExcerpt, estimateReadingTime } from '@/lib/insight';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function TabBlog() {
    const [posts, setPosts] = useState([]);
    const [teams, setTeams] = useState([]);
    const [activeSubTab, setActiveSubTab] = useState('editor'); // 'editor', 'preview', 'list'
    const [filterCategory, setFilterCategory] = useState('Semua');
    const [searchFilter, setSearchFilter] = useState('');

    // Form fields
    const [editPostId, setEditPostId] = useState(null);
    const [postTitle, setPostTitle] = useState('');
    const [postSlug, setPostSlug] = useState('');
    const [postCategory, setPostCategory] = useState('Berita'); // 'Berita' | 'Opini'
    const [postExcerpt, setPostExcerpt] = useState('');
    const [postContent, setPostContent] = useState('');
    const [postCoverUrl, setPostCoverUrl] = useState('');
    const [postCoverCaption, setPostCoverCaption] = useState('');
    const [postDateline, setPostDateline] = useState('JAKARTA');
    const [postAuthor, setPostAuthor] = useState('');
    const [postTags, setPostTags] = useState('');
    const [isDraft, setIsDraft] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const quillRef = useRef(null);

    // Fetch posts and teams
    useEffect(() => {
        const unsubPosts = onSnapshot(
            query(collection(db, "posts"), orderBy("createdAt", "desc")),
            snap => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubTeams = onSnapshot(
            query(collection(db, "teams")),
            snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        return () => {
            unsubPosts();
            unsubTeams();
        };
    }, []);

    // Generate slug automatically when title changes (if not manual edit)
    useEffect(() => {
        if (!editPostId) {
            const cleanSlug = postTitle
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setPostSlug(cleanSlug);
        }
    }, [postTitle, editPostId]);

    // Live word and char counter
    const plainText = useMemo(() => {
        if (!postContent) return '';
        return postContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }, [postContent]);

    const wordCount = useMemo(() => {
        return plainText ? plainText.split(/\s+/).length : 0;
    }, [plainText]);

    const charCount = plainText.length;
    const estReadTime = Math.max(1, Math.ceil(wordCount / 200));

    // Image upload handler for inline editor
    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                setUploadingImage(true);
                try {
                    const url = await uploadToCloudinary(file);
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', url);
                    quill.setSelection(range.index + 1);
                } catch (error) {
                    alert("Gagal mengunggah gambar ke dalam teks: " + error.message);
                } finally {
                    setUploadingImage(false);
                }
            }
        };
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: { image: imageHandler }
        }
    }), []);

    const cancelEditPost = () => {
        setEditPostId(null);
        setPostTitle('');
        setPostSlug('');
        setPostCategory('Berita');
        setPostExcerpt('');
        setPostContent('');
        setPostCoverUrl('');
        setPostCoverCaption('');
        setPostDateline('JAKARTA');
        setPostAuthor('');
        setPostTags('');
        setIsDraft(false);
    };

    const handleEditPost = (post) => {
        setEditPostId(post.id);
        setPostTitle(post.title || '');
        setPostSlug(post.id);
        const catSlug = getCategorySlug(post.category);
        setPostCategory(catSlug === 'opini' ? 'Opini' : 'Berita');
        setPostExcerpt(post.excerpt || '');
        setPostContent(post.content || '');
        setPostCoverUrl(post.coverUrl || '');
        setPostCoverCaption(post.coverCaption || '');
        setPostDateline(post.dateline || '');
        setPostAuthor(post.author || '');
        setPostTags(post.tags || '');
        setIsDraft(post.isDraft || false);
        setActiveSubTab('editor');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const savePost = async (e) => {
        e.preventDefault();
        if (!postTitle.trim()) {
            alert('Judul artikel wajib diisi!');
            return;
        }

        setLoading(true);
        try {
            const categorySlug = getCategorySlug(postCategory);
            const categoryName = categorySlug === 'opini' ? 'Opini' : 'Berita';
            const author = postAuthor.trim() || 'Tim Redaksi Mahatma';
            const autoExcerpt = postExcerpt.trim() || getExcerpt(postContent, 160);

            const postData = {
                title: postTitle.trim(),
                category: categoryName,
                excerpt: autoExcerpt,
                content: postContent,
                coverUrl: postCoverUrl,
                coverCaption: postCoverCaption.trim(),
                dateline: postDateline.trim().toUpperCase(),
                author: author,
                tags: postTags.trim(),
                isDraft: isDraft,
                updatedAt: serverTimestamp(),
            };

            if (editPostId) {
                await updateDoc(doc(db, "posts", editPostId), postData);
                alert('Artikel berhasil diperbarui!');
            } else {
                let slug = postSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                if (!slug) slug = `${categorySlug}-${Date.now()}`;
                
                const docSnap = await getDoc(doc(db, "posts", slug));
                if (docSnap.exists()) {
                    slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
                }

                await setDoc(doc(db, "posts", slug), {
                    ...postData,
                    views: 0,
                    createdAt: serverTimestamp(),
                });
                alert('Artikel berhasil diterbitkan!');
            }

            cancelEditPost();
        } catch (err) {
            alert('Gagal menyimpan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter posts for list
    const filteredPosts = posts.filter(p => {
        const catSlug = getCategorySlug(p.category);
        const matchCategory = filterCategory === 'Semua' ? true :
            filterCategory === 'Berita' ? catSlug === 'berita' :
            filterCategory === 'Opini' ? catSlug === 'opini' :
            filterCategory === 'Draf' ? p.isDraft : true;
        const matchSearch = p.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
            p.tags?.toLowerCase().includes(searchFilter.toLowerCase()) ||
            p.author?.toLowerCase().includes(searchFilter.toLowerCase());
        return matchCategory && matchSearch;
    });

    const targetUrl = `https://mahatma.id/insight/${getCategorySlug(postCategory)}/${postSlug || 'judul-artikel'}`;

    return (
        <div className="max-w-6xl mx-auto pb-16">
            
            {/* SUB HEADER & NAVIGATION */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span>📰</span> Redaksi & Manajemen Insight
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Format resmi berita & opini standar Google News, SEO, serta sharelink WhatsApp.
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        type="button"
                        onClick={() => setActiveSubTab('editor')} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeSubTab === 'editor' 
                                ? 'bg-emerald-600 text-white shadow-sm' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <span>✍️</span> {editPostId ? 'Edit Artikel' : 'Tulis Artikel'}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveSubTab('preview')} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeSubTab === 'preview' 
                                ? 'bg-emerald-600 text-white shadow-sm' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <span>🔍</span> Simulator SEO & WA
                    </button>
                    <button 
                        type="button"
                        onClick={() => setActiveSubTab('list')} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeSubTab === 'list' 
                                ? 'bg-emerald-600 text-white shadow-sm' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <span>📋</span> Daftar ({posts.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: NEWSROOM EDITOR */}
            {activeSubTab === 'editor' && (
                <form onSubmit={savePost} className="space-y-6">
                    {editPostId && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-bold">
                                <span className="text-lg">✏️</span>
                                <span>Sedang Mengedit Artikel: <strong>{postTitle}</strong></span>
                            </div>
                            <button 
                                type="button" 
                                onClick={cancelEditPost}
                                className="px-3 py-1.5 bg-white text-amber-700 border border-amber-300 rounded-lg text-xs font-bold hover:bg-amber-100 transition"
                            >
                                Batal Edit
                            </button>
                        </div>
                    )}

                    <div className="bg-white p-5 md:p-8 rounded-3xl border shadow-sm space-y-6">
                        
                        {/* 1. KATEGORI & FORMAT BERITA */}
                        <div>
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                                1. Pilih Kategori Tulisan
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPostCategory('Berita')}
                                    className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 ${
                                        postCategory === 'Berita'
                                            ? 'border-emerald-500 bg-emerald-50/50'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <span className="text-2xl">📰</span>
                                    <div>
                                        <div className="font-extrabold text-sm text-slate-900">Berita (News)</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            Rilis pers resmi, kegiatan, kerja sama, dan peliputan event Mahatma.
                                        </div>
                                        <div className="text-[10px] text-emerald-700 font-bold mt-1.5 font-mono">
                                            mahatma.id/insight/berita/...
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPostCategory('Opini')}
                                    className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 ${
                                        postCategory === 'Opini'
                                            ? 'border-amber-500 bg-amber-50/50'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <span className="text-2xl">💡</span>
                                    <div>
                                        <div className="font-extrabold text-sm text-slate-900">Opini & Perspektif</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            Esai pemikiran, gagasan kritis ahli, dan sudut pandang transformatif.
                                        </div>
                                        <div className="text-[10px] text-amber-700 font-bold mt-1.5 font-mono">
                                            mahatma.id/insight/opini/...
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* 2. JUDUL ARTIKEL (HEADLINE) */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                    2. Judul Artikel (Headline)
                                </label>
                                <span className={`text-[11px] font-bold ${
                                    postTitle.length >= 50 && postTitle.length <= 70 ? 'text-emerald-600' : 'text-slate-400'
                                }`}>
                                    {postTitle.length} karakter (Rekomendasi Google: 50-70)
                                </span>
                            </div>
                            <input 
                                type="text" 
                                value={postTitle} 
                                onChange={e => setPostTitle(e.target.value)} 
                                placeholder="Tuliskan judul berita atau opini yang lugas, menarik, dan informatif..." 
                                className="w-full border-2 border-slate-200 p-3.5 rounded-2xl font-black text-base md:text-lg text-slate-900 focus:outline-none focus:border-emerald-500 transition" 
                                required
                            />
                        </div>

                        {/* 3. REDAKSI: DATELINE, PENULIS, TAGS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {/* Dateline Peliputan */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    Lokasi / Dateline Redaksi
                                </label>
                                <input 
                                    type="text" 
                                    value={postDateline} 
                                    onChange={e => setPostDateline(e.target.value)} 
                                    placeholder="Contoh: JAKARTA, YOGYAKARTA"
                                    className="w-full border p-2.5 rounded-xl text-xs font-bold uppercase tracking-wider" 
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Format standar berita (muncul di awal paragraf).
                                </span>
                            </div>

                            {/* Penulis / Kolumnis */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    Penulis / Kolumnis
                                </label>
                                <input 
                                    type="text" 
                                    value={postAuthor} 
                                    onChange={e => setPostAuthor(e.target.value)} 
                                    list="teamList"
                                    placeholder="Nama penulis atau Tim Redaksi"
                                    className="w-full border p-2.5 rounded-xl text-xs font-bold" 
                                />
                                <datalist id="teamList">
                                    <option value="Tim Redaksi Mahatma" />
                                    {teams.map(t => (
                                        <option key={t.id} value={t.name}>{t.role}</option>
                                    ))}
                                </datalist>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Bisa pilih dari tim atau ketik nama penulis tamu.
                                </span>
                            </div>

                            {/* Tags / Topik */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">
                                    Kata Kunci / Tag (Pisahkan Koma)
                                </label>
                                <input 
                                    type="text" 
                                    value={postTags} 
                                    onChange={e => setPostTags(e.target.value)} 
                                    placeholder="Contoh: AI, Kepemimpinan, Kurikulum"
                                    className="w-full border p-2.5 rounded-xl text-xs" 
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Membantu pengindeksan topik di Google Search.
                                </span>
                            </div>
                        </div>

                        {/* 4. GAMBAR COVER / THUMBNAIL (PENTING SHARELINK) */}
                        <div className="pt-2 border-t">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                                4. Gambar Cover / Thumbnail Berita (Wajib 16:9 untuk Sharelink WA & Google News)
                            </label>
                            <p className="text-[11px] text-slate-500 mb-3">
                                Gunakan gambar beresolusi tajam (disarankan 1200x675 piksel). Thumbnail ini yang otomatis tampil besar saat link dibagikan di WhatsApp, Twitter/X, dan Facebook.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-7">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={async (e) => {
                                            if (e.target.files[0]) {
                                                setLoading(true);
                                                try {
                                                    const url = await uploadToCloudinary(e.target.files[0]);
                                                    setPostCoverUrl(url);
                                                } catch (err) {
                                                    alert("Gagal upload gambar: " + err.message);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                        }}
                                        className="w-full border p-3 rounded-xl bg-slate-50 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                                    />

                                    <div className="mt-3">
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                            Keterangan & Sumber Foto (Caption / Credit):
                                        </label>
                                        <input 
                                            type="text" 
                                            value={postCoverCaption} 
                                            onChange={e => setPostCoverCaption(e.target.value)} 
                                            placeholder="Contoh: Dok. Humas Mahatma / Kegiatan Pelatihan Guru 2026"
                                            className="w-full border p-2 rounded-lg text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-5">
                                    {postCoverUrl ? (
                                        <div className="relative aspect-[16/9] rounded-xl overflow-hidden border shadow-sm group">
                                            <img src={postCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                            <button 
                                                type="button" 
                                                onClick={() => setPostCoverUrl('')}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition shadow"
                                                title="Hapus Cover"
                                            >
                                                ✕
                                            </button>
                                            <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded font-mono">
                                                Thumbnail 16:9 Aktif
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="aspect-[16/9] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                            <span className="text-2xl mb-1">🖼️</span>
                                            <span className="text-[11px] font-bold">Belum ada thumbnail</span>
                                            <span className="text-[9px]">Pilih file foto untuk upload</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 5. EDITOR TEKS REDAKSI DENGAN STATISTIK MENGETIK */}
                        <div className="pt-4 border-t">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                    5. Isi Konten Artikel
                                </label>
                                
                                {/* Real-time writing stats */}
                                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
                                    <span>📊 {wordCount} Paragraf</span>
                                    <span>•</span>
                                    <span>🔤 {charCount} Karakter</span>
                                    <span>•</span>
                                    <span>⏱️ {estReadTime} Menit Baca</span>
                                </div>
                            </div>

                            {uploadingImage && (
                                <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-2.5 rounded-lg mb-2 flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Mengunggah gambar ke dalam teks...</span>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl overflow-hidden border">
                                <ReactQuill 
                                    ref={quillRef} 
                                    theme="snow" 
                                    value={postContent} 
                                    onChange={setPostContent} 
                                    modules={modules} 
                                    placeholder="Ketik artikel berita atau opini di sini. Anda dapat menambahkan sub-judul (H2/H3), kutipan wawancara (blockquote), daftar poin, serta gambar peliputan..."
                                    className="min-h-[350px] mb-12" 
                                />
                            </div>
                        </div>

                        {/* 7. PUBLIKASI & STATUS */}
                        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 px-4 py-2.5 rounded-xl border self-start sm:self-center">
                                <input 
                                    type="checkbox" 
                                    checked={isDraft} 
                                    onChange={e => setIsDraft(e.target.checked)} 
                                    className="w-4 h-4 text-emerald-600 rounded" 
                                />
                                <div>
                                    <span className="text-xs font-bold text-slate-800 block">Simpan sebagai Draf</span>
                                    <span className="text-[10px] text-slate-400 block">Tidak akan tampil di halaman publik atau terindeks Google.</span>
                                </div>
                            </label>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button 
                                    type="button"
                                    onClick={() => setActiveSubTab('preview')}
                                    className="px-5 py-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition flex-1 sm:flex-initial"
                                >
                                    🔍 Pratinjau SEO
                                </button>

                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition shadow-md disabled:opacity-50 flex-1 sm:flex-initial flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🚀</span>
                                            <span>{editPostId ? 'Perbarui Artikel' : 'Terbitkan Sekarang'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                </form>
            )}

            {/* TAB 2: SEO & WHATSAPP SIMULATOR */}
            {activeSubTab === 'preview' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
                        <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <span>🌐</span> Simulator Tampilan di Google Search & Google Berita
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Ini adalah perkiraan tampilan cuplikan halaman ketika calon pembaca mencari topik ini di mesin pencari Google.
                            </p>
                        </div>

                        {/* GOOGLE DESKTOP SNIPPET */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 max-w-2xl font-sans shadow-sm">
                            <div className="flex items-center gap-2 mb-1 text-xs text-slate-600">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                                    <img src="/icon.png" alt="Favicon" className="w-4 h-4 object-contain" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-[12px] text-slate-800 leading-none">Mahatma Academy</span>
                                    <span className="text-[11px] text-slate-500 font-mono leading-none mt-0.5">
                                        https://mahatma.id &gt; insight &gt; {getCategorySlug(postCategory)} &gt; {postSlug || 'judul-artikel'}
                                    </span>
                                </div>
                            </div>
                            <h4 className="text-lg text-blue-700 hover:underline font-medium cursor-pointer leading-snug mt-1">
                                {postTitle || 'Judul Berita atau Opini Akan Tampil di Sini'} | MASE
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                <span className="text-slate-400 font-bold">{new Date().toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })} &mdash; </span>
                                {postExcerpt || getExcerpt(postContent, 160) || 'Ringkasan artikel berita dan pemikiran opini dari Mahatma Academy akan tampil di sini untuk memikat pembaca...'}
                            </p>
                        </div>

                        {/* SLUG URL CUSTOMIZER */}
                        <div className="pt-4 border-t">
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                                Kustomisasi URL Slug Artikel:
                            </label>
                            <div className="flex items-center rounded-xl border bg-slate-50 overflow-hidden text-xs">
                                <span className="px-3 py-2 text-slate-400 font-mono shrink-0">
                                    https://mahatma.id/insight/{getCategorySlug(postCategory)}/
                                </span>
                                <input 
                                    type="text" 
                                    value={postSlug} 
                                    onChange={e => setPostSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))} 
                                    placeholder="slug-artikel" 
                                    className="w-full bg-white p-2 font-mono font-bold text-slate-800 focus:outline-none" 
                                />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                                URL ini permanen dan ramah SEO Google.
                            </span>
                        </div>
                    </div>

                    {/* WHATSAPP SHARE CARD SIMULATOR */}
                    <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
                        <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <span>📱</span> Simulator Tampilan Kartu Sharelink WhatsApp
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Penampakan tautan saat dibagikan ke grup atau kontak WhatsApp pembaca.
                            </p>
                        </div>

                        <div className="bg-[#e5ddd5] p-6 rounded-2xl max-w-sm shadow-inner">
                            <div className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200">
                                <div className="aspect-[16/9] bg-slate-200 overflow-hidden relative">
                                    {postCoverUrl ? (
                                        <img src={postCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs font-bold p-4 text-center">
                                            Mahatma Academy Insight
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-slate-50 border-t">
                                    <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                                        MAHATMA.ID
                                    </div>
                                    <div className="font-bold text-xs text-slate-900 mt-0.5 line-clamp-2 leading-snug">
                                        {postTitle || 'Judul Berita / Opini'}
                                    </div>
                                    <div className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                                        {postExcerpt || getExcerpt(postContent, 100) || 'Deskripsi singkat cuplikan artikel...'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right text-[10px] text-slate-500 mt-1 font-mono">
                                10:45 ✓✓
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="button" 
                                onClick={() => setActiveSubTab('editor')}
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                            >
                                &larr; Kembali ke Editor Pengetikan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: POST LIST */}
            {activeSubTab === 'list' && (
                <div className="space-y-6">
                    {/* FILTER & SEARCH */}
                    <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                            {['Semua', 'Berita', 'Opini', 'Draf'].map(f => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFilterCategory(f)}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                                        filterCategory === f 
                                            ? 'bg-emerald-600 text-white' 
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <input 
                            type="text" 
                            placeholder="Cari judul atau tag..." 
                            value={searchFilter} 
                            onChange={e => setSearchFilter(e.target.value)} 
                            className="border p-2 rounded-xl text-xs w-full sm:w-64"
                        />
                    </div>

                    {/* POSTS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredPosts.map(post => {
                            const catSlug = getCategorySlug(post.category);
                            const isOpini = catSlug === 'opini';
                            const liveUrl = `/insight/${catSlug}/${post.id}`;
                            const dStr = post.createdAt ? post.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

                            return (
                                <div key={post.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
                                    <div className="relative aspect-[16/9] bg-slate-100 border-b">
                                        <img 
                                            src={post.coverUrl || 'https://placehold.co/600x400/0f172a/white?text=Mahatma+Insight'} 
                                            alt={post.title} 
                                            className="w-full h-full object-cover" 
                                        />
                                        <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-white ${
                                            isOpini ? 'bg-amber-600' : 'bg-emerald-600'
                                        }`}>
                                            {isOpini ? 'Opini' : 'Berita'}
                                        </span>
                                        {post.isDraft && (
                                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-widest">
                                                DRAF
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="text-[10px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
                                            <span>{dStr} • {post.author || 'Redaksi'}</span>
                                            <span>👁️ {post.views || 0}</span>
                                        </div>
                                        <h4 className="font-extrabold text-sm text-slate-900 mb-2 leading-snug line-clamp-2">
                                            {post.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                                            {post.excerpt || getExcerpt(post.content, 90)}
                                        </p>

                                        <div className="mt-auto pt-3 border-t flex items-center gap-2">
                                            <a 
                                                href={liveUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition flex items-center gap-1"
                                                title="Lihat Halaman Publik"
                                            >
                                                <span>👁️</span> Buka
                                            </a>
                                            <button 
                                                type="button" 
                                                onClick={() => handleEditPost(post)} 
                                                className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => deleteItem('posts', post.id)} 
                                                className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold transition"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredPosts.length === 0 && (
                        <div className="bg-white p-12 rounded-3xl border text-center text-slate-400">
                            <span className="text-4xl block mb-2">🔍</span>
                            <p className="text-sm font-bold">Tidak ada artikel ditemukan</p>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
