import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCategorySlug, getCategoryLabel, getExcerpt, getOptimizedOgImageUrl } from '@/lib/insight';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mahatma.id';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const rawCat = resolvedParams.category || 'berita';
  const categorySlug = getCategorySlug(rawCat);
  const id = resolvedParams.id;

  try {
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const post = docSnap.data();
      const actualCategory = getCategorySlug(post.category || categorySlug);
      const categoryLabel = getCategoryLabel(actualCategory);
      const title = `${post.title} | Mahatma Academy`;
      const plainDesc = post.excerpt || getExcerpt(post.content, 155) || 'Wawasan dan pemikiran strategis dari Mahatma Academy.';
      
      // Optimasi gambar ke JPG < 120KB agar 100% muncul di WhatsApp, Facebook, X, & LinkedIn
      const ogImageLarge = getOptimizedOgImageUrl(post.coverUrl, 1200, 630, 75);
      const ogImageCompact = getOptimizedOgImageUrl(post.coverUrl, 600, 315, 75);
      const canonicalUrl = `${SITE_URL}/insight/${actualCategory}/${id}`;

      let publishedTime = undefined;
      let modifiedTime = undefined;
      if (post.createdAt && typeof post.createdAt.toDate === 'function') {
        publishedTime = post.createdAt.toDate().toISOString();
        modifiedTime = publishedTime;
      }
      if (post.updatedAt && typeof post.updatedAt.toDate === 'function') {
        modifiedTime = post.updatedAt.toDate().toISOString();
      }

      return {
        title,
        description: plainDesc,
        keywords: post.tags ? post.tags.split(',').map(t => t.trim()) : ['mahatma academy', categoryLabel, 'pendidikan berkelanjutan'],
        authors: [{ name: post.author || 'Tim Redaksi' }],
        creator: post.author || 'Tim Redaksi',
        publisher: 'Mahatma Academy',
        alternates: {
          canonical: canonicalUrl,
        },
        robots: {
          index: !post.isDraft,
          follow: !post.isDraft,
          googleBot: {
            index: !post.isDraft,
            follow: !post.isDraft,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
        openGraph: {
          title: post.title,
          description: plainDesc,
          url: canonicalUrl,
          siteName: 'Mahatma Academy',
          locale: 'id_ID',
          type: 'article',
          publishedTime,
          modifiedTime,
          authors: [post.author || 'Tim Redaksi'],
          section: categoryLabel,
          tags: post.tags ? post.tags.split(',').map(t => t.trim()) : undefined,
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
        },
        twitter: {
          card: 'summary_large_image',
          title: post.title,
          description: plainDesc,
          site: '@mahatma_academy',
          creator: '@mahatma_academy',
          images: [ogImageLarge],
        },
      };
    }
  } catch (error) {
    console.error("Error SEO Metadata:", error);
  }

  return {
    title: 'Mahatma Insight | Mahatma Academy',
    description: 'Wawasan, berita resmi, dan kolom opini dari Mahatma Academy.',
  };
}

export default async function InsightArticleLayout({ children, params }) {
  const resolvedParams = await params;
  const rawCat = resolvedParams.category || 'berita';
  const categorySlug = getCategorySlug(rawCat);
  const id = resolvedParams.id;

  let jsonLd = null;
  try {
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const post = docSnap.data();
      const actualCat = getCategorySlug(post.category || categorySlug);
      const isOpini = actualCat === 'opini';
      const canonicalUrl = `${SITE_URL}/insight/${actualCat}/${id}`;
      const description = post.excerpt || getExcerpt(post.content, 180);
      
      // Standar Google News: Sediakan rasio 16:9, 4:3, dan 1:1 minimal lebar 1200px
      const img16x9 = getOptimizedOgImageUrl(post.coverUrl, 1200, 675, 82);
      const img4x3 = getOptimizedOgImageUrl(post.coverUrl, 1200, 900, 82);
      const img1x1 = getOptimizedOgImageUrl(post.coverUrl, 1200, 1200, 82);

      const datePublished = (post.createdAt && typeof post.createdAt.toDate === 'function')
        ? post.createdAt.toDate().toISOString()
        : new Date().toISOString();
      const dateModified = (post.updatedAt && typeof post.updatedAt.toDate === 'function')
        ? post.updatedAt.toDate().toISOString()
        : datePublished;

      // Google News & Google Search Schema
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': isOpini ? 'OpinionNewsArticle' : 'NewsArticle',
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        headline: post.title,
        description: description,
        image: [img16x9, img4x3, img1x1],
        datePublished: datePublished,
        dateModified: dateModified,
        inLanguage: 'id-ID',
        articleSection: isOpini ? 'Opini' : 'Berita',
        keywords: post.tags || 'pendidikan berkelanjutan, mahatma academy',
        author: [
          {
            '@type': 'Person',
            name: post.author || 'Tim Redaksi',
            jobTitle: isOpini ? 'Kolumnis / Penulis Opini' : 'Jurnalis / Redaksi',
            url: `${SITE_URL}/tim`,
          },
        ],
        publisher: {
          '@type': 'NewsMediaOrganization',
          name: 'Mahatma Academy',
          url: SITE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/icon.png`,
            width: 512,
            height: 512,
          },
        },
      };
    }
  } catch (err) {
    console.error("Error creating JSON-LD schema:", err);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
