import React, { useEffect, useState } from 'react';
import { ToolDefinition } from '../../types';
import { TOOLS_CONFIG } from '../../config/tools.config';
import { ShieldCheck, ChevronRight, HelpCircle, BookOpen, Star, ArrowRight, Lock } from 'lucide-react';
import { useFavoritesRecent } from '../../context/FavoritesRecentContext';
import { AdSlot } from '../common/AdSlot';

interface ToolLayoutProps {
  tool: ToolDefinition;
  children: React.ReactNode;
  onNavigate: (route: string) => void;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({ tool, children, onNavigate }) => {
  const { isFavorite, toggleFavorite, addRecentTool } = useFavoritesRecent();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const favorited = isFavorite(tool.slug);

  useEffect(() => {
    addRecentTool(tool.slug);
    document.title = `${tool.title} | ToolsHub`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tool.slug]);

  // Related tools from strictly active 32-tool list
  const relatedTools = (tool.relatedSlugs || [])
    .map((slug) => TOOLS_CONFIG.find((t) => t.slug === slug))
    .filter((t): t is ToolDefinition => Boolean(t))
    .slice(0, 4);

  // Fallback to tools in same subcategory if none explicitly listed
  const displayRelated =
    relatedTools.length > 0
      ? relatedTools
      : TOOLS_CONFIG.filter((t) => t.slug !== tool.slug && t.subCategory === tool.subCategory).slice(0, 4);

  // FAQ Schema JSON-LD
  const faqSchemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  // SoftwareApplication Schema JSON-LD
  const softwareSchemaData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All Modern Web Browsers',
    description: tool.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: tool.featuresList,
  };

  return (
    <div className="w-full">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchemaData) }}
      />

      {/* Top Breadcrumb & Privacy Header */}
      <div className="border-b border-slate-900 bg-slate-950/60 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
            <button
              onClick={() => onNavigate('/')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <button
              onClick={() => onNavigate('/pdf-documents')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              {tool.categoryName}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-400">{tool.subCategory}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 font-medium truncate max-w-[180px]">
              {tool.shortTitle || tool.title}
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleFavorite(tool.slug)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                favorited
                  ? 'bg-amber-950/40 border-amber-800/50 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={favorited ? 'Remove from favorites' : 'Save to favorites'}
              aria-label="Toggle favorite"
            >
              <Star className={`w-3.5 h-3.5 ${favorited ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tool Header */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/70 text-blue-400 border border-blue-900/50 uppercase tracking-wider">
              {tool.subCategory}
            </span>
            {tool.badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/70 text-indigo-400 border border-indigo-900/50">
                {tool.badge}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
            {tool.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            {tool.description}
          </p>

          {/* EXACT Required Privacy Notice */}
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2 max-w-2xl">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">
              🔒 Your files are processed locally in your browser and are never uploaded.
            </span>
          </div>
        </div>

        {/* The Main Tool Interface */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-2xl p-4 sm:p-7 backdrop-blur-sm">
          {children}
        </div>

        {/* AdSlot */}
        <AdSlot slotId={`tool-ad-${tool.slug}`} format="horizontal" />

        {/* Key Features Pill Matrix */}
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Key Feature Standards
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tool.featuresList.map((feature, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 300+ Word Guide Section */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-200">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {tool.guideTitle}
            </h2>
          </div>

          <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
            {tool.guideContent.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-200">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {tool.faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-sm text-slate-200 hover:text-white cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span className="text-slate-500 text-lg leading-none font-bold">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Related Tools (strictly referencing only the 32 tools) */}
        {displayRelated.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Related Tools in ToolsHub</h3>
              <button
                onClick={() => onNavigate('/pdf-documents')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>View All 32 Tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {displayRelated.map((rel) => (
                <div
                  key={rel.slug}
                  onClick={() => onNavigate(`/${rel.slug}`)}
                  className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-400">
                        {rel.shortTitle || rel.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {rel.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase mt-3 tracking-wider font-semibold">
                    {rel.subCategory}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <AdSlot slotId={`tool-bottom-ad-${tool.slug}`} format="banner" />
      </div>
    </div>
  );
};
