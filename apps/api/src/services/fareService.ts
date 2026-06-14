import type { VehicleCategory } from '../types';

// Default pricing — overridden at runtime via admin /pricing endpoint which updates DB.
// For quote/fare calculation these defaults are used synchronously.
// If you need DB-driven pricing, make calculateFare async and fetch from prisma.pricingConfig.
const defaultPricing = {
  prestige: { ratePerMile: 4.40, hourlyRate: 70 },
  minibus:  { ratePerMile: 4.00, rate16Seater: 420, rate24Seater: 520, rate32Seater: 620 },
  coaches:  { ratePerMile: 4.00, hourlyRate: 110 },
  taxi:     { ratePerMile: 3.00, minimumFare: 8 },
  commissionPercentage: 27.5,
  driverPayoutPercentage: 60,
};

// Simulated distance lookup — in production wire to Google Maps Distance Matrix API
export function estimateDistance(fromPostcode: string, toPostcode: string): number {
  // Very simple hash-based mock: returns 10–200 miles deterministically
  const seed = (fromPostcode + toPostcode).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.max(5, (seed % 190) + 10);
}

export function estimateHours(miles: number): number {
  // Assume average 40 mph including urban sections
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
): FareBreakdown {
  const cfg = defaultPricing;
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

  // Coupon: for a full DB-driven coupon lookup, make this function async.
  // For now we do a no-op discount unless the code is provided (DB lookup happens async in routes).
  let discount = 0;
  if (couponCode) {
    // Placeholder: discount logic is intentionally simplified here.
    // The public/customer quote routes can call prisma.promotion.findFirst if needed.
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

export function applyCommission(fareAmount: number): {
  commission: number;
  affiliatePayout: number;
  driverPayout: number;
} {
  const commission      = parseFloat(((fareAmount * defaultPricing.commissionPercentage) / 100).toFixed(2));
  const net             = fareAmount - commission;
  const driverPayout    = parseFloat(((net * defaultPricing.driverPayoutPercentage) / 100).toFixed(2));
  const affiliatePayout = parseFloat((net - driverPayout).toFixed(2));
  return { commission, affiliatePayout, driverPayout };
}
