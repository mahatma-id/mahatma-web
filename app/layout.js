import { Merriweather } from "next/font/google";
import "./globals.css";
import Script from "next/script"; 
import FloatingWA from "@/components/FloatingWA"; 
import { ThemeProvider } from "@/components/ThemeProvider"; 

// Konfigurasi Font Merriweather
const merriweather = Merriweather({ 
  subsets: ["latin"],
  weight: ['300', '400', '700', '900'], 
  style: ['normal', 'italic'],          
  display: 'swap',
});

// PENGATURAN METADATA (SEO & BRANDING)
export const metadata = {
  // Judul di Tab Browser
  title: "Mahatma Academy - Beyond Excellent, Toward Sustainability",
  
  // Deskripsi di Google Search
  description: "Guiding transformation for sustainable education. We empower institutions with data-driven strategies, AI integration, and visionary leadership to build sustainability.",
  
  // Nama Aplikasi (Muncul saat di-install/di-bookmark)
  applicationName: "MASE",

  // Verifikasi Google (Tetap dipertahankan)
  verification: {
    google: '-A5vyw3KREyo809TVLGK0L15oFsGtZ055M1hIB99L8Q',
  },

  // Pengaturan Logo / Favicon
  // Pastikan Anda sudah upload file 'icon.png' ke dalam folder 'app/'
  icons: {
    icon: '/icon.png', 
    apple: '/icon.png',
  },

  // Tampilan saat link dibagikan di Sosmed (WA/FB/Twitter)
  openGraph: {
    siteName: "MASE",
    title: "Mahatma Academy - Beyond Excellent, Toward Sustainability",
    description: "Guiding transformation for sustainable education. We empower institutions with data-driven strategies, AI integration, and visionary leadership to build sustainability.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning wajib ditambahkan agar Next.js aman saat transisi tema
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* --- MULAI KODE GOOGLE ANALYTICS --- */}
        <Script 
          strategy="afterInteractive" 
          src={`https://www.googletagmanager.com/gtag/js?id=G-12K45HRN7S`} 
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-12K45HRN7S', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        {/* --- AKHIR KODE GOOGLE ANALYTICS --- */}
      </head>

      {/* Tambahan dark:bg-slate-950 dark:text-slate-200 agar warna dasar berubah otomatis saat Dark Mode */}
      <body className={`${merriweather.className} antialiased bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200 transition-colors duration-300`}>
        
        {/* ThemeProvider membungkus seluruh aplikasi */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            
            {/* --- TAMBAHAN TOMBOL WA MELAYANG --- */}
            <FloatingWA />
        </ThemeProvider>

      </body>
    </html>
  );
}