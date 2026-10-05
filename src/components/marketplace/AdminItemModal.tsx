import React, { useState, useEffect } from 'react';
import { X, Link2, BookOpen, ShoppingBag, Sparkles, Tag, DollarSign, Image, CheckCircle2 } from 'lucide-react';
import { MarketplaceItem, MarketplaceItemType } from '../../types';
import { saveMarketplaceItem } from '../../lib/marketplaceStorage';

interface AdminItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialItem?: MarketplaceItem | null;
}

const PRESET_IMAGES = [
  { label: 'Ebook / Reading Cover', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80' },
  { label: 'Hardware Key', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80' },
  { label: 'Software / Cyber Shield', url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80' },
  { label: 'Technical Guide', url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3dd45?w=600&auto=format&fit=crop&q=80' },
  { label: 'Tablet / Reader', url: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&auto=format&fit=crop&q=80' },
];

export const AdminItemModal: React.FC<AdminItemModalProps> = ({ isOpen, onClose, onSaved, initialItem }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MarketplaceItemType>('ebook');
  const [category, setCategory] = useState('Ebooks & Guides');
  const [authorOrBrand, setAuthorOrBrand] = useState('');
  const [description, setDescription] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [badge, setBadge] = useState('Featured');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [commissionNote, setCommissionNote] = useState('');
  const [featured, setFeatured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title);
      setType(initialItem.type);
      setCategory(initialItem.category);
      setAuthorOrBrand(initialItem.authorOrBrand || '');
      setDescription(initialItem.description);
      setAffiliateUrl(initialItem.affiliateUrl);
      setPrice(initialItem.price);
      setOriginalPrice(initialItem.originalPrice || '');
      setBadge(initialItem.badge || '');
      setImageUrl(initialItem.imageUrl || PRESET_IMAGES[0].url);
      setCommissionNote(initialItem.commissionNote || '');
      setFeatured(!!initialItem.featured);
    } else {
      // Defaults for new item
      setTitle('');
      setType('ebook');
      setCategory('Ebooks & Guides');
      setAuthorOrBrand('');
      setDescription('');
      setAffiliateUrl('');
      setPrice('$19.99');
      setOriginalPrice('$39.99');
      setBadge('Staff Pick');
      setImageUrl(PRESET_IMAGES[0].url);
      setCommissionNote('15% affiliate partner commission');
      setFeatured(true);
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title.');
      return;
    }
    if (!affiliateUrl.trim()) {
      setError('Please provide the affiliate link URL.');
      return;
    }
    if (!price.trim()) {
      setError('Please enter a display price.');
      return;
    }

    saveMarketplaceItem({
      id: initialItem?.id,
      title: title.trim(),
      type,
      category,
      authorOrBrand: authorOrBrand.trim(),
      description: description.trim(),
      affiliateUrl: affiliateUrl.trim(),
      price: price.trim(),
      originalPrice: originalPrice.trim() || undefined,
      badge: badge.trim() || undefined,
      imageUrl: imageUrl.trim(),
      commissionNote: commissionNote.trim() || undefined,
      featured,
    });

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {initialItem ? 'Edit Affiliate Item' : 'Add Affiliate Product / Ebook Link'}
            </h3>
            <p className="text-xs text-slate-400">Admin Portal • Direct affiliate and partner link injection</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Item Classification</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ebook', label: 'Ebook / PDF Guide', icon: BookOpen },
                { id: 'product', label: 'Affiliate Product', icon: ShoppingBag },
                { id: 'software', label: 'Software / SaaS', icon: Sparkles },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setType(opt.id as MarketplaceItemType);
                      if (opt.id === 'ebook') setCategory('Ebooks & Guides');
                      if (opt.id === 'product') setCategory('Hardware & Security');
                      if (opt.id === 'software') setCategory('Software & SaaS');
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      active
                        ? 'border-blue-500 bg-blue-500/10 text-white font-medium'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-xs truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title and Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Item Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Masterclass PDF Handbook"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Author / Brand</label>
              <input
                type="text"
                value={authorOrBrand}
                onChange={(e) => setAuthorOrBrand(e.target.value)}
                placeholder="e.g. O'Reilly or Amazon"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Target Affiliate Link */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Affiliate Destination Link (URL) *
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="url"
                required
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://amazon.com/dp/xxx?tag=yourtag or https://partner.com/?ref=yourid"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Users clicking "Buy / Access Deal" will be redirected safely with rel="noopener noreferrer sponsored".</p>
          </div>

          {/* Price, Discount, Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Price / Deal Tag *</label>
              <input
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="$19.99 or Free Sample"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Original Price (Strike)</label>
              <input
                type="text"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="$39.99"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Badge / Tag</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Top Pick, 50% OFF, Bestseller"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Description & Highlights</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the product, who it's for, and key features..."
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Image URL & Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Cover Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-blue-500 mb-2"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500">Preset covers:</span>
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Partner / Commission Notes & Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Admin Affiliate Note (Optional)</label>
              <input
                type="text"
                value={commissionNote}
                onChange={(e) => setCommissionNote(e.target.value)}
                placeholder="e.g. 15% commission per sale"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-medium text-slate-300">Highlight as Featured Deal</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialItem ? 'Update Listing' : 'Publish Affiliate Listing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
