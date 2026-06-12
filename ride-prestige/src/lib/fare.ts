// ============================================================
// Ride Prestige — Fare Calculation Engine
//
// Pricing formulas:
//   Prestige:  £4.40/mile + £70/hour
//   Minibus:   £4.00/mile + daily rate (£420 16-seat / £600 33-seat)
//   Coaches:   £4.00/mile + £110/hour
//   Taxi:      £3.00/mile, minimum £8
// ============================================================

import type { VehicleCategory, QuoteResult, BookingFormData } from '@/types';
import { pricingConfig } from './data';
import { estimateDistance } from './distance';

export interface FareBreakdown {
  distanceMiles: number;
  durationHours: number;
  mileageCharge: number;
  timeCharge: number;
  total: number;
  breakdown: string;
  note: string;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

export function calculatePrestigeFare(miles: number, hours: number): FareBreakdown {
  const mileageCharge = pricingConfig.prestige.ratePerMile * miles;
  const timeCharge = pricingConfig.prestige.hourlyRate * hours;
  const total = Math.max(mileageCharge + timeCharge, 50);
  return {
    distanceMiles: miles, durationHours: hours,
    mileageCharge: round2(mileageCharge), timeCharge: round2(timeCharge), total: round2(total),
    breakdown: `${miles.toFixed(1)} mi · ${hours.toFixed(1)} hrs`,
    note: 'Final price confirmed on booking.',
  };
}

export function calculateMinibusFare(miles: number, hours: number, passengers: number): FareBreakdown {
  const mileageCharge = pricingConfig.minibus.ratePerMile * miles;
  const dailyRate = passengers > 24
    ? pricingConfig.minibus.rate32Seater
    : (passengers > 16 ? pricingConfig.minibus.rate24Seater : pricingConfig.minibus.rate16Seater);
  const timeCharge = hours < 4 ? dailyRate * 0.5 : dailyRate;
  const total = Math.max(mileageCharge + timeCharge, 80);
  const label = passengers > 24
    ? '32-seater daily £' + pricingConfig.minibus.rate32Seater
    : (passengers > 16 ? '24-seater daily £' + pricingConfig.minibus.rate24Seater : '16-seater daily £' + pricingConfig.minibus.rate16Seater);
  return {
    distanceMiles: miles, durationHours: hours,
    mileageCharge: round2(mileageCharge), timeCharge: round2(timeCharge), total: round2(total),
    breakdown: `${miles.toFixed(1)} mi · ${label}`,
    note: 'Final price confirmed on booking.',
  };
}

export function calculateCoachFare(miles: number, hours: number): FareBreakdown {
  const mileageCharge = pricingConfig.coaches.ratePerMile * miles;
  const timeCharge = pricingConfig.coaches.hourlyRate * hours;
  const total = Math.max(mileageCharge + timeCharge, 150);
  return {
    distanceMiles: miles, durationHours: hours,
    mileageCharge: round2(mileageCharge), timeCharge: round2(timeCharge), total: round2(total),
    breakdown: `${miles.toFixed(1)} mi · ${hours.toFixed(1)} hrs`,
    note: 'Final price confirmed on booking.',
  };
}

export function calculateTaxiFare(miles: number): FareBreakdown {
  const mileageCharge = pricingConfig.taxi.ratePerMile * miles;
  const total = Math.max(mileageCharge, pricingConfig.taxi.minimumFare);
  return {
    distanceMiles: miles, durationHours: miles / 30,
    mileageCharge: round2(mileageCharge), timeCharge: 0, total: round2(total),
    breakdown: `${miles.toFixed(1)} mi`,
    note: 'Final price confirmed on booking.',
  };
}

export function calculateFareForCategory(
  category: VehicleCategory, miles: number, hours: number, passengers: number,
): FareBreakdown {
  switch (category) {
    case 'prestige': return calculatePrestigeFare(miles, hours);
    case 'minibus': return calculateMinibusFare(miles, hours, passengers);
    case 'coaches': return calculateCoachFare(miles, hours);
    case 'taxi': return calculateTaxiFare(miles);
  }
}

function generateRef(): string {
  return 'RP-2026-' + String(Math.floor(Math.random() * 9000) + 1000);
}

export async function generateQuote(formData: BookingFormData): Promise<QuoteResult> {
  const { distanceMiles, durationHours } = await estimateDistance(
    formData.pickupPostcode, formData.dropoffPostcode,
  );
  const fare = calculateFareForCategory(
    formData.vehicleCategory, distanceMiles, durationHours, formData.passengers,
  );
  return {
    id: 'qt-' + Date.now(),
    bookingRef: generateRef(),
    createdAt: new Date().toISOString(),
    journey: {
      pickupPostcode: formData.pickupPostcode,
      dropoffPostcode: formData.dropoffPostcode,
      passengers: formData.passengers,
      vehicleCategory: formData.vehicleCategory,
      vehicleId: formData.vehicleId,
      date: formData.date,
      time: formData.time,
      bookingType: formData.bookingType,
    },
    calculation: {
      estimatedDistanceMiles: distanceMiles,
      estimatedHours: durationHours,
      mileageCharge: fare.mileageCharge,
      timeCharge: fare.timeCharge,
      total: fare.total,
      breakdown: fare.breakdown,
      note: fare.note,
    },
    status: 'pending',
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

export function getCategoryLabel(category: VehicleCategory): string {
  return { prestige: 'Prestige Vehicle', minibus: 'Minibus', coaches: 'Coach', taxi: 'Taxi' }[category];
}

export function applyVehicleMultiplier(base: number, category: VehicleCategory): number {
  return base * { minibus: 1.2, coaches: 1.8, prestige: 2.0, taxi: 1.0 }[category];
}

export const fareSettings = {
  baseFare: 15, ratePerMile: 2.50, ratePerMinute: 0.35,
  surgeMultiplier: 1.0, serviceFee: 3.50, mcPercentage: 27.5,
  waitingTimeFee: 8, airportFee: 12, minimumFare: 25,
};
