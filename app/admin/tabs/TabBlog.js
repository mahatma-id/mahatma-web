"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, deleteItem } from '../utils';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function TabBlog() {
    const [posts, setPosts] = useState([]);
    const [editPostId, setEditPostId] = useState(null);
    const [postTitle, setPostTitle] = useState('');
    const [postContent, setPostContent] = useState('');
    const [postCategory, setPostCategory] = useState('News');
    const [postCoverUrl, setPostCoverUrl] = useState('');
    const [postDateline, setPostDateline] = useState('');
    const [postAuthor, setPostAuthor] = useState('');
    const [postTags, setPostTags] = useState('');
    const [isDraft, setIsDraft] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const quillRef = useRef(null);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), snap => setPosts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, []);

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file'); input.setAttribute('accept', 'image/*'); input.click();
        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                setLoading(true);
                try {
                    const url = await uploadToCloudinary(file);
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', url);
                    quill.setSelection(range.index + 1);
                } catch (error) { alert("Gagal mengunggah gambar ke dalam teks."); }
                setLoading(false);
            }
        };
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [[{ 'header': [2, 3, false] }], ['bold', 'italic', 'underline', 'strike', 'blockquote'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link', 'image'], ['clean']],
            handlers: { image: imageHandler }
        }
    }), []);

    const cancelEditPost = () => { setEditPostId(null); setPostTitle(''); setPostContent(''); setPostCoverUrl(''); setPostDateline(''); setPostAuthor(''); setPostTags(''); setIsDraft(false); };
    const handleEditPost = (post) => { setEditPostId(post.id); setPostTitle(post.title); setPostCategory(post.category); setPostContent(post.content); setPostCoverUrl(post.coverUrl || ''); setPostDateline(post.dateline || ''); setPostAuthor(post.author || ''); setPostTags(post.tags || ''); setIsDraft(post.isDraft || false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    
    const savePost = async (e) => { 
        e.preventDefault(); setLoading(true); 
        try { 
            if (editPostId) { 
                await updateDoc(doc(db, "posts", editPostId), { title: postTitle, category: postCategory, content: postContent, coverUrl: postCoverUrl, dateline: postDateline, author: postAuthor || 'Tim Redaksi', tags: postTags, isDraft: isDraft }); 
                alert('Diperbarui!'); 
            } else { 
                let slug = postTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''); 
                if (!slug) slug = 'berita-' + Date.now(); 
                const docSnap = await getDoc(doc(db, "posts", slug)); 
                if (docSnap.exists()) slug = slug + '-' + Math.floor(Math.random() * 1000); 
                await setDoc(doc(db, "posts", slug), { title: postTitle, category: postCategory, content: postContent, coverUrl: postCoverUrl, dateline: postDateline, author: postAuthor || 'Tim Redaksi', tags: postTags, views: 0, createdAt: serverTimestamp(), isDraft: isDraft }); 
                alert('Diterbitkan!'); 
            } 
            cancelEditPost(); 
        } catch(err) { alert(err.message); } 
        setLoading(false); 
    };

    return (
        <div className="max-w-5xl">
            <form onSubmit={savePost} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                {editPostId && (
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between items-center border border-orange-200">
                        <span>Sedang Mengedit Artikel</span>
                        <button type="button" onClick={cancelEditPost} className="bg-white px-3 py-1 rounded text-orange-600 border border-orange-200 hover:bg-orange-50">Batal Edit</button>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Judul Artikel</label>
                        <input type="text" value={postTitle} onChange={e=>setPostTitle(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg font-bold text-sm" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                        <select value={postCategory} onChange={e=>setPostCategory(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm bg-slate-50" required>
                            <option value="News">Berita & Informasi (News)</option>
                            <option value="Promo">Promo / Penawaran (Promo)</option>
                            <option value="Opini">Opini & (Opini)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Lokasi/Nama Penerbit Berita (Opsional)</label>
                        <input type="text" value={postDateline} onChange={e=>setPostDateline(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Penulis</label>
                        <input type="text" value={postAuthor} onChange={e=>setPostAuthor(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Tag (Pisahkan dengan koma)</label>
                        <input type="text" value={postTags} onChange={e=>setPostTags(e.target.value)} className="w-full border p-2.5 md:p-3 rounded-lg text-sm" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">Upload Gambar Cover</label>
                        <input type="file" onChange={async (e) => {
                            if(e.target.files[0]) {
                                setLoading(true);
                                try { const url = await uploadToCloudinary(e.target.files[0]); setPostCoverUrl(url); } 
                                catch(err) { alert(err.message); } setLoading(false);
                            }
                        }} accept="image/*" className="w-full border p-2.5 md:p-3 rounded-lg bg-slate-50 text-xs md:text-sm" />
                        {postCoverUrl && <img src={postCoverUrl} className="h-32 mt-2 rounded-lg object-cover border" alt="Cover" />}
                    </div>
                </div>
                <div className="mt-4">
                    <label className="text-xs font-bold text-slate-700 block mb-2">Isi Konten Artikel</label>
                    <div className="bg-white">
                        <ReactQuill ref={quillRef} theme="snow" value={postContent} onChange={setPostContent} modules={modules} className="h-64 mb-12" />
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-6 border-t pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={isDraft} onChange={e=>setIsDraft(e.target.checked)} className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-bold text-slate-700">Simpan sebagai Draf</span>
                    </label>
                    <button disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold text-sm ml-auto">
                        {loading ? 'Memproses...' : (editPostId ? 'Perbarui Artikel' : 'Terbitkan Artikel')}
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map(post => (
                    <div key={post.id} className="bg-white rounded-xl border overflow-hidden shadow-sm flex flex-col">
                        {post.coverUrl && <img src={post.coverUrl} className="w-full h-32 object-cover border-b" alt={post.title} />}
                        <div className="p-4 flex flex-col flex-1">
                            <div className="flex gap-2 mb-2">
                                <span className="text-[9px] font-bold uppercase bg-slate-100 px-2 py-1 rounded text-slate-600">{post.category}</span>
                                {post.isDraft && <span className="text-[9px] font-bold uppercase bg-orange-100 px-2 py-1 rounded text-orange-600">DRAF</span>}
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 mb-1 leading-tight">{post.title}</h4>
                            <p className="text-[10px] text-slate-500 mb-4">{post.dateline || 'Tanpa Tanggal'}</p>
                            <div className="flex gap-2 mt-auto border-t pt-3">
                                <button onClick={() => handleEditPost(post)} className="flex-1 text-indigo-600 text-[10px] font-bold py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded">Edit</button>
                                <button onClick={()=>deleteItem('posts', post.id)} className="flex-1 text-red-500 text-[10px] font-bold py-1.5 bg-red-50 hover:bg-red-100 rounded">Hapus</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}