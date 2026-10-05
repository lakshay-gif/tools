import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag, Check, Sparkles, Download, ArrowRight, FileText, CheckCircle2,
  ExternalLink, Plus, Lock, Unlock, Trash2, Edit3, ShieldAlert, Tag,
  Search, BookOpen, Layers, Gift, DollarSign, Filter
} from 'lucide-react';
import { MarketplaceItem, TemplatePack } from '../types';
import { usePlan } from '../context/PlanContext';
import { downloadFile } from '../lib/pdfUtils';
import {
  getMarketplaceItems,
  deleteMarketplaceItem,
  checkIsAdmin,
  logoutAdmin,
  resetMarketplaceItems,
  ADMIN_DEFAULT_PASSCODE
} from '../lib/marketplaceStorage';
import { AdminLoginModal } from '../components/marketplace/AdminLoginModal';
import { AdminItemModal } from '../components/marketplace/AdminItemModal';
import { AffiliateProgramModal } from '../components/affiliate/AffiliateProgramModal';

interface MarketplacePageProps {
  onNavigate: (route: string) => void;
}

const TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: 'pack-legal-agreements',
    title: 'Complete Legal Agreements & Contract Suite',
    category: 'Legal & Business',
    description: '15+ attorney-reviewed contracts including Residential Lease, Commercial Lease, Non-Disclosure Agreement (NDA), Independent Contractor Agreement, and Freelance Work Contract.',
    price: '$19',
    includesCount: 15,
    badge: 'Bestseller',
    items: [
      'Comprehensive Residential Lease Agreement',
      'Commercial Property Lease Contract',
      'Mutual Non-Disclosure Agreement (NDA)',
      'Independent Contractor Master Services Agreement',
      'Cease & Desist Formal Letter Template',
      'Affidavit & Declaration Standard Forms'
    ]
  },
  {
    id: 'pack-executive-resume',
    title: 'Executive Resume & Cover Letter Kit',
    category: 'Careers & HR',
    description: 'ATS-optimized, modern professional resumes designed for tech, finance, and creative leadership roles. Includes matching resignation and recommendation letter templates.',
    price: '$14',
    includesCount: 12,
    badge: 'Popular',
    items: [
      'Modern Tech Leadership Resume Format',
      'Corporate Finance Executive CV Template',
      'Creative Director Portfolio Summary',
      'Senior Resignation with Stock Option Exit Terms',
      'Formal Reference Request Template'
    ]
  },
  {
    id: 'pack-startup-pitch',
    title: 'Startup Founder Investor & Operations Kit',
    category: 'Startups & Tech',
    description: 'Essential documents for modern software founders: Founder Accord, SAFE Investment Summary, Advisor Agreement, and Employee Stock Option Grant notifications.',
    price: '$24',
    includesCount: 10,
    badge: 'Founder Edition',
    items: [
      'Founders Pre-incorporation Agreement',
      'Simple Agreement for Future Equity (SAFE) Terms',
      'Strategic Advisory Board Charter',
      'Standard Intellectual Property Assignment Agreement'
    ]
  },
  {
    id: 'pack-creator-media',
    title: 'Creator Media Kit, SOW & Invoice Suite',
    category: 'Content Creators',
    description: 'Everything digital creators, YouTubers, and podcasters need to pitch brands, invoice clients, and enforce sponsorship deliverables.',
    price: '$12',
    includesCount: 8,
    badge: 'Trending',
    items: [
      'Brand Sponsorship Proposal & Rate Card',
      'Content Deliverables Scope of Work (SOW)',
      'Professional Freelancer Invoice Template',
      'Podcast Guest Release & Rights Grant'
    ]
  }
];

