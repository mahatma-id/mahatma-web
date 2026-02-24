"use client";
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-16 px-4 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <Link href="/" className="inline-block mb-8 text-sm font-bold text-emerald-600 hover:underline">← Back to Home</Link>
        
        <h1 className="text-3xl md:text-4xl font-black mb-6">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: February 2026</p>

        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-6">
          <p>Welcome to Mahatma Academy (MASE). We respect your privacy and are committed to protecting your personal data.</p>
          
          <h3 className="text-xl font-bold">1. Information We Collect</h3>
          <p>We may collect personal identification information from Users in a variety of ways, including, but not limited to, when Users visit our site, subscribe to the newsletter, and in connection with other activities, services, features or resources we make available on our Site.</p>

          <h3 className="text-xl font-bold">2. Web Browser Cookies</h3>
          <p>Our Site may use "cookies" to enhance User experience. User's web browser places cookies on their hard drive for record-keeping purposes and sometimes to track information about them. You may choose to set your web browser to refuse cookies, or to alert you when cookies are being sent.</p>

          <h3 className="text-xl font-bold">3. How We Use Collected Information</h3>
          <p>Mahatma Academy may collect and use Users personal information for the following purposes: To run and operate our Site, to improve customer service, and to send periodic emails.</p>

          <h3 className="text-xl font-bold">4. Contact Us</h3>
          <p>If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us at our official contact page.</p>
        </div>
      </div>
    </div>
  );
}