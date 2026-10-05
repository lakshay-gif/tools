import React, { useState } from 'react';
import {
  X, Sparkles, DollarSign, Copy, Check, TrendingUp, Users, ArrowUpRight,
  ShieldCheck, Share2, PlayCircle, Wallet, Gift, ExternalLink, RefreshCw
} from 'lucide-react';
import {
  getCreatorAffiliateData,
  saveCreatorAffiliateData,
  simulateAffiliateConversion
} from '../../lib/marketplaceStorage';
import { CreatorAffiliateData } from '../../types';

interface AffiliateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateProgramModal: React.FC<AffiliateProgramModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<CreatorAffiliateData>(() => getCreatorAffiliateData());
  const [handle, setHandle] = useState(data.creatorHandle);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'assets' | 'payout'>('dashboard');
  const [referralCount, setReferralCount] = useState<number>(35);
  const [simulating, setSimulating] = useState(false);
  const [simulationNote, setSimulationNote] = useState<string | null>(null);

  if (!isOpen) return null;

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://toolshub.local';
  const referralLink = `${appOrigin}/?ref=${handle.trim() || 'creator'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveHandle = () => {
    if (!handle.trim()) return;
    const updated = saveCreatorAffiliateData({
      creatorHandle: handle.trim(),
      referralCode: handle.trim().toUpperCase(),
    });
    setData(updated);
  };

  const handleSimulate = (plan: 'monthly' | 'yearly' | 'lifetime') => {
    setSimulating(true);
    const { commission, updated } = simulateAffiliateConversion(plan);
    setData(updated);
    setSimulationNote(`+ $${commission.toFixed(2)} commission earned from a referred ${plan} plan buy!`);
    setTimeout(() => {
      setSimulating(false);
    }, 500);
    setTimeout(() => {
      setSimulationNote(null);
    }, 4000);
  };

  // Calculator estimates
  // Assuming 60% yearly ($20.99) and 40% monthly ($2.99 * 12 = $35.88)
  const estimatedAnnual = Math.round(referralCount * 26.5);
  const estimatedMonthly = Math.round(estimatedAnnual / 12);

  const samplePromoScript = `🔥 I stopped uploading my PDFs to random cloud servers. ToolsHub (https://toolshub.local/?ref=${handle}) processes 100% of your PDFs, Word docs, Excel files, and signatures directly in your local browser with ZERO file uploads! Use my link for access to lifetime private document tools.`;

  const handleCopyPromo = () => {
    navigator.clipboard.writeText(samplePromoScript);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <Gift className="w-3.5 h-3.5" />
              <span>Creator Affiliate Program</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Earn <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">30% Recurring Commission</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Recommend 100% private in-browser document tools to your audience. Earn passive income on every paid plan purchase.
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Your Lifetime Earnings</span>
            <span className="text-2xl font-black text-emerald-400">${data.totalEarnings.toFixed(2)}</span>
            <span className="text-[11px] text-slate-400 block">${data.pendingPayout.toFixed(2)} pending payout</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
          {[
            { id: 'dashboard', label: 'Affiliate Dashboard', icon: TrendingUp },
            { id: 'calculator', label: 'Income Calculator', icon: DollarSign },
            { id: 'assets', label: 'Promo Scripts & Copy', icon: Share2 },
            { id: 'payout', label: 'Payout Settings', icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Referral Link Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Your Unique Creator Referral Link</span>
                <span className="text-[11px] text-emerald-400 font-medium">30% Auto-Attributed Lifetime Cookie</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-blue-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500">Custom handle:</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="your_handle"
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono w-36 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSaveHandle}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  Update Handle
                </button>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Total Link Clicks</span>
                <span className="text-xl font-bold text-white mt-1 block">{data.clicks}</span>
                <span className="text-[10px] text-emerald-400">High intent visitors</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Paid Conversions</span>
                <span className="text-xl font-bold text-white mt-1 block">{data.conversions}</span>
                <span className="text-[10px] text-emerald-400">Paid plan buys</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Conversion Rate</span>
                <span className="text-xl font-bold text-white mt-1 block">
                  {data.clicks > 0 ? ((data.conversions / data.clicks) * 100).toFixed(1) : '0.0'}%
                </span>
                <span className="text-[10px] text-blue-400">Above industry avg</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-500 block">Pending Payout</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">${data.pendingPayout.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400">Auto-payout on 1st</span>
              </div>
            </div>

            {/* Test Simulation Controls */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test Referral Tracking Engine</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Simulate a customer purchasing a paid plan through your referral link:</p>
                </div>
                {simulationNote && (
                  <span className="text-xs font-bold text-emerald-400 animate-pulse bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    {simulationNote}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => handleSimulate('monthly')}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer text-center"
                >
                  <div className="text-[11px] text-slate-400">Pro Monthly ($9.99)</div>
                  <div className="text-emerald-400 font-bold mt-0.5">+ $2.99 Commission</div>
                </button>
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => handleSimulate('yearly')}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer text-center"
                >
                  <div className="text-[11px] text-slate-400">Pro Yearly ($69.99)</div>
                  <div className="text-emerald-400 font-bold mt-0.5">+ $20.99 Commission</div>
                </button>
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => handleSimulate('lifetime')}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer text-center"
                >
                  <div className="text-[11px] text-slate-400">Lifetime Pass ($99.99)</div>
                  <div className="text-emerald-400 font-bold mt-0.5">+ $29.99 Commission</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-200">Referred Paying Customers</span>
                  <span className="text-lg font-black text-blue-400 font-mono">{referralCount} Users</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={500}
                  step={5}
                  value={referralCount}
                  onChange={(e) => setReferralCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>5 users</span>
                  <span>100 users</span>
                  <span>250 users</span>
                  <span>500 users</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <div>
                  <span className="text-xs text-slate-400 block">Estimated Monthly Income</span>
                  <span className="text-3xl font-black text-emerald-400 mt-1 block">${estimatedMonthly.toLocaleString()}/mo</span>
                  <span className="text-[11px] text-slate-500">Recurring passive earnings</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Estimated Annual Income</span>
                  <span className="text-3xl font-black text-white mt-1 block">${estimatedAnnual.toLocaleString()}/yr</span>
                  <span className="text-[11px] text-emerald-400">30% recurring payout</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
                <p className="font-semibold text-slate-200">Why ToolsHub converts so well:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>100% Client-Side Privacy:</strong> No server uploads — the #1 feature privacy-conscious users actively search for.</li>
                  <li><strong>Generous 30-Day Cookie Window:</strong> If someone clicks your link and buys within 30 days, you earn commission.</li>
                  <li><strong>Monthly Recurring Attribution:</strong> You earn commission every month or year the customer renews.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROMO ASSETS */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Pre-Written YouTube & Social Post Description</span>
                <button
                  type="button"
                  onClick={handleCopyPromo}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied Script!' : 'Copy Script'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={4}
                value={samplePromoScript}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans focus:outline-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">Creator Promotion Ideas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-white block mb-0.5">YouTube Video Sponsorship</span>
                  <span>Demonstrate PDF merge & redact in 30 seconds. Highlight zero file upload privacy.</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="font-semibold text-white block mb-0.5">Newsletter / Blog Review</span>
                  <span>Feature ToolsHub in your "Top 10 Productivity Tools" or "Privacy Tools for 2026".</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYOUT SETTINGS */}
        {activeTab === 'payout' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Payout Method</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'paypal', label: 'PayPal Instant' },
                  { id: 'stripe', label: 'Stripe Direct' },
                  { id: 'bank', label: 'Bank Wire Transfer' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      const updated = saveCreatorAffiliateData({ payoutMethod: m.id as any });
                      setData(updated);
                    }}
                    className={`p-3 rounded-xl border text-center text-xs font-medium cursor-pointer transition-all ${
                      data.payoutMethod === m.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Payout Email / Account Identifier
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={data.payoutEmail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setData((prev) => ({ ...prev, payoutEmail: val }));
                    }}
                    placeholder="your-paypal-email@example.com"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => saveCreatorAffiliateData({ payoutEmail: data.payoutEmail })}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Save Details
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Payouts are disbursed automatically on the 1st of every month with a $20 minimum threshold.</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Direct automatic payouts • Zero platform deductions</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Close Portal
          </button>
        </div>
      </div>
    </div>
  );
};
