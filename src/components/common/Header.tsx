import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ShieldCheck, Menu, X, WifiOff, FileText, ShoppingBag, CreditCard, ChevronDown } from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import { CATEGORIES } from '../../config/tools.config';

interface HeaderProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentRoute, onOpenSearch }) => {
  const { isPro, currentPlan, openUpgradeModal, resetToFree } = usePlan();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [onOpenSearch]);

  const navLinks = [
    { label: 'All Tools', route: '/' },
    { label: 'PDF & Documents', route: '/pdf-documents' },
    { label: 'Marketplace', route: '/marketplace' },
    { label: 'Affiliates (30%)', route: '/affiliates' },
    { label: 'History', route: '/history' },
    { label: 'Pricing', route: '/pricing' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-900/30 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">ToolsHub</span>
                {isPro && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 tracking-wider">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block">100% Client-Side Private</p>
            </div>
          </button>

          {!isOnline && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-400 text-[11px] font-medium"
              title="ToolsHub works 100% offline via local service worker"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Ready</span>
            </div>
          )}
        </div>

        {/* Search Bar Button */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 hover:border-slate-700 text-xs text-slate-400 transition-colors shadow-inner cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Quick search tools (merge, split, signature)...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Desktop Nav Links & Pro Button */}
        <div className="hidden lg:flex items-center gap-5">
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-300">
            {navLinks.map((link) => (
              <button
                key={link.route}
                onClick={() => onNavigate(link.route)}
                className={`transition-colors cursor-pointer hover:text-white ${
                  currentRoute === link.route ? 'text-blue-400 font-semibold' : ''
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="h-4 w-px bg-slate-800" />

          {isPro ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Pro Active
              </span>
              <button
                onClick={resetToFree}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                title="Reset to free tier for testing limits"
              >
                Reset
              </button>
            </div>
          ) : (
            <button
              onClick={() => openUpgradeModal('Upgrade to Pro for unlimited files and ad-free workflow.')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-900/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade to Pro</span>
            </button>
          )}
        </div>

        {/* Mobile Action Buttons */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {!isPro && (
            <button
              onClick={() => openUpgradeModal()}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white cursor-pointer"
            >
              Pro
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-900/95 p-4 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.route}
                onClick={() => {
                  onNavigate(link.route);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  currentRoute === link.route
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Files never leave device
            </span>
            {isPro ? (
              <span className="text-amber-400 font-bold">PRO Active</span>
            ) : (
              <button
                onClick={() => {
                  openUpgradeModal();
                  setMobileMenuOpen(false);
                }}
                className="text-blue-400 font-medium underline"
              >
                View Plans
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
