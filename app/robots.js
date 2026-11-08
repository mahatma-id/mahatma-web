const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mahatma.id';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: ['Googlebot', 'Googlebot-News'],
        allow: ['/', '/insight/'],
        disallow: ['/admin/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
