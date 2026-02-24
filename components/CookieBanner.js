"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Cek apakah user sudah pernah setuju
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur text-white p-4 z-[9999] border-t border-slate-700 shadow-2xl">
      <div className="container mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm">
        <p className="text-slate-300 text-center md:text-left max-w-3xl">
          We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies. 
          <Link href="/privacy-policy" className="text-emerald-400 hover:underline ml-1">Learn more</Link>.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setShowBanner(false)} className="text-slate-400 hover:text-white font-bold px-4 py-2">Decline</button>
          <button onClick={acceptCookies} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2 rounded-full transition shadow-lg">Accept</button>
        </div>
      </div>
    </div>
  );
}