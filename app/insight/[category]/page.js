import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCategorySlug, getExcerpt, estimateReadingTime } from '@/lib/insight';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const rawCat = resolvedParams.category || 'berita';
  const slug = getCategorySlug(rawCat);
  const isOpini = slug === 'opini';

  const title = isOpini 
    ? 'Kolom Opini & Analisis Kritis | Mahatma Academy'
    : 'Berita & Informasi Terkini | Mahatma Academy';

  const description = isOpini
    ? 'Kumpulan esai gagasan, perspektif mendalam, dan pemikiran strategis para akademisi dan praktisi pendidikan berkelanjutan.'
    : 'Kabar resmi, peliputan kegiatan, rilis pers, serta inovasi pendidikan terbaru dari Mahatma Academy.';

  const canonicalUrl = `https://mahatma.id/insight/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Mahatma Academy',
      type: 'website',
      images: [
        {
          url: 'https://mahatma.id/Logo%20Mode%20Terang.png',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://mahatma.id/Logo%20Mode%20Terang.png'],
    },
  };
}

export default async function CategoryListingPage({ params }) {
  const resolvedParams = await params;
  const rawCat = resolvedParams.category || 'berita';
  const categorySlug = getCategorySlug(rawCat);
  const isOpini = categorySlug === 'opini';

  // Fetch posts from Firestore server-side
  let posts = [];
  try {
    const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));
    posts = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => !p.isDraft && getCategorySlug(p.category) === categorySlug);
  } catch (err) {
    console.error('Error fetching category posts:', err);
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col font-sans transition-colors duration-300">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 md:px-12 lg:px-16 pt-32 md:pt-40 pb-20 max-w-7xl">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
          <Link href="/" className="hover:text-emerald-600 transition">Beranda</Link>
          <span>/</span>
          <Link href="/insight" className="hover:text-emerald-600 transition">Insight</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200">{isOpini ? 'Opini' : 'Berita'}</span>
        </nav>

        {/* HEADER */}
        <div className="mb-12">
          <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-3 ${
            isOpini 
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' 
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
          }`}>
            {isOpini ? '💡 Kolom Opini & Perspektif' : '📰 Berita & Liputan Resmi'}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            {isOpini ? 'Gagasan & Analisis Opini' : 'Arsip Berita & Informasi'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            {isOpini 
              ? 'Ruang dialektika dan gagasan visioner dari para pakar untuk mentransformasi mutu pendidikan.' 
              : 'Laporan kegiatan, kerja sama strategis, pengumuman, dan perkembangan terkini dari Mahatma.'}
          </p>

          <div className="flex gap-2 mt-6">
            <Link 
              href="/insight" 
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition"
            >
              &larr; Lihat Semua Insight
            </Link>
            <Link 
              href={isOpini ? '/insight/berita' : '/insight/opini'} 
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition"
            >
              Lihat {isOpini ? 'Berita' : 'Opini'} &rarr;
            </Link>
          </div>
        </div>

        {/* POSTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {posts.map(post => {
            const dStr = post.createdAt ? post.createdAt.toDate().toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const readTime = estimateReadingTime(post.content);

            return (
              <Link 
                href={`/insight/${categorySlug}/${post.id}`} 
                key={post.id} 
                className="group flex flex-col bg-white dark:bg-slate-900 rounded-3xl p-4 hover:shadow-xl dark:hover:shadow-emerald-950/30 hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 dark:border-slate-800"
              >
                <div className="w-full h-48 md:h-52 bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden mb-4 relative">
                  <img 
                    src={post.coverUrl || 'https://placehold.co/600x400/0f172a/white?text=Mahatma+Insight'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    alt={post.title}
                  />
                  <span className={`absolute top-3 left-3 px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm text-white ${
                    isOpini ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    {isOpini ? 'Opini' : 'Berita'}
                  </span>
                </div>
                <div className="px-1 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>{dStr}</span>
                    <span>•</span>
                    <span>⏱️ {readTime} min</span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {post.excerpt || getExcerpt(post.content, 110)}
                  </p>
                  <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span>✍️ {post.author || 'Tim Redaksi'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
            <span className="text-4xl mb-4 block">📝</span>
            <p className="text-slate-600 dark:text-slate-300 font-bold mb-2">Belum ada {isOpini ? 'opini' : 'berita'} yang diterbitkan</p>
            <p className="text-slate-400 text-xs">Silakan kembali lagi nanti untuk pembaruan berikutnya.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
