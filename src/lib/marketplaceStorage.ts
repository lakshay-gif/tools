import { MarketplaceItem, CreatorAffiliateData } from '../types';

const STORAGE_KEY_ITEMS = 'toolshub_marketplace_items';
const STORAGE_KEY_ADMIN = 'toolshub_admin_session';
const STORAGE_KEY_AFFILIATE = 'toolshub_creator_affiliate';

export const ADMIN_DEFAULT_PASSCODE = 'admin2026';

export const INITIAL_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: 'ebook-privacy-handbook',
    title: 'The Modern Digital Privacy & Security Handbook',
    type: 'ebook',
    category: 'Ebooks & Guides',
    authorOrBrand: 'CyberSec Publishing',
    price: '$14.99',
    originalPrice: '$29.99',
    badge: 'Bestseller',
    description: 'A comprehensive 280-page practical guide to personal data isolation, client-side encryption, safe document management, and preventing corporate tracking.',
    affiliateUrl: 'https://amazon.com/dp/example-privacy-handbook?tag=toolshub-20',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    featured: true,
    commissionNote: 'Earn up to 10% per sale through Amazon Associates affiliate program',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'product-yubikey-security',
    title: 'YubiKey 5C NFC Hardware Security Key',
    type: 'product',
    category: 'Hardware & Security',
    authorOrBrand: 'Yubico',
    price: '$55.00',
    originalPrice: '$65.00',
    badge: 'Hardware Essential',
    description: 'FIDO2 / WebAuthn physical security key that eliminates account takeovers, protects client logins, and shields sensitive document storage from phishing.',
    affiliateUrl: 'https://www.yubico.com/store/yubikey-5c-nfc?ref=toolshub',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    featured: true,
    commissionNote: '12% hardware referral payout',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'software-nordvpn-privacy',
    title: 'Proton Pass & VPN Unlimited Annual Suite',
    type: 'software',
    category: 'Software & SaaS',
    authorOrBrand: 'Proton AG',
    price: '$59.88/yr',
    originalPrice: '$119.88/yr',
    badge: '50% OFF',
    description: 'Swiss-based zero-logs encrypted VPN and password manager with end-to-end encryption for protecting document transfers and remote work.',
    affiliateUrl: 'https://proton.me/vpn?aff=toolshub',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
    featured: true,
    commissionNote: '35% SaaS recurring commission',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'ebook-clean-architecture',
    title: 'Mastering TypeScript & Modern Frontend Architecture',
    type: 'ebook',
    category: 'Ebooks & Guides',
    authorOrBrand: 'OReilly Tech Press',
    price: '$22.50',
    originalPrice: '$39.00',
    badge: 'Popular',
    description: 'Deep dive into high-performance WebAssembly, client-side binary streams, canvas rendering, and scalable React application design.',
    affiliateUrl: 'https://oreilly.com/library/view/modern-architecture?ref=toolshub',
    imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3dd45?w=600&auto=format&fit=crop&q=80',
    featured: false,
    commissionNote: '15% digital publication affiliate commission',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'product-paperwhite-reader',
    title: 'Kindle Paperwhite Signature Edition (32GB)',
    type: 'product',
    category: 'Hardware & Security',
    authorOrBrand: 'Amazon Devices',
    price: '$189.99',
    originalPrice: '$219.99',
    badge: 'Staff Pick',
    description: 'Glare-free 300 ppi display with adjustable warm light. Perfect for reading converted PDF dark mode and sepia whitepapers on the go.',
    affiliateUrl: 'https://amazon.com/Kindle-Paperwhite-Signature/dp/B08B495319?tag=toolshub-20',
    imageUrl: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=600&auto=format&fit=crop&q=80',
    featured: false,
    commissionNote: '8% Amazon Associates commission',
    createdAt: Date.now() - 86400000,
  }
];

export function getMarketplaceItems(): MarketplaceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(INITIAL_MARKETPLACE_ITEMS));
      return INITIAL_MARKETPLACE_ITEMS;
    }
    const items = JSON.parse(raw);
    return Array.isArray(items) && items.length > 0 ? items : INITIAL_MARKETPLACE_ITEMS;
  } catch {
    return INITIAL_MARKETPLACE_ITEMS;
  }
}

export function saveMarketplaceItem(item: Omit<MarketplaceItem, 'id' | 'createdAt'> & { id?: string }): MarketplaceItem {
  const items = getMarketplaceItems();
  let updatedItem: MarketplaceItem;

  if (item.id) {
    // Edit existing
    const existingIndex = items.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      updatedItem = {
        ...items[existingIndex],
        ...item,
        id: item.id,
      };
      items[existingIndex] = updatedItem;
    } else {
      updatedItem = {
        ...item,
        id: item.id,
        createdAt: Date.now(),
      };
      items.unshift(updatedItem);
    }
  } else {
    // Create new
    updatedItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    items.unshift(updatedItem);
  }

  localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  return updatedItem;
}

export function deleteMarketplaceItem(id: string): void {
  const items = getMarketplaceItems().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
}

export function resetMarketplaceItems(): void {
  localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(INITIAL_MARKETPLACE_ITEMS));
}

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

export function checkIsAdmin(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN) === 'true';
  } catch {
    return false;
  }
}

export function loginAdmin(passcode: string): boolean {
  if (passcode.trim() === ADMIN_DEFAULT_PASSCODE) {
    localStorage.setItem(STORAGE_KEY_ADMIN, 'true');
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  localStorage.removeItem(STORAGE_KEY_ADMIN);
}

// ==========================================
// CREATOR AFFILIATE MARKETING PROGRAM
// ==========================================

const DEFAULT_CREATOR_AFFILIATE: CreatorAffiliateData = {
  creatorHandle: 'creator_vip',
  referralCode: 'CREATOR30',
  payoutMethod: 'paypal',
  payoutEmail: 'creator@example.com',
  clicks: 142,
  conversions: 8,
  totalEarnings: 167.92,
  pendingPayout: 167.92,
  paidPayout: 0,
};

export function getCreatorAffiliateData(): CreatorAffiliateData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AFFILIATE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AFFILIATE, JSON.stringify(DEFAULT_CREATOR_AFFILIATE));
      return DEFAULT_CREATOR_AFFILIATE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CREATOR_AFFILIATE;
  }
}

export function saveCreatorAffiliateData(data: Partial<CreatorAffiliateData>): CreatorAffiliateData {
  const current = getCreatorAffiliateData();
  const updated: CreatorAffiliateData = { ...current, ...data };
  localStorage.setItem(STORAGE_KEY_AFFILIATE, JSON.stringify(updated));
  return updated;
}

export function simulateAffiliateConversion(planType: 'monthly' | 'yearly' | 'lifetime'): { commission: number; updated: CreatorAffiliateData } {
  const current = getCreatorAffiliateData();
  // 30% commission
  let commission = 2.99; // $9.99 * 30%
  if (planType === 'yearly') commission = 20.99; // $69.99 * 30%
  if (planType === 'lifetime') commission = 29.99; // $99.99 * 30%

  const updated: CreatorAffiliateData = {
    ...current,
    clicks: current.clicks + Math.floor(Math.random() * 4) + 1,
    conversions: current.conversions + 1,
    totalEarnings: Math.round((current.totalEarnings + commission) * 100) / 100,
    pendingPayout: Math.round((current.pendingPayout + commission) * 100) / 100,
  };

  localStorage.setItem(STORAGE_KEY_AFFILIATE, JSON.stringify(updated));
  return { commission, updated };
}
