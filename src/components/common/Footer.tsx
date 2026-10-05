import React from 'react';
import { ShieldCheck, Cpu, HardDrive, Heart, ExternalLink, ArrowRight } from 'lucide-react';
import { TOOLS_CONFIG, CATEGORIES } from '../../config/tools.config';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 text-slate-400 text-xs mt-auto">
      {/* Privacy Callout Banner */}
      <div className="border-b border-slate-900 bg-gradient-to-r from-blue-950/20 via-indigo-950/20 to-blue-950/20 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-200">100% Client-Side Architecture:</span>{' '}
              <span>Your files, documents, and signatures are processed in browser RAM and are never uploaded.</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              IndexedDB local data
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              $0 Owner Server Cost
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="col-span-2 space-y-3">
            <button
              onClick={() => onNavigate('/')}
              className="text-left font-black text-xl text-white tracking-tight flex items-center gap-2 cursor-pointer"
            >
              <span>ToolsHub</span>
            </button>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The privacy-first multi-tool platform. Merge PDFs, extract pages, convert images, sign documents, and generate contracts right on your device. Zero data harvesting.
            </p>
            <div className="pt-2 text-[11px] text-slate-400">
              Built with React, TypeScript, Tailwind CSS & pdf-lib. PWA offline capable.
            </div>
          </div>

          {/* PDF Tools */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              PDF Tools
            </h4>
            <ul className="space-y-1.5">
              {[
                { name: 'PDF Merge', slug: 'pdf-merge' },
                { name: 'PDF Split', slug: 'pdf-split' },
                { name: 'PDF Compress', slug: 'pdf-compress' },
                { name: 'PDF Rotate', slug: 'pdf-rotate' },
                { name: 'PDF Watermark', slug: 'pdf-watermark' },
                { name: 'PDF Fill & Sign', slug: 'pdf-fill-sign' },
              ].map((tool) => (
                <li key={tool.slug}>
                  <button
                    onClick={() => onNavigate(`/${tool.slug}`)}
                    className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                  >
                    {tool.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => onNavigate('/pdf-documents')}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer pt-1"
                >
                  <span>All 32 PDF Tools</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Conversion & Utilities */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              Conversion & Utilities
            </h4>
            <ul className="space-y-1.5">
              {[
                { name: 'Image to PDF', slug: 'image-to-pdf' },
                { name: 'PDF to Image', slug: 'pdf-to-image' },
                { name: 'Signature Maker', slug: 'signature-maker' },
                { name: 'Document Scanner', slug: 'document-scanner' },
                { name: 'Image Compressor', slug: 'image-compressor' },
                { name: 'Text Cleaner', slug: 'text-cleaner' },
              ].map((tool) => (
                <li key={tool.slug}>
                  <button
                    onClick={() => onNavigate(`/${tool.slug}`)}
                    className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                  >
                    {tool.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => onNavigate('/marketplace')}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer pt-1"
                >
                  <span>Template Packs</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              Company & Legal
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onNavigate('/pricing')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Plans & Pricing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/affiliates')} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer flex items-center gap-1">
                  <span>Creator Affiliate (30%)</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/disclaimer')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Disclaimer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Contact Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} ToolsHub. All rights reserved. 100% Client-Side.
          </div>
          <div className="flex items-center gap-4">
            <a href="/robots.txt" target="_blank" rel="noreferrer" className="hover:text-slate-300">
              robots.txt
            </a>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-slate-300">
              sitemap.xml
            </a>
            <a href="/ads.txt" target="_blank" rel="noreferrer" className="hover:text-slate-300">
              ads.txt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
