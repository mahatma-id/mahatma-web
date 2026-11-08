/**
 * Utility functions for Mahatma Insight (Berita & Opini)
 */

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mahatma.id';

export function getCategorySlug(category) {
  if (!category) return 'berita';
  const c = category.toString().trim().toLowerCase();
  if (c === 'opini' || c.includes('opini') || c.includes('opinion')) {
    return 'opini';
  }
  return 'berita';
}

export function getCategoryLabel(categoryOrSlug) {
  const slug = getCategorySlug(categoryOrSlug);
  return slug === 'opini' ? 'Opini' : 'Berita';
}

export function getInsightUrl(category, id) {
  return `/insight/${getCategorySlug(category)}/${id}`;
}

export function getInsightAbsoluteUrl(category, id) {
  return `${DEFAULT_SITE_URL}/insight/${getCategorySlug(category)}/${id}`;
}

/**
 * Mengoptimalkan URL gambar cover khusus untuk OpenGraph (WhatsApp, Facebook, X/Twitter, LinkedIn).
 * WhatsApp mewajibkan ukuran file gambar < 300 KB dan format JPG/PNG standar (sering gagal jika WebP atau PNG > 500KB).
 * Jika gambar berasal dari Cloudinary, fungsi ini menyisipkan transformasi otomatis ke 1200x630 JPG terkompresi (~70-120KB).
 */
export function getOptimizedOgImageUrl(url, width = 1200, height = 630, quality = 75) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return `${DEFAULT_SITE_URL}/Logo%20Mahatma.png`;
  }

  let cleanUrl = url.trim();

  // Pastikan protokol HTTPS
  if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.replace('http://', 'https://');
  }

  // Transformasi otomatis untuk URL Cloudinary agar ukuran < 150KB & berformat .jpg
  if (cleanUrl.includes('res.cloudinary.com') && cleanUrl.includes('/upload/')) {
    const transformStr = `c_fill,w_${width},h_${height},g_auto,q_${quality},f_jpg`;

    // Hapus transformasi lama jika ada sebelum /v12345/
    if (/\/upload\/[^/]+\/v\d+\//.test(cleanUrl)) {
      cleanUrl = cleanUrl.replace(/\/upload\/[^/]+\/(v\d+\/)/, `/upload/${transformStr}/$1`);
    } else {
      cleanUrl = cleanUrl.replace('/upload/', `/upload/${transformStr}/`);
    }

    // Ubah ekstensi akhir menjadi .jpg agar bot WhatsApp mengenali tipe MIME image/jpeg secara instan
    cleanUrl = cleanUrl.replace(/\.(png|webp|gif|avif|jpeg|bmp|tiff|heic)$/i, '.jpg');
    return cleanUrl;
  }

  if (cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith('/')) {
    return `${DEFAULT_SITE_URL}${encodeURI(cleanUrl)}`;
  }

  return `${DEFAULT_SITE_URL}/${encodeURI(cleanUrl)}`;
}

export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function estimateReadingTime(content) {
  const text = stripHtml(content);
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

export function getExcerpt(content, maxLength = 160) {
  const text = stripHtml(content);
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
