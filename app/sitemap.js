import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCategorySlug } from '@/lib/insight';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mahatma.id';

export default async function sitemap() {
  const staticPages = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/insight`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/insight/berita`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/insight/opini`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/tentang-kami`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/tim`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/produk`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/mitra-kerja`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  let postPages = [];
  try {
    const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));
    postPages = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => !p.isDraft)
      .map(post => {
        const catSlug = getCategorySlug(post.category);
        const lastMod = post.updatedAt?.toDate 
          ? post.updatedAt.toDate() 
          : (post.createdAt?.toDate ? post.createdAt.toDate() : new Date());

        return {
          url: `${SITE_URL}/insight/${catSlug}/${post.id}`,
          lastModified: lastMod,
          changeFrequency: 'daily',
          priority: 0.85,
        };
      });
  } catch (err) {
    console.error('Error fetching posts for sitemap:', err);
  }

  return [...staticPages, ...postPages];
}
