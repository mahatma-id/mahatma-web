import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getOptimizedOgImageUrl, getExcerpt } from '@/lib/insight';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const post = docSnap.data();
      const plainDesc = post.excerpt || getExcerpt(post.content, 155) || 'Wawasan dan perspektif terbaru dari pakar kami.';
      const ogImageLarge = getOptimizedOgImageUrl(post.coverUrl, 1200, 630, 75);
      const ogImageCompact = getOptimizedOgImageUrl(post.coverUrl, 600, 315, 75);

      return {
        title: `${post.title} | MAHATMA ACADEMY`,
        description: plainDesc,
        openGraph: {
          title: post.title,
          description: plainDesc,
          siteName: 'MAHATMA ACADEMY',
          images: [
            {
              url: ogImageLarge,
              secureUrl: ogImageLarge,
              width: 1200,
              height: 630,
              type: 'image/jpeg',
              alt: post.title,
            },
            {
              url: ogImageCompact,
              secureUrl: ogImageCompact,
              width: 600,
              height: 315,
              type: 'image/jpeg',
              alt: post.title,
            },
          ],
          type: 'article',
        },
        twitter: {
          card: 'summary_large_image',
          title: post.title,
          description: plainDesc,
          images: [ogImageLarge],
        },
      };
    }
  } catch (error) {
    console.error("Error SEO Metadata:", error);
  }

  return {
    title: 'Insight | MAHATMA ACADEMY',
  };
}

export default function BeritaLayout({ children }) {
  return <>{children}</>;
}
