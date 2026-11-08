/**
 * Utility functions for Mahatma Insight (Berita & Opini)
 */

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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mahatma.id';
  return `${baseUrl}/insight/${getCategorySlug(category)}/${id}`;
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
