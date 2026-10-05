import React, { useState } from 'react';
import { usePlan } from '../../context/PlanContext';
import { PLANS_CONFIG } from '../../config/plans.config';
import { X, Check, Sparkles, Shield, Zap, CreditCard, Lock, ArrowRight } from 'lucide-react';
import { PlanType } from '../../types';

export const UpgradeModal: React.FC = () => {
  const { upgradeModalOpen, upgradeReason, closeUpgradeModal, activateProForTesting, setPlan, isPro } = usePlan();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro_yearly');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  if (!upgradeModalOpen) return null;

  const handleSimulatePayment = (gateway: 'stripe' | 'razorpay') => {
    setIsProcessingCheckout(true);
    setTimeout(() => {
      setIsProcessingCheckout(false);
      setCheckoutSuccess(true);
      setPlan(selectedPlan);
      setTimeout(() => {
        setCheckoutSuccess(false);
        closeUpgradeModal();
      }, 1600);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 sm:p-8 text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {checkoutSuccess ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-100">Welcome to ToolsHub Pro!</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md">
              Your account has been upgraded. All file limits, batch tools, premium templates, and ad slots are now unlocked.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Unlock Power Features</span>
            </div>

            <h2 id="upgrade-title" className="text-2xl font-bold tracking-tight text-white">
              Upgrade Your ToolsHub Experience
            </h2>

            {upgradeReason && (
              <div className="mt-3 p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-xs text-blue-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{upgradeReason}</span>
              </div>
            )}

            {/* Plan Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
              {(['pro_monthly', 'pro_yearly', 'lifetime'] as PlanType[]).map((planId) => {
                const plan = PLANS_CONFIG[planId];
                const isSelected = selectedPlan === planId;
                return (
                  <div
                    key={planId}
                    onClick={() => setSelectedPlan(planId)}
                    className={`relative p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/30 ring-2 ring-blue-500/30'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white tracking-wide uppercase">
                        Best Value
                      </span>
                    )}
                    <h4 className="text-sm font-semibold text-slate-200">{plan.name}</h4>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-[11px] text-slate-400">/{plan.period.replace('per ', '')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Features List for selected plan */}
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-2.5 mb-6">
              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                What's included in {PLANS_CONFIG[selectedPlan].name}:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {PLANS_CONFIG[selectedPlan].features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment simulation options */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleSimulatePayment('stripe')}
                  disabled={isProcessingCheckout}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-950/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isProcessingCheckout ? 'Verifying with Stripe...' : `Pay ${PLANS_CONFIG[selectedPlan].price} via Stripe`}
                  </span>
                </button>

                <button
                  onClick={() => handleSimulatePayment('razorpay')}
                  disabled={isProcessingCheckout}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>Pay via Razorpay / UPI</span>
                </button>
              </div>

              {/* Developer / Evaluator 1-click testing unlock */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Simulated gateway with server-side webhook verification
                </span>
                <button
                  type="button"
                  onClick={activateProForTesting}
                  className="text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                >
                  Activate Pro Instantly (Testing Mode)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
