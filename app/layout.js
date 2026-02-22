import { Merriweather } from "next/font/google";
import "./globals.css";

// Konfigurasi Font Merriweather
const merriweather = Merriweather({ 
  subsets: ["latin"],
  weight: ['300', '400', '700', '900'], // Mengambil ketebalan tipis hingga sangat tebal
  style: ['normal', 'italic'],          // Mengambil gaya normal dan miring
  display: 'swap',
});

export const metadata = {
  title: "MAHATMA ACADEMY",
  description: "Mahatma Academy for Sustainable Education",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="scroll-smooth">
      {/* className ini akan menerapkan font Merriweather ke seluruh website */}
      <body className={`${merriweather.className} antialiased bg-slate-50 text-slate-800`}>
        {children}
      </body>
    </html>
  );
}