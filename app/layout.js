import { Merriweather } from "next/font/google";
import "./globals.css";
import Script from "next/script"; // <-- Tambahan Import Script untuk Analytics
import FloatingWA from "@/components/FloatingWA"; // <-- TAMBAHAN IMPORT TOMBOL WA
import { ThemeProvider } from "@/components/ThemeProvider"; // <-- TAMBAHAN IMPORT THEME PROVIDER

// Konfigurasi Font Merriweather
const merriweather = Merriweather({ 
  subsets: ["latin"],
  weight: ['300', '400', '700', '900'], // Mengambil ketebalan tipis hingga sangat tebal
  style: ['normal', 'italic'],          // Mengambil gaya normal dan miring
  display: 'swap',
});

export const metadata = {
  title: "Mahatma Academy - Driving Transformation for Sustainable Education",
  description: "Driving Transformation for Sustainable Education",
  verification: {
    google: '-A5vyw3KREyo809TVLGK0L15oFsGtZ055M1hIB99L8Q',
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