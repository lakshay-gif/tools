import { PlanConfig, PlanLimits, PlanType } from '../types';

export const DEFAULT_FREE_LIMITS: PlanLimits = {
  pdfMergeMaxFiles: 5,
  batchProcessing: false,
  maxSavedSignatures: 1,
  premiumTemplates: false,
  adFree: false,
  maxFileSizeMB: 100,
};

export const PRO_LIMITS: PlanLimits = {
  pdfMergeMaxFiles: 999,
  batchProcessing: true,
  maxSavedSignatures: 999,
  premiumTemplates: true,
  adFree: true,
  maxFileSizeMB: 1000,
};

export const PLANS_CONFIG: Record<PlanType, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Forever',
    price: '$0',
    period: 'always free',
    description: 'Perfect for quick individual documents and everyday lightweight tasks.',
    features: [
      'Merge up to 5 PDF files at once',
      'Basic document templates (Rent, Resignation)',
      '1 saved custom signature in local storage',
      'Word Counter & Text Cleaner with all formatting tools',
      '100% Client-side privacy (zero server uploads)',
      'Ad-supported experience'
    ],
    limits: DEFAULT_FREE_LIMITS,
    ctaText: 'Current Plan',
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price: '$9',
    period: 'per month',
    description: 'For professionals, freelancers, and businesses processing heavy documents.',
    features: [
      'Unlimited PDF file merging & bulk splitting',
      'Full access to all Premium Legal & Contract Templates',
      'Unlimited saved signatures in local IndexedDB',
      '100% Ad-free distraction-free interface',
      'High-speed batch image and PDF exports',
      'Priority offline caching & zero limits'
    ],
    limits: PRO_LIMITS,
    ctaText: 'Upgrade to Pro Monthly',
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    price: '$69',
    period: 'per year',
    popular: true,
    description: 'Save 36% with annual billing. Our most popular plan for power users.',
    features: [
      'Everything in Pro Monthly',
      'Save over $39 annually',
      'Free access to all current & future Marketplace Packs',
      'Early access to new WASM and client-side offline tools',
      'VIP priority feature requests'
    ],
    limits: PRO_LIMITS,
    ctaText: 'Get Pro Yearly (Save 36%)',
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Access',
    price: '$149',
    period: 'one-time payment',
    description: 'Pay once, own forever. Never worry about recurring monthly charges.',
    features: [
      'All Pro features forever with zero subscriptions',
      'Includes all future tools, updates, and templates',
      'Multi-device local syncing license',
      'Direct contact with core product engineering'
    ],
    limits: PRO_LIMITS,
    ctaText: 'Buy Lifetime Access',
  },
};
