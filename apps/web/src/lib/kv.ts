import { Redis } from '@upstash/redis';
import type { PricingConfig, SiteSettings, CancellationPolicy, Vehicle, FleetCategory, FAQItem, Promotion, NavigationItem } from '@/types';
import {
  pricingConfig as defaultPricing,
  siteSettings as defaultSettings,
  cancellationPolicy as defaultCancellation,
  vehicles as defaultVehicles,
  fleetCategories as defaultCategories,
  faqItems as defaultFaqs,
  promotions as defaultPromos,
  navigation as defaultNav,
} from './data';

export type ContactSettings = {
  phoneNumber: string;
  contactEmail: string;
  address: string;
  socialLinks: { twitter: string; instagram: string; linkedin: string };
};

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

async function kvGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const redis = getRedis();
    if (!redis) return fallback;
    const val = await redis.get<T>(`rp:${key}`);
    return val ?? fallback;
  } catch {
    return fallback;
  }
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error('Redis not configured');
  await redis.set(`rp:${key}`, value);
}

const defaultContact: ContactSettings = {
  phoneNumber: defaultSettings.phoneNumber,
  contactEmail: defaultSettings.contactEmail,
  address: defaultSettings.address,
  socialLinks: {
    twitter: defaultSettings.socialLinks.twitter || '',
    instagram: defaultSettings.socialLinks.instagram || '',
    linkedin: defaultSettings.socialLinks.linkedin || '',
  },
};

export const getPricing     = () => kvGet<PricingConfig>('pricing', defaultPricing);
export const getCancellation = () => kvGet<CancellationPolicy>('cancellation', defaultCancellation);
export const getSettings    = () => kvGet<SiteSettings>('settings', defaultSettings);
export const getContact     = () => kvGet<ContactSettings>('contact', defaultContact);
export const getVehicles    = () => kvGet<Vehicle[]>('vehicles', defaultVehicles);
export const getCategories  = () => kvGet<FleetCategory[]>('categories', defaultCategories);
export const getFaqs        = () => kvGet<FAQItem[]>('faqs', defaultFaqs);
export const getPromotions  = () => kvGet<Promotion[]>('promotions', defaultPromos);
export const getNavigation  = () => kvGet<NavigationItem[]>('navigation', defaultNav);
