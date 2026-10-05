import React from 'react';
import { TOOLS_CONFIG, SUB_CATEGORIES } from '../config/tools.config';
import { ArrowRight, Star, ShieldCheck, ChevronRight, Files, Scissors, Minimize2, RotateCw, Trash2, FileOutput, ArrowUpDown, Stamp, Hash, Crop, Contrast, ShieldAlert, Pen, FileText, ImageDown, Search, FileCog, Image, LayoutGrid, PenLine, FormInput, PenTool, FileImage, Maximize2, FileArchive, Repeat, Scaling, Smartphone, Camera, Sparkles, Layers, ArrowUpRight, Table, Presentation, FileCode, Code, Braces, Lock, Unlock, Moon, ScanText, Binary, Sheet, FileCheck } from 'lucide-react';
import { useFavoritesRecent } from '../context/FavoritesRecentContext';
import { AdSlot } from '../components/common/AdSlot';

interface CategoryPageProps {
  onNavigate: (route: string) => void;
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

export const CategoryPage: React.FC<CategoryPageProps> = ({ onNavigate }) => {
  const { isFavorite, toggleFavorite } = useFavoritesRecent();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
        <button
          onClick={() => onNavigate('/')}
          className="hover:text-slate-200 transition-colors cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-200 font-medium">PDF & Documents</span>
      </nav>

      {/* Category Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>🔒 100% Client-Side • 34 Active Tools</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          PDF & Document Tools
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
          Powerful browser-based tools to manage, edit, convert and organize PDF documents. All processing runs locally inside your browser memory with zero server uploads.
        </p>
      </div>

      {/* 7 Display Sub-Sections */}
      <div className="space-y-14">
        {SUB_CATEGORIES.map((subCat) => {
          const subTools = TOOLS_CONFIG.filter((t) => t.subCategory === subCat);
          if (subTools.length === 0) return null;

          return (
            <section key={subCat} className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h2 className="text-xl font-bold tracking-tight text-white uppercase">
                    {subCat}
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-mono font-medium">
                  {subTools.length} tool{subTools.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {subTools.map((tool) => {
                  const Icon = ICON_MAP[tool.iconName] || FileText;
                  const favorited = isFavorite(tool.slug);

                  return (
                    <div
                      key={tool.slug}
                      onClick={() => onNavigate(`/${tool.slug}`)}
                      className="group rounded-2xl border border-slate-800/90 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 p-5 flex flex-col justify-between transition-all cursor-pointer shadow-lg hover:shadow-xl"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {tool.isPremium ? 'PRO' : 'FREE'}
                            </span>
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
                            >
                              <Star className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                          {tool.shortTitle || tool.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-emerald-400">
                          In-Browser
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
            </section>
          );
        })}
      </div>

      <AdSlot slotId="category-bottom-ad" format="banner" />
    </div>
  );
};
