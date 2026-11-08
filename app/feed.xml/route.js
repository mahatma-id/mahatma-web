import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCategorySlug, getExcerpt, stripHtml } from '@/lib/insight';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mahatma.id';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

export async function GET() {
  let posts = [];
  try {
    const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30)));
    posts = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => !p.isDraft);
  } catch (err) {
    console.error('Error generating RSS feed:', err);
  }

  const itemsXml = posts.map(post => {
    const catSlug = getCategorySlug(post.category);
    const link = `${SITE_URL}/insight/${catSlug}/${post.id}`;
    const pubDate = post.createdAt?.toDate 
      ? post.createdAt.toDate().toUTCString() 
      : new Date().toUTCString();
    const description = post.excerpt || getExcerpt(post.content, 250);
    const author = post.author || 'Tim Redaksi Mahatma';
    const category = catSlug === 'opini' ? 'Opini' : 'Berita';
    const coverUrl = post.coverUrl || `${SITE_URL}/Logo%20Mode%20Terang.png`;

    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(category)}</category>
      <dc:creator>${escapeXml(author)}</dc:creator>
      <pubDate>${pubDate}</pubDate>
      <media:content url="${escapeXml(coverUrl)}" medium="image" />
    </item>`;
  }).join('');

  const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/" 
  xmlns:dc="http://purl.org/dc/elements/1.1/" 
  xmlns:atom="http://www.w3.org/2005/Atom" 
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Mahatma Insight - Berita &amp; Opini Pendidikan Berkelanjutan</title>
    <link>${SITE_URL}/insight</link>
    <description>Wawasan strategis, pembaruan kabar resmi, dan analisis kritis dari para akademisi serta praktisi Mahatma Academy.</description>
    <language>id-ID</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(feedXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