export const MarketplacePage: React.FC<MarketplacePageProps> = ({ onNavigate }) => {
  const { isPro, openUpgradeModal } = usePlan();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadedPacks, setDownloadedPacks] = useState<string[]>([]);

  // Modals
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);

  const loadData = () => {
    setItems(getMarketplaceItems());
    setIsAdmin(checkIsAdmin());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAdmin(false);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this marketplace item?')) {
      deleteMarketplaceItem(id);
      loadData();
    }
  };

  const handleEditItem = (item: MarketplaceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setShowItemModal(true);
  };

  const handleGetPack = (pack: TemplatePack) => {
    if (!isPro) {
      openUpgradeModal(`All Marketplace Template Packs are included free with ToolsHub Pro! Or purchase individually for ${pack.price}.`);
      return;
    }

    const bundleContent = `======================================================\nTOOLSHUB TEMPLATE PACK: ${pack.title.toUpperCase()}\n======================================================\nIncluded in this bundle:\n\n${pack.items.map((it, i) => `${i + 1}. ${it}\n   - Fully editable format\n   - Clean legal typography\n   - Ready to import into ToolsHub templates\n`).join('\n')}\n\nThank you for choosing ToolsHub. All templates run 100% locally in your browser.`;

    downloadFile(bundleContent, `${pack.id}_bundle.txt`, 'text/plain');
    setDownloadedPacks((prev) => [...prev, pack.id]);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'ebooks' && item.type === 'ebook') ||
        (selectedFilter === 'products' && item.type === 'product') ||
        (selectedFilter === 'software' && item.type === 'software');

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.authorOrBrand && item.authorOrBrand.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [items, selectedFilter, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* 1. CREATOR AFFILIATE HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Gift className="w-3.5 h-3.5" />
            <span>Earn 30% Recurring Commission</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ToolsHub Creator & Developer Affiliate Program
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Recommend 100% private, client-side document tools to your audience, clients, or subscribers. Earn 30% recurring commission on all Pro Monthly, Pro Yearly, and Lifetime Pass buys.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={() => setShowAffiliateModal(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            <span>Join Affiliate Program & Earn</span>
          </button>
        </div>
      </div>

      {/* 2. ADMIN TOOLBAR & HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Curated Digital Marketplace
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Ebooks, Recommended Tools & Legal Packs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Handpicked security hardware, digital privacy books, and executive document suites.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdmin ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold text-amber-300">Admin Mode Active</span>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowItemModal(true);
                }}
                className="ml-2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Affiliate Link</span>
              </button>
              <button
                onClick={handleAdminLogout}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Exit Admin
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdminLogin(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              title="Admin login to paste affiliate product & ebook links"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Portal</span>
            </button>
          )}

          <button
            onClick={() => setShowAffiliateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Creator Program</span>
          </button>
        </div>
      </div>

      {/* 3. SEARCH & CATEGORY FILTERS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'ebooks', label: 'Ebooks & Guides' },
            { id: 'products', label: 'Affiliate Products' },
            { id: 'software', label: 'Software & SaaS' },
            { id: 'templates', label: 'Document Templates' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals & books..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4. AFFILIATE PRODUCTS & EBOOKS SECTION */}
      {selectedFilter !== 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Recommended Affiliate Deals & Ebooks</span>
            </h2>
            <span className="text-xs text-slate-400">{filteredItems.length} curated listings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-3xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all duration-300 flex flex-col overflow-hidden shadow-xl"
              >
                {/* Cover Image Banner */}
                {item.imageUrl && (
                  <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    {item.badge && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900/90 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                        {item.badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 left-4 text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                      {item.type === 'ebook' ? 'Ebook' : item.type === 'product' ? 'Hardware' : 'Software'}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {item.authorOrBrand && (
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        By {item.authorOrBrand}
                      </p>
                    )}
                    <h3 className="text-lg font-bold text-white leading-snug group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-white">{item.price}</span>
                        {item.originalPrice && (
                          <span className="text-xs text-slate-500 line-through">{item.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Verified Partner Link</span>
                    </div>

                    {/* Affiliate Link Button */}
                    <a
                      href={item.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group-hover:shadow-blue-900/40"
                    >
                      <span>{item.type === 'ebook' ? 'Get Ebook / Access Guide' : 'Buy via Affiliate Link'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* Admin Action Buttons */}
                    {isAdmin && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                        <span className="text-amber-400 font-mono text-[10px]">Admin Actions</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleEditItem(item, e)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="py-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 p-8 space-y-3">
              <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">No items match your filter</h3>
              <p className="text-xs text-slate-500">Try clearing your search query or selecting a different category tab.</p>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setShowItemModal(true);
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                >
                  + Add First Affiliate Link
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. ORIGINAL DOCUMENT TEMPLATE PACKS SECTION */}
      {(selectedFilter === 'all' || selectedFilter === 'templates') && (
        <div className="space-y-6 pt-6 border-t border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Legal, Career & Business Template Packs</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Included free with ToolsHub Pro or available for individual download.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TEMPLATE_PACKS.map((pack) => {
              const isDownloaded = downloadedPacks.includes(pack.id);

              return (
                <div
                  key={pack.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 p-6 flex flex-col justify-between transition-all space-y-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                        {pack.category}
                      </span>
                      {pack.badge && (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {pack.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white leading-snug">{pack.title}</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{pack.description}</p>

                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                      <span className="text-[11px] font-bold text-slate-300 block">
                        Included in this bundle ({pack.includesCount} items):
                      </span>
                      <ul className="grid grid-cols-1 gap-1.5 text-xs text-slate-300">
                        {pack.items.map((it, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-2xl font-black text-white">{pack.price}</span>
                      <span className="text-xs text-slate-400 block font-normal">
                        {isPro ? 'Free for Pro Members' : 'One-time bundle purchase'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleGetPack(pack)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                        isDownloaded
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                          : isPro
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      {isDownloaded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Downloaded</span>
                        </>
                      ) : isPro ? (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Instant Download</span>
                        </>
                      ) : (
                        <>
                          <span>Unlock Pack ({pack.price})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. TRANSPARENT AFFILIATE DISCLOSURE */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-500 space-y-1.5 max-w-3xl mx-auto text-center">
        <p className="font-semibold text-slate-400">Affiliate Disclosure & Transparency</p>
        <p className="leading-relaxed">
          Some of the links in this marketplace are affiliate links. When you click through and make a purchase, ToolsHub may earn a modest commission at no extra cost to you. This directly funds our high-performance client-side WebAssembly infrastructure and keeps our 50+ privacy tools free for everyone.
        </p>
      </div>

      {/* MODALS */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={() => {
          setIsAdmin(true);
          setShowItemModal(true);
        }}
      />

      <AdminItemModal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSaved={loadData}
        initialItem={editingItem}
      />

      <AffiliateProgramModal
        isOpen={showAffiliateModal}
        onClose={() => setShowAffiliateModal(false)}
      />
    </div>
  );
};
