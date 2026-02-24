export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/', // Jangan biarkan Google mengindeks halaman admin
    },
    sitemap: 'https://mahatma.id/sitemap.xml',
  }
}