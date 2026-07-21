"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadToCloudinary, deleteItem } from '../utils';

export default function TabProducts() {
    const [products, setProducts] = useState([]);
    const [editProductId, setEditProductId] = useState(null);
    const [productName, setProductName] = useState('');
    const [productLabel, setProductLabel] = useState('');
    const [productDesc, setProductDesc] = useState('');
    const [productBtnText, setProductBtnText] = useState('');
    const [productBtnLink, setProductBtnLink] = useState('');
    const [productImgFile, setProductImgFile] = useState(null);
    const [productImgUrl, setProductImgUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), snap => setProducts(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsub();
    }, []);

    const cancelEditProduct = () => { setEditProductId(null); setProductName(''); setProductLabel(''); setProductDesc(''); setProductBtnText(''); setProductBtnLink(''); setProductImgUrl(''); setProductImgFile(null); };
    const handleEditProduct = (p) => { setEditProductId(p.id); setProductName(p.name||''); setProductLabel(p.label||''); setProductDesc(p.desc||''); setProductBtnText(p.btnText||''); setProductBtnLink(p.btnLink||''); setProductImgUrl(p.imgUrl||''); setProductImgFile(null); window.scrollTo({top:0, behavior:'smooth'}); };
    
    const saveProduct = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            let finalImg = productImgUrl;
            if (productImgFile) finalImg = await uploadToCloudinary(productImgFile);
            const data = { name: productName, label: productLabel, desc: productDesc, btnText: productBtnText, btnLink: productBtnLink, imgUrl: finalImg };
            if (editProductId) await updateDoc(doc(db, "products", editProductId), data);
            else await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
            alert('Berhasil!'); cancelEditProduct();
        } catch(err) { alert(err.message); }
        setLoading(false);
    };

    return (
        <div className="max-w-5xl">
            <form onSubmit={saveProduct} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm space-y-4 border mb-8">
                {editProductId && <div className="bg-orange-100 text-orange-800 p-3 rounded-lg text-xs font-bold flex justify-between"><button type="button" onClick={cancelEditProduct}>Batal Edit</button></div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold block mb-1">Gambar Cover</label>
                        <input type="file" onChange={e=>setProductImgFile(e.target.files[0])} accept="image/*" className="w-full border p-2 rounded text-xs" />
                        {productImgUrl && !productImgFile && <img src={productImgUrl} className="h-32 mt-2 rounded-lg object-cover" alt="Current" />}
                    </div>
                    <input type="text" placeholder="Nama Produk" value={productName} onChange={e=>setProductName(e.target.value)} className="border p-2.5 rounded-lg text-sm" required/>
                    <input type="text" placeholder="Kategori Label" value={productLabel} onChange={e=>setProductLabel(e.target.value)} className="border p-2.5 rounded-lg text-sm" />
                    <textarea placeholder="Deskripsi Singkat" value={productDesc} onChange={e=>setProductDesc(e.target.value)} className="col-span-1 md:col-span-2 border p-2.5 rounded-lg text-sm" required></textarea>
                    <input type="text" placeholder="Teks Tombol Aksi" value={productBtnText} onChange={e=>setProductBtnText(e.target.value)} className="border p-2.5 rounded-lg text-sm" />
                    <input type="text" placeholder="Link Tujuan Tombol" value={productBtnLink} onChange={e=>setProductBtnLink(e.target.value)} className="border p-2.5 rounded-lg text-sm" />
                </div>
                <button disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm">Simpan</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border flex gap-4">
                        <img src={p.imgUrl} className="w-24 h-24 object-cover rounded-lg" />
                        <div className="flex-1 flex flex-col">
                            <h4 className="font-bold text-sm">{p.name}</h4>
                            <p className="text-xs text-slate-500 flex-1">{p.desc}</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditProduct(p)} className="flex-1 text-indigo-600 text-[10px] font-bold py-1 bg-indigo-50 rounded">Edit</button>
                                <button onClick={()=>deleteItem('products', p.id)} className="flex-1 text-red-500 text-[10px] font-bold py-1 bg-red-50 rounded">Hapus</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}