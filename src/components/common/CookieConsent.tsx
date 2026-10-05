import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('th_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('th_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('th_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 p-5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-md text-slate-200 animate-slide-up"
      role="region"
      aria-label="Cookie consent banner"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
          <Cookie className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Your Privacy Matters</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            We use essential local storage to save your preferences and signatures offline. Your uploaded documents are processed 100% locally in your browser and never leave your device.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleAccept}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md"
            >
              Accept All
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
            >
              Essential Only
            </button>
            <a
              href="/privacy"
              className="text-[11px] text-slate-400 hover:text-slate-300 underline ml-auto"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
