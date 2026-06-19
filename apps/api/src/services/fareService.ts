import { prisma } from '../lib/db';
import type { VehicleCategory } from '../types';

const hardcodedDefaults = {
  prestige: { ratePerMile: 4.40, hourlyRate: 70 },
  minibus:  { ratePerMile: 4.00, rate16Seater: 420, rate24Seater: 520, rate32Seater: 620 },
  coaches:  { ratePerMile: 4.00, hourlyRate: 110 },
  taxi:     { ratePerMile: 3.00, minimumFare: 8 },
  commissionPercentage: 15,
  driverPayoutPercentage: 100,
};

export type PricingConfig = typeof hardcodedDefaults;

function positiveOrDefault(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export async function getPricingConfig(): Promise<PricingConfig> {
  const p = await prisma.pricingConfig.findUnique({ where: { id: 'default' } });
  if (!p) return hardcodedDefaults;
  return {
    prestige: {
      ratePerMile: positiveOrDefault(p.prestigeRatePerMile, hardcodedDefaults.prestige.ratePerMile),
      hourlyRate: positiveOrDefault(p.prestigeHourlyRate, hardcodedDefaults.prestige.hourlyRate),
    },
    minibus: {
      ratePerMile: positiveOrDefault(p.minibusRatePerMile, hardcodedDefaults.minibus.ratePerMile),
      rate16Seater: positiveOrDefault(p.minibusRate16Seater, hardcodedDefaults.minibus.rate16Seater),
      rate24Seater: positiveOrDefault(p.minibusRate24Seater, hardcodedDefaults.minibus.rate24Seater),
      rate32Seater: positiveOrDefault(p.minibusRate32Seater, hardcodedDefaults.minibus.rate32Seater),
    },
    coaches: {
      ratePerMile: positiveOrDefault(p.coachesRatePerMile, hardcodedDefaults.coaches.ratePerMile),
      hourlyRate: positiveOrDefault(p.coachesHourlyRate, hardcodedDefaults.coaches.hourlyRate),
    },
    taxi: {
      ratePerMile: positiveOrDefault(p.taxiRatePerMile, hardcodedDefaults.taxi.ratePerMile),
      minimumFare: positiveOrDefault(p.taxiMinimumFare, hardcodedDefaults.taxi.minimumFare),
    },
    commissionPercentage: positiveOrDefault(p.commissionPercentage, hardcodedDefaults.commissionPercentage),
    driverPayoutPercentage: positiveOrDefault(p.driverPayoutPercentage, hardcodedDefaults.driverPayoutPercentage),
  };
}

// Simulated distance lookup — replace with Google Maps Distance Matrix API in production
function fallbackDistance(fromPostcode: string, toPostcode: string): number {
  const seed = (fromPostcode + toPostcode).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.max(5, (seed % 190) + 10);
}

export async function estimateDistance(fromPostcode: string, toPostcode: string): Promise<number> {
  const apiKey = process.env.GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return fallbackDistance(fromPostcode, toPostcode);

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('origins', `${fromPostcode}, UK`);
  url.searchParams.set('destinations', `${toPostcode}, UK`);
  url.searchParams.set('units', 'imperial');
  url.searchParams.set('key', apiKey);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) return fallbackDistance(fromPostcode, toPostcode);
    const data = await response.json() as {
      status?: string;
      rows?: Array<{ elements?: Array<{ status?: string; distance?: { value?: number } }> }>;
    };
    const element = data.rows?.[0]?.elements?.[0];
    const metres = element?.distance?.value;
    if (data.status !== 'OK' || element?.status !== 'OK' || !metres) {
      return fallbackDistance(fromPostcode, toPostcode);
    }
    return parseFloat((metres / 1609.344).toFixed(1));
  } catch {
    return fallbackDistance(fromPostcode, toPostcode);
  }
}

export function estimateHours(miles: number): number {
  return Math.round((miles / 40) * 100) / 100;
}

export interface FareBreakdown {
  estimatedDistanceMiles: number;
  estimatedHours: number;
  mileageCharge: number;
  timeCharge: number;
  subtotal: number;
  discount: number;
  total: number;
  breakdown: string;
  note: string;
}

export function calculateFare(
  category: VehicleCategory,
  miles: number,
  hours: number,
  passengers?: number,
  couponCode?: string,
  pricing: PricingConfig = hardcodedDefaults,
): FareBreakdown {
  const cfg = pricing;
  let mileageCharge = 0;
  let timeCharge    = 0;
  let breakdownText = '';

  switch (category) {
    case 'prestige': {
      mileageCharge = parseFloat((miles * cfg.prestige.ratePerMile).toFixed(2));
      timeCharge    = parseFloat((hours * cfg.prestige.hourlyRate).toFixed(2));
      breakdownText = `£${cfg.prestige.ratePerMile}/mile × ${miles}mi + £${cfg.prestige.hourlyRate}/hr × ${hours}hrs`;
      break;
    }
    case 'minibus': {
      mileageCharge = parseFloat((miles * cfg.minibus.ratePerMile).toFixed(2));
      const pax = passengers ?? 16;
      if (pax <= 16)      timeCharge = cfg.minibus.rate16Seater;
      else if (pax <= 24) timeCharge = cfg.minibus.rate24Seater;
      else                timeCharge = cfg.minibus.rate32Seater;
      breakdownText = `£${cfg.minibus.ratePerMile}/mile × ${miles}mi + flat rate £${timeCharge}`;
      break;
    }
    case 'coaches': {
      mileageCharge = parseFloat((miles * cfg.coaches.ratePerMile).toFixed(2));
      timeCharge    = parseFloat((hours * cfg.coaches.hourlyRate).toFixed(2));
      breakdownText = `£${cfg.coaches.ratePerMile}/mile × ${miles}mi + £${cfg.coaches.hourlyRate}/hr × ${hours}hrs`;
      break;
    }
    case 'taxi':
    default: {
      const raw = parseFloat((miles * cfg.taxi.ratePerMile).toFixed(2));
      mileageCharge = Math.max(raw, cfg.taxi.minimumFare);
      timeCharge    = 0;
      breakdownText = `£${cfg.taxi.ratePerMile}/mile × ${miles}mi (min £${cfg.taxi.minimumFare})`;
      break;
    }
  }

  const subtotal = parseFloat((mileageCharge + timeCharge).toFixed(2));
  let discount = 0;
  if (couponCode) {
    // Coupon lookup happens in the calling route via prisma.promotion.findFirst
  }
  const total = parseFloat(Math.max(0, subtotal - discount).toFixed(2));

  return {
    estimatedDistanceMiles: miles,
    estimatedHours: hours,
    mileageCharge,
    timeCharge,
    subtotal,
    discount,
    total,
    breakdown: breakdownText,
    note: 'Price is an estimate. Final price confirmed on booking.',
  };
}

export function applyCommission(fareAmount: number, pricing: PricingConfig = hardcodedDefaults): {
  commission: number;
  affiliatePayout: number;
  driverPayout: number;
} {
  // RP takes commissionPercentage. The operator (affiliate or independent driver) gets the rest.
  // For fleet drivers the affiliate decides their internal pay — RP does not split it further.
  const commission      = parseFloat(((fareAmount * pricing.commissionPercentage) / 100).toFixed(2));
  const affiliatePayout = parseFloat((fareAmount - commission).toFixed(2));
  const driverPayout    = affiliatePayout; // stored for independent-driver jobs; unused for fleet-driver jobs
  return { commission, affiliatePayout, driverPayout };
}
