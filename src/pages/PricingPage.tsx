import React, { useState } from 'react';
import { PLANS_CONFIG } from '../config/plans.config';
import { PlanType } from '../types';
import { usePlan } from '../context/PlanContext';
import { Check, Sparkles, Shield, CreditCard, HelpCircle, Zap, Lock, Gift } from 'lucide-react';
import { AdSlot } from '../components/common/AdSlot';

interface PricingPageProps {
  onNavigate: (route: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const { currentPlan, isPro, setPlan, activateProForTesting, resetToFree, openUpgradeModal } = usePlan();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const plansList: PlanType[] = ['free', billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly', 'lifetime'];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-900/60 uppercase tracking-wider">
          Transparent, Fair Pricing
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Simple Plans. Unlimited Local Privacy.
        </h1>
        <p className="text-sm text-slate-400">
          Core tool exports are always 100% free. Upgrade to Pro for unlimited bulk batching, ad-free focus, and all premium legal template packs.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold mt-4">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              billingCycle === 'monthly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'yearly' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500 text-slate-950 font-bold uppercase">
              Save 36%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plansList.map((planId) => {
          const plan = PLANS_CONFIG[planId];
          const isCurrent = currentPlan === planId;
          const isPopular = plan.popular;

          return (
            <div
              key={planId}
              className={`relative rounded-3xl border p-7 flex flex-col justify-between transition-all ${
                isPopular
                  ? 'border-blue-500 bg-slate-900/90 shadow-2xl shadow-blue-950/30 ring-2 ring-blue-500/20'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white uppercase tracking-wider shadow-md">
                  Most Popular Choice
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>

                <div className="mt-5 pb-5 border-b border-slate-800 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-medium">/{plan.period.replace('per ', '')}</span>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700 cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => openUpgradeModal(`Upgrade to ${plan.name} to remove limits.`)}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                      isPopular
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-950/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    {plan.ctaText}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Evaluator / Testing Callout */}
      <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-blue-300">
          <Zap className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            Testing mode enabled: You can toggle Pro status on/off instantly without entering real credit card details.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isPro ? (
            <button
              onClick={resetToFree}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer font-medium"
            >
              Reset to Free Plan
            </button>
          ) : (
            <button
              onClick={activateProForTesting}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow"
            >
              Activate Pro Instantly
            </button>
          )}
        </div>
      </div>

      {/* Creator Affiliate Callout Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
            <Gift className="w-3.5 h-3.5" />
            <span>Earn 30% Recurring Commission</span>
          </div>
          <h4 className="text-base font-bold text-white">Are you a Content Creator, Developer, or Publisher?</h4>
          <p className="text-xs text-slate-400">
            Recommend ToolsHub to your audience and earn 30% commission every month or year on all paid plan buys.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/affiliates')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0 shadow-lg shadow-emerald-900/30 cursor-pointer"
        >
          Join Creator Program →
        </button>
      </div>

      {/* Feature Comparison Matrix */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
        <h3 className="text-xl font-bold text-white text-center">Plan Comparison Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Features & Capabilities</th>
                <th className="py-3 px-4 font-semibold text-center">Free Forever</th>
                <th className="py-3 px-4 font-semibold text-center text-blue-400">ToolsHub Pro</th>
                <th className="py-3 px-4 font-semibold text-center text-indigo-400">Lifetime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Client-Side File Privacy</td>
                <td className="py-3.5 px-4 text-center text-emerald-400">100% (Zero uploads)</td>
                <td className="py-3.5 px-4 text-center text-emerald-400">100% (Zero uploads)</td>
                <td className="py-3.5 px-4 text-center text-emerald-400">100% (Zero uploads)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">PDF Merge File Limit</td>
                <td className="py-3.5 px-4 text-center text-slate-400">Max 5 files / run</td>
                <td className="py-3.5 px-4 text-center font-bold text-blue-400">Unlimited</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-400">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Saved Signatures Vault</td>
                <td className="py-3.5 px-4 text-center text-slate-400">1 signature</td>
                <td className="py-3.5 px-4 text-center font-bold text-blue-400">Unlimited (IndexedDB)</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-400">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Legal & Commercial Templates</td>
                <td className="py-3.5 px-4 text-center text-slate-400">Standard Templates</td>
                <td className="py-3.5 px-4 text-center font-bold text-blue-400">All Packs & Addendums</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-400">All Packs & Addendums</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Ad Experience</td>
                <td className="py-3.5 px-4 text-center text-slate-400">Non-intrusive Ads</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-400">100% Ad-Free</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-400">100% Ad-Free</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Free File Downloads</td>
                <td className="py-3.5 px-4 text-center text-emerald-400">Always Free</td>
                <td className="py-3.5 px-4 text-center text-emerald-400">Always Free</td>
                <td className="py-3.5 px-4 text-center text-emerald-400">Always Free</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing FAQs */}
      <section className="space-y-4 max-w-3xl mx-auto pt-6">
        <h3 className="text-xl font-bold text-white text-center">Billing & Privacy FAQs</h3>
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
            <h4 className="font-semibold text-slate-200">How do you process files if you have $0 server cost?</h4>
            <p className="text-slate-400">
              Modern web browsers are powerful computers. We compile file processors into WebAssembly and pure client-side JavaScript. Everything executes in your device’s browser tab!
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
            <h4 className="font-semibold text-slate-200">Can I cancel my subscription anytime?</h4>
            <p className="text-slate-400">
              Yes, you can cancel your Pro Monthly or Pro Yearly subscription with one click. You will retain access until the end of your billing cycle.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
            <h4 className="font-semibold text-slate-200">What payment methods are supported?</h4>
            <p className="text-slate-400">
              We support all major Credit/Debit cards (Visa, Mastercard, Amex) via Stripe and UPI/Netbanking via Razorpay with encrypted webhook verification.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
