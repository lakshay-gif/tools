export type PlanType = 'free' | 'pro_monthly' | 'pro_yearly' | 'lifetime';

export interface PlanLimits {
  pdfMergeMaxFiles: number;
  batchProcessing: boolean;
  maxSavedSignatures: number;
  premiumTemplates: boolean;
  adFree: boolean;
  maxFileSizeMB: number;
}

export interface PlanConfig {
  id: PlanType;
  name: string;
  price: string;
  period: string;
  popular?: boolean;
  description: string;
  features: string[];
  limits: PlanLimits;
  ctaText: string;
}

export type ToolCategory = 'pdf-documents';

export type ToolSubCategory =
  | 'PDF Organization'
  | 'PDF Editing'
  | 'PDF Extraction'
  | 'PDF Forms & Signing'
  | 'PDF Conversion'
  | 'Format Conversion'
  | 'Security & Privacy'
  | 'Image Utilities'
  | 'Document Utilities';

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  slug: string;
  title: string;
  shortTitle?: string;
  category: ToolCategory;
  categoryName: string;
  subCategory: ToolSubCategory;
  description: string;
  keywords: string[];
  iconName: string;
  isPremium: boolean;
  processingType: 'client';
  badge?: string;
  guideTitle: string;
  guideContent: string[];
  faqs: ToolFaq[];
  featuresList: string[];
  relatedSlugs: string[];
}

export interface SavedSignature {
  id: string;
  title: string;
  dataUrl: string;
  type: 'drawn' | 'typed' | 'uploaded';
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  toolSlug: string;
  toolTitle?: string;
  toolName?: string;
  fileName?: string;
  filename?: string;
  fileSizeStr?: string;
  fileSize?: number;
  details?: string;
  timestamp: number;
  status: 'success' | 'failed';
}

export interface TemplatePack {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  includesCount: number;
  items: string[];
  badge?: string;
  downloadUrl?: string;
}

export type MarketplaceItemType = 'ebook' | 'product' | 'software';

export interface MarketplaceItem {
  id: string;
  title: string;
  type: MarketplaceItemType;
  category: string;
  description: string;
  affiliateUrl: string;
  price: string;
  originalPrice?: string;
  badge?: string;
  authorOrBrand?: string;
  imageUrl?: string;
  featured?: boolean;
  commissionNote?: string;
  createdAt: number;
}

export interface CreatorAffiliateData {
  creatorHandle: string;
  referralCode: string;
  payoutMethod: 'paypal' | 'stripe' | 'bank';
  payoutEmail: string;
  clicks: number;
  conversions: number;
  totalEarnings: number;
  pendingPayout: number;
  paidPayout: number;
}
