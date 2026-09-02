import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// FITUR INI KHUSUS UNTUK MEMBERIKAN PREVIEW KE WHATSAPP, FB, DLL (SEO & OPEN GRAPH)
export async function generateMetadata({ params }) {
  // Tunggu parameter ID (yang sekarang berupa SLUG, misal: pelatihan-ai-untuk-kuliah)
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    // Ambil data event dari Firebase berdasarkan SLUG
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);

    // Ambil data logo dari pengaturan umum (fallback jika event tidak ada banner)
    const generalSnap = await getDoc(doc(db, "settings", "general"));
    let fallbackLogo = 'https://mahatma.id/icon.png';
    if(generalSnap.exists() && generalSnap.data().logoUrl) {
       fallbackLogo = generalSnap.data().logoUrl;
    }

    if (docSnap.exists()) {
      const event = docSnap.data();
      
      // Bersihkan teks deskripsi untuk dijadikan ringkasan di WhatsApp (maks 120 huruf)
      const plainDesc = event.desc ? event.desc.substring(0, 120) + '...' : 'Ikuti event dan pelatihan terbaru dari Mahatma Academy.';

      // Prioritaskan gambar Event. Jika tidak ada, pakai logo Mahatma.
      const ogImage = event.imgUrl || fallbackLogo;

      return {
        title: `${event.name} | MAHATMA ACADEMY`,
        description: plainDesc,
        openGraph: {
          title: event.name,
          description: plainDesc,
          siteName: 'MAHATMA ACADEMY',
          images: [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: event.name,
            },
          ],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: event.name,
          description: plainDesc,
          images: [ogImage],
        },
      };
    }
  } catch (error) {
    console.error("Error SEO Metadata Event:", error);
  }

  // Fallback jika event tidak ditemukan (mencegah error bot WA)
  return {
    title: 'Event | MAHATMA ACADEMY',
  };
}

// Layout ini hanya membungkus dan merender page.js di dalamnya
export default function EventLayout({ children }) {
  return <>{children}</>;
}