import React, { useState } from 'react';
import { TOOLS_CONFIG, CATEGORIES } from '../config/tools.config';
import {
  ShieldCheck, Search, ArrowRight, Star, Cpu, HardDrive, Zap, CheckCircle2, Lock,
  Sparkles, Files, Scissors, Minimize2, RotateCw, Trash2, FileOutput, ArrowUpDown,
  Stamp, Hash, Crop, Contrast, ShieldAlert, Pen, FileText, ImageDown, FileCog,
  Image, LayoutGrid, PenLine, FormInput, PenTool, FileImage, Maximize2, FileArchive,
  Repeat, Scaling, Smartphone, Camera, Layers, ArrowUpRight,
  Table, Presentation, FileCode, Code, Braces, Unlock, Moon, ScanText, Binary, Sheet, FileCheck
} from 'lucide-react';
import { useFavoritesRecent } from '../context/FavoritesRecentContext';
import { AdSlot } from '../components/common/AdSlot';

interface HomePageProps {
  onNavigate: (route: string) => void;
  onOpenSearch: () => void;
}

const ICON_MAP: Record<string, any> = {
  Files,
  Scissors,
  Minimize2,
  RotateCw,
  Trash2,
  FileOutput,
  ArrowUpDown,
  Stamp,
  Hash,
  Crop,
  Contrast,
  ShieldAlert,
  Pen,
  FileText,
  ImageDown,
  Search,
  FileCog,
  Image,
  LayoutGrid,
  PenLine,
  FormInput,
  PenTool,
  FileImage,
  Maximize2,
  FileArchive,
  Repeat,
  Scaling,
  Smartphone,
  Camera,
  Sparkles,
  Layers,
  ArrowUpRight,
  Table,
  Presentation,
  FileCode,
  Code,
  Braces,
  Lock,
  Unlock,
  Moon,
  ScanText,
  Binary,
  Sheet,
  FileCheck,
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenSearch }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { favorites, isFavorite, toggleFavorite, recentTools } = useFavoritesRecent();

  const filteredTools = TOOLS_CONFIG.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      tool.category === selectedCategory ||
      (selectedCategory === 'favorites' && favorites.includes(tool.slug));

    const matchesQuery =
      !searchQuery.trim() ||
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesQuery;
  });

  const recentToolDefs = TOOLS_CONFIG.filter((t) => recentTools.includes(t.slug));

  return (
    <div className="w-full space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-12 border-b border-slate-900 bg-gradient-to-b from-blue-950/20 via-slate-950 to-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-semibold shadow-lg shadow-emerald-950/30">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Client-Side Privacy • Zero Server Uploads • $0 API Costs</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Every Document Tool You Need.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Zero Files Leave Your Browser.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Merge PDFs, split pages, compress documents, fill & sign forms, convert formats, and clean text right inside your browser’s local memory sandbox.
          </p>

          {/* Quick Search Bar */}
          <div className="max-w-xl mx-auto pt-2">
            <div
              onClick={onOpenSearch}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl hover:border-blue-500/80 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <Search className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Search 32 tools (merge, split, fill & sign, compress)...</span>
              </div>
              <kbd className="hidden sm:inline-block px-2.5 py-1 text-xs font-mono text-slate-300 bg-slate-800 rounded-lg border border-slate-700">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Trust points */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              100% Private (No Cloud Uploads)
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              Instant Hardware-Accelerated Speed
            </span>
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              PWA Offline Capable
            </span>
          </div>
        </div>
      </section>

      {/* Main Tools Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Recents Bar if user has visited tools */}
        {recentToolDefs.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
                Recently Used
              </span>
              <span>Quick Resume</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentToolDefs.map((tool) => (
                <button
                  key={tool.slug}
                  onClick={() => onNavigate(`/${tool.slug}`)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  <span>{tool.shortTitle || tool.title}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Tools ({TOOLS_CONFIG.length})
            </button>

            <button
              onClick={() => setSelectedCategory('pdf-documents')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === 'pdf-documents'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              PDF & Documents ({TOOLS_CONFIG.filter((t) => t.category === 'pdf-documents').length})
            </button>

            <button
              onClick={() => setSelectedCategory('favorites')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'favorites'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3 h-3" />
              <span>Favorites ({favorites.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Showing <span className="font-bold text-white">{filteredTools.length}</span> tools
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTools.map((tool) => {
            const Icon = ICON_MAP[tool.iconName] || FileText;
            const favorited = isFavorite(tool.slug);

            return (
              <div
                key={tool.slug}
                onClick={() => onNavigate(`/${tool.slug}`)}
                className="group relative rounded-2xl border border-slate-800/90 bg-slate-900/60 hover:bg-slate-900 p-5 shadow-lg hover:shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tool.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {tool.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tool.slug);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          favorited
                            ? 'bg-amber-950/40 border-amber-800/50 text-amber-400'
                            : 'border-transparent text-slate-600 hover:text-slate-400'
                        }`}
                        title={favorited ? 'Unfavorite' : 'Favorite'}
                      >
                        <Star className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                    {tool.shortTitle || tool.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    In-browser
                  </span>
                  <span className="text-blue-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* AdSlot in Homepage */}
        <AdSlot slotId="home-feed-ad" format="horizontal" />

        {/* Comparison Section: ToolsHub vs Traditional Cloud Converters */}
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Why 100% Client-Side Matters
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Traditional document tools upload your sensitive contracts to cloud servers. ToolsHub executes entirely inside your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-3">
              <h4 className="text-sm font-bold text-red-300 flex items-center gap-2">
                <span>Traditional Cloud Document Sites</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Uploads sensitive contracts, tax records, and medical files to third-party offshore cloud servers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>High monthly server bills passed down to you as expensive paywalled subscriptions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Fails completely if you have poor internet or need to work offline during travel.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-3">
              <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>The ToolsHub Zero-Upload Standard</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Files stay in your device RAM. Neither our team nor any servers ever see your files.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Owner's server cost is $0, meaning core processing and downloads stay forever free.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Fully installable PWA that functions seamlessly even when disconnected from the web.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};
