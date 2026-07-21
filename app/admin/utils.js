import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Fungsi Upload Gambar ke Cloudinary
export const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET); 
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; 

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || "Gagal upload file");
};

// Fungsi Global untuk Menghapus Data
export const deleteItem = async (col, id) => {
    if(confirm(`Hapus data ini permanen?`)) {
        await deleteDoc(doc(db, col, id));
    }
};