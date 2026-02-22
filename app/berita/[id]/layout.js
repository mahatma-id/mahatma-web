import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// FITUR INI KHUSUS UNTUK MEMBERIKAN PREVIEW KE WHATSAPP, FB, DLL (SEO & OPEN GRAPH)
export async function generateMetadata({ params }) {
  // Tunggu ID berita dari URL
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    // Ambil data berita dari Firebase khusus untuk robot Sosmed
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const post = docSnap.data();
      
      // Bersihkan teks dari tag HTML (<p>, <strong>, dll) untuk dijadikan deskripsi singkat
      const plainDesc = post.content ? post.content.replace(/<[^>]+>/g, '').substring(0, 120) + '...' : 'Wawasan dan perspektif terbaru dari pakar kami.';

      return {
        title: `${post.title} | MAHATMA ACADEMY`,
        description: plainDesc,
        openGraph: {
          title: post.title,
          description: plainDesc,
          siteName: 'MAHATMA ACADEMY',
          images: [
            {
              url: post.coverUrl || 'https://placehold.co/1200x630/ea580c/white?text=Mahatma+Academy', // Gambar Sampul Utama
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ],
          type: 'article',
        },
        twitter: {
          card: 'summary_large_image',
          title: post.title,
          description: plainDesc,
          images: [post.coverUrl || 'https://placehold.co/1200x630/ea580c/white?text=Mahatma+Academy'],
        },
      };
    }
  } catch (error) {
    console.error("Error SEO Metadata:", error);
  }

  // Fallback jika berita tidak ditemukan
  return {
    title: 'Berita | MAHATMA ACADEMY',
  };
}

export default function BeritaLayout({ children }) {
  // Layout ini hanya meneruskan tampilan dari page.js
  return <>{children}</>;
}