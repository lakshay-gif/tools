import React, { useState } from 'react';
import {
  Gift, DollarSign, Copy, Check, TrendingUp, Users, ArrowRight,
  ShieldCheck, Share2, Wallet, Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';
import {
  getCreatorAffiliateData,
  saveCreatorAffiliateData,
  simulateAffiliateConversion
} from '../lib/marketplaceStorage';
import { CreatorAffiliateData } from '../types';

interface AffiliatesPageProps {
  onNavigate: (route: string) => void;
}

export const AffiliatesPage: React.FC<AffiliatesPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<CreatorAffiliateData>(() => getCreatorAffiliateData());
  const [handle, setHandle] = useState(data.creatorHandle);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [referralCount, setReferralCount] = useState<number>(50);
  const [simulating, setSimulating] = useState(false);
  const [simulationNote, setSimulationNote] = useState<string | null>(null);

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
    setSimulationNote(`+ $${commission.toFixed(2)} commission earned on ${plan} plan referral!`);
    setTimeout(() => setSimulating(false), 500);
    setTimeout(() => setSimulationNote(null), 4000);
  };

  const estimatedAnnual = Math.round(referralCount * 26.5);
  const estimatedMonthly = Math.round(estimatedAnnual / 12);

  const promoCopy = `🔒 Did you know standard PDF websites upload your sensitive files to cloud servers? Check out ToolsHub (https://toolshub.local/?ref=${handle}) — 100% of your documents process locally inside your browser memory with zero file uploads. Use my link for privacy-first tools!`;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
        <button onClick={() => onNavigate('/')} className="hover:text-slate-200 transition-colors cursor-pointer">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-200">Creator Affiliate Program</span>
      </nav>

      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Gift className="w-3.5 h-3.5" />
          <span>Creator & Partner Program</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Earn <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">30% Recurring Commission</span> on Every Paid Plan Sale
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Share ToolsHub with your audience, colleagues, or YouTube viewers. Earn 30% monthly or yearly recurring payouts for every Pro Monthly, Pro Yearly, and Lifetime Pass purchase.
        </p>
      </div>

      {/* Commission Rates Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2 text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pro Monthly Plan</span>
          <div className="text-3xl font-black text-emerald-400">$2.99 / mo</div>
          <p className="text-xs text-slate-400">Recurring 30% commission every single month the customer stays subscribed.</p>
        </div>
        <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-emerald-950/30 border border-emerald-500/30 space-y-2 text-center shadow-xl">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Pro Yearly Plan (Most Popular)</span>
          <div className="text-3xl font-black text-white">$20.99 / yr</div>
          <p className="text-xs text-slate-300">Large upfront payout plus annual recurring commission upon renewal.</p>
        </div>
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2 text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lifetime Pass</span>
          <div className="text-3xl font-black text-blue-400">$29.99</div>
          <p className="text-xs text-slate-400">Instant one-time 30% commission per referral with no recurring dependencies.</p>
        </div>
      </div>

      {/* Referral Link & Dashboard */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Your Custom Affiliate Tracking Link</h2>
            <p className="text-xs text-slate-400">Includes a 30-day cookie window and automatic attribution</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Total Lifetime Earnings</span>
            <span className="text-2xl font-black text-emerald-400">${data.totalEarnings.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 font-mono text-xs text-blue-300 focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied Link!' : 'Copy Referral Link'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-slate-400">Customize handle:</span>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono w-40 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSaveHandle}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            Save Handle
          </button>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 block">Link Clicks</span>
            <span className="text-2xl font-black text-white mt-1 block">{data.clicks}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 block">Paid Customers</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{data.conversions}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 block">Conversion Rate</span>
            <span className="text-2xl font-black text-blue-400 mt-1 block">
              {data.clicks > 0 ? ((data.conversions / data.clicks) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-xs text-slate-400 block">Pending Payout</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">${data.pendingPayout.toFixed(2)}</span>
          </div>
        </div>

        {/* Test conversion simulation */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Referral Sale for Testing</span>
            </span>
            {simulationNote && (
              <span className="text-xs font-bold text-emerald-400 animate-pulse bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {simulationNote}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSimulate('monthly')}
              disabled={simulating}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-center cursor-pointer transition-colors"
            >
              <div className="text-slate-400 text-[11px]">Monthly ($9.99)</div>
              <div className="text-emerald-400 font-bold">+ $2.99</div>
            </button>
            <button
              onClick={() => handleSimulate('yearly')}
              disabled={simulating}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-center cursor-pointer transition-colors"
            >
              <div className="text-slate-400 text-[11px]">Yearly ($69.99)</div>
              <div className="text-emerald-400 font-bold">+ $20.99</div>
            </button>
            <button
              onClick={() => handleSimulate('lifetime')}
              disabled={simulating}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-center cursor-pointer transition-colors"
            >
              <div className="text-slate-400 text-[11px]">Lifetime ($99.99)</div>
              <div className="text-emerald-400 font-bold">+ $29.99</div>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Income Calculator */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Earnings Forecast</span>
          <h2 className="text-2xl font-black text-white mt-1">Interactive Affiliate Revenue Calculator</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">Audience Referrals:</span>
            <span className="text-xl font-black text-blue-400 font-mono">{referralCount} Customers</span>
          </div>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={referralCount}
            onChange={(e) => setReferralCount(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 block">Est. Monthly Recurring Income</span>
            <span className="text-4xl font-black text-emerald-400 mt-2 block">${estimatedMonthly.toLocaleString()}/mo</span>
            <span className="text-[11px] text-slate-500">Compounds with every new sign-up</span>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 block">Est. Annual Passive Income</span>
            <span className="text-4xl font-black text-white mt-2 block">${estimatedAnnual.toLocaleString()}/yr</span>
            <span className="text-[11px] text-emerald-400">Guaranteed 30% commission rate</span>
          </div>
        </div>
      </div>

      {/* Copyable Promo Script */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Copyable Promotion Description</h3>
            <p className="text-xs text-slate-400">Perfect for YouTube video descriptions, blog reviews, and newsletters</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(promoCopy);
              setCopiedText(true);
              setTimeout(() => setCopiedText(false), 2000);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Copied Description!' : 'Copy Script'}</span>
          </button>
        </div>
        <textarea
          readOnly
          rows={3}
          value={promoCopy}
          className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-sans focus:outline-none"
        />
      </div>
    </div>
  );
};
