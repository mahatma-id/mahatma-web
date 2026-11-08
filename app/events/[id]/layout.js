import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOptimizedOgImageUrl } from '@/lib/insight';

// FITUR INI KHUSUS UNTUK MEMBERIKAN PREVIEW KE WHATSAPP, FB, DLL (SEO & OPEN GRAPH)
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);

    const generalSnap = await getDoc(doc(db, "settings", "general"));
    let fallbackLogo = 'https://mahatma.id/Logo%20Mahatma.png';
    if(generalSnap.exists() && generalSnap.data().logoUrl) {
       fallbackLogo = generalSnap.data().logoUrl;
    }

    if (docSnap.exists()) {
      const event = docSnap.data();
      const plainDesc = event.desc ? event.desc.substring(0, 155) + '...' : 'Ikuti event dan pelatihan terbaru dari Mahatma Academy.';
      const rawImage = event.imgUrl || fallbackLogo;
      const ogImageLarge = getOptimizedOgImageUrl(rawImage, 1200, 630, 75);
      const ogImageCompact = getOptimizedOgImageUrl(rawImage, 600, 315, 75);

      return {
        title: `${event.name} | MAHATMA ACADEMY`,
        description: plainDesc,
        openGraph: {
          title: event.name,
          description: plainDesc,
          siteName: 'MAHATMA ACADEMY',
          images: [
            {
              url: ogImageLarge,
              secureUrl: ogImageLarge,
              width: 1200,
              height: 630,
              type: 'image/jpeg',
              alt: event.name,
            },
            {
              url: ogImageCompact,
              secureUrl: ogImageCompact,
              width: 600,
              height: 315,
              type: 'image/jpeg',
              alt: event.name,
            },
          ],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: event.name,
          description: plainDesc,
          images: [ogImageLarge],
        },
      };
    }
  } catch (error) {
    console.error("Error SEO Metadata Event:", error);
  }

  return {
    title: 'Event | MAHATMA ACADEMY',
  };
}

export default function EventLayout({ children }) {
  return <>{children}</>;
}
