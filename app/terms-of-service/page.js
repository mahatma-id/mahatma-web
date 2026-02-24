"use client";
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-16 px-4 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <Link href="/" className="inline-block mb-8 text-sm font-bold text-emerald-600 hover:underline">← Back to Home</Link>
        
        <h1 className="text-3xl md:text-4xl font-black mb-6">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: February 2026</p>

        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-6">
          <h3 className="text-xl font-bold">1. Agreement to Terms</h3>
          <p>By accessing our website at Mahatma Academy (MASE), you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>

          <h3 className="text-xl font-bold">2. Use License</h3>
          <p>Permission is granted to temporarily download one copy of the materials (information or software) on Mahatma Academy's website for personal, non-commercial transitory viewing only.</p>

          <h3 className="text-xl font-bold">3. Disclaimer</h3>
          <p>The materials on Mahatma Academy's website are provided on an 'as is' basis. Mahatma Academy makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

          <h3 className="text-xl font-bold">4. Governing Law</h3>
          <p>These terms and conditions are governed by and construed in accordance with the laws of Indonesia and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
        </div>
      </div>
    </div>
  );
}