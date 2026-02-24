import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-4 text-center">
      <h1 className="text-9xl font-black text-emerald-600 mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
        Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link href="/" className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-full hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition shadow-lg uppercase tracking-widest text-sm">
        Back to Homepage
      </Link>
    </div>
  )
}