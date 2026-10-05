import React, { useState } from 'react';
import { ShieldCheck, Mail, CheckCircle2, Lock, Cpu, HardDrive } from 'lucide-react';

interface StaticPageProps {
  type: 'privacy' | 'terms' | 'about' | 'contact' | 'disclaimer';
  onNavigate: (route: string) => void;
}

export const StaticPage: React.FC<StaticPageProps> = ({ type, onNavigate }) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {type === 'privacy' && (
        <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 uppercase tracking-wider">
              Privacy Standard
            </span>
            <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
            <p className="text-xs text-slate-500">Effective Date: October 2026</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/50 text-xs text-emerald-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-bold text-white">The ToolsHub Zero-Upload Guarantee</p>
              <p className="mt-1">
                Every single document, PDF, image, signature, and contract generated on ToolsHub is processed 100% locally in your device’s browser memory (RAM). Your files are never uploaded to any remote server or third-party cloud.
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Information We Do NOT Collect</h2>
            <p>
              Because our tools use client-side technologies including WebAssembly, HTML5 Canvas, and JavaScript libraries (pdf-lib, pdf.js), we do not possess the technical capability to view, intercept, save, or store your uploaded files. When you close the browser tab, the files in memory are discarded.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Local Storage & IndexedDB</h2>
            <p>
              Features such as the Signature Vault and contract draft autosave utilize your browser’s local IndexedDB and LocalStorage APIs. This data lives exclusively on your local computer or phone. You can clear this data at any time via your browser’s "Clear Browsing Data" settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Cookies & Advertising</h2>
            <p>
              We may display non-intrusive advertisements (Google AdSense) on free tiers to support the continued maintenance of the platform. Third-party vendors, including Google, use cookies to serve ads based on prior visits to this or other websites. You may opt out of personalized advertising by visiting Google Ads Settings. Pro subscribers enjoy a completely ad-free experience.
            </p>
          </section>
        </div>
      )}

      {type === 'terms' && (
        <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Terms of Service</h1>
            <p className="text-xs text-slate-500">Last Revised: October 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using ToolsHub, you agree to comply with and be bound by these Terms of Service. If you do not agree, please discontinue using our client-side tools.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Use of Free and Pro Services</h2>
            <p>
              ToolsHub provides browser-based utilities for merging, splitting, converting, signing, and drafting documents. You agree not to reverse-engineer our proprietary bundle delivery systems or attempt to disrupt the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Template Customization & Legal Advice Disclaimer</h2>
            <p>
              Document templates provided on ToolsHub (including rent agreements and resignation letters) are provided for general administrative guidance only. They do not constitute formal legal counsel. Users should consult licensed attorneys for complex jurisdictional requirements.
            </p>
          </section>
        </div>
      )}

      {type === 'about' && (
        <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/70 text-blue-400 border border-blue-900/50 uppercase tracking-wider">
              Our Mission
            </span>
            <h1 className="text-3xl font-black text-white">About ToolsHub</h1>
            <p className="text-xs text-slate-400">Zero Server Cost. Zero Cloud Leaks. 100% Client-Side Privacy.</p>
          </div>

          <p>
            ToolsHub was founded with a singular conviction: <strong>you should never have to upload confidential tax returns, lease agreements, or personal photos to an unknown offshore server just to merge two PDFs or sign a form.</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <Cpu className="w-6 h-6 text-blue-400" />
              <h3 className="font-bold text-white text-sm">$0 Server Overhead</h3>
              <p className="text-xs text-slate-400">We don't rent heavy backend cloud conversion clusters. Your browser does the computational work.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <Lock className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Strict Zero-Upload</h3>
              <p className="text-xs text-slate-400">Your documents never exit your local device sandbox. No databases, no logs, no leaks.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <HardDrive className="w-6 h-6 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">PWA Offline Capable</h3>
              <p className="text-xs text-slate-400">Works seamlessly on flights, trains, and remote sites even when totally disconnected.</p>
            </div>
          </div>
        </div>
      )}

      {type === 'contact' && (
        <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Contact & Support</h1>
            <p className="text-xs text-slate-400">Have a question, tool suggestion, or feedback? Drop us a line.</p>
          </div>

          {contactSubmitted ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Message Sent Successfully!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Thank you for contacting ToolsHub. Our core team reviews feedback daily and will reply to {contactForm.email} if required.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="jane@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="How can we help?"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md cursor-pointer"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      )}

      {type === 'disclaimer' && (
        <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Disclaimer</h1>
            <p className="text-xs text-slate-500">Last Revised: October 2026</p>
          </div>

          <p>
            The tools, file processors, signature generation algorithms, and contract templates provided on ToolsHub are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied.
          </p>

          <section className="space-y-2">
            <h3 className="font-bold text-white text-base">No Legal or Financial Advice</h3>
            <p>
              ToolsHub is a self-service technological software utility, not a law firm or financial advisory practice. While contract templates (e.g. lease agreements, resignation letters) are crafted according to standard conventions, legal enforceability varies by state, province, and nation. Always consult qualified legal counsel for binding high-stakes matters.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-white text-base">File Integrity</h3>
            <p>
              We recommend retaining backup copies of all original documents prior to performing batch conversions, splits, or merges. ToolsHub does not maintain cloud copies of your files.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};
