import type {
  CancellationPolicy,
  FAQItem,
  FleetCategory,
  NavigationItem,
  Page,
  PricingConfig,
  Promotion,
  SiteSettings,
  Vehicle,
} from '@/types';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

async function publicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}/api/public/${path}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`CMS request failed: ${path} (${response.status})`);
  }
  const payload = await response.json() as ApiResponse<T>;
  return payload.data;
}

export type ContactSettings = {
  phoneNumber: string;
  contactEmail: string;
  address: string;
  socialLinks: SiteSettings['socialLinks'];
};

export async function getSiteSettings(): Promise<SiteSettings> {
  return publicApi<SiteSettings>('site-settings');
}

export async function getContact(): Promise<ContactSettings> {
  const settings = await getSiteSettings();
  return {
    phoneNumber: settings.phoneNumber,
    contactEmail: settings.contactEmail,
    address: settings.address,
    socialLinks: settings.socialLinks,
  };
}

export const getNavigation = () => publicApi<NavigationItem[]>('navigation');
export const getVehicles = () => publicApi<Vehicle[]>('fleet');
export const getCategories = () => publicApi<FleetCategory[]>('fleet/categories');
export const getFaqs = () => publicApi<FAQItem[]>('faqs');
export const getPromotions = () => publicApi<Promotion[]>('promotions');
export const getCancellation = () => publicApi<CancellationPolicy>('cancellation-policy');
export const getPage = (slug: string) => publicApi<Page>(`pages/${encodeURIComponent(slug)}`);

export async function getPricing(): Promise<PricingConfig> {
  const data = await publicApi<{ pricing: PricingConfig }>('pricing');
  return data.pricing;
}

export async function getLayoutCms() {
  const [settings, navigation] = await Promise.all([getSiteSettings(), getNavigation()]);
  return { settings, navigation };
}
