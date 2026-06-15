import { Prisma, type Driver, type DriverDocument, type FleetVehicle, type Job } from '@prisma/client';
import { prisma } from '../lib/db';
import { emitToRoom } from '../lib/socket';
import { pushNotification } from './notificationService';

const OFFER_TTL_MS = 2 * 60 * 1000;
const LOCATION_MAX_AGE_MS = 15 * 60 * 1000;

type EligibleDriver = Driver & {
  documents: DriverDocument[];
  vehicles: FleetVehicle[];
};

function postcodeArea(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '').match(/^[A-Z]{1,2}\d{1,2}/)?.[0] ?? '';
}

function hasExpired(value: string): boolean {
  if (!value) return true;
  const expiry = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(expiry.getTime()) || expiry.getTime() < Date.now();
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const radiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return radiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isDriverDocumentEligible(documents: DriverDocument[]): boolean {
  return documents.length > 0 && documents.every(document =>
    document.status === 'approved' && (!document.expiryDate || !hasExpired(document.expiryDate)));
}

export function isVehicleEligible(vehicle: FleetVehicle, job: Job): boolean {
  return vehicle.isApproved
    && vehicle.approvalStatus === 'approved'
    && vehicle.status === 'available'
    && vehicle.vehicleCategory === job.vehicleCategory
    && vehicle.passengerCapacity >= job.passengerCount
    && vehicle.luggageCapacity >= job.luggageCount
    && !hasExpired(vehicle.motExpiry)
    && !hasExpired(vehicle.insuranceExpiry)
    && !hasExpired(vehicle.phvLicenceExpiry);
}

function servesPickup(driver: Driver, job: Job, radiusMiles: number): boolean {
  if (
    job.pickupLatitude !== null
    && job.pickupLongitude !== null
    && driver.latitude !== null
    && driver.longitude !== null
    && driver.lastLocationUpdate
    && Date.now() - driver.lastLocationUpdate.getTime() <= LOCATION_MAX_AGE_MS
  ) {
    return haversineMiles(
      driver.latitude,
      driver.longitude,
      job.pickupLatitude,
      job.pickupLongitude,
    ) <= radiusMiles;
  }

  const pickupArea = postcodeArea(job.pickupAddress);
  const serviceAreas = driver.serviceAreas.map(postcodeArea).filter(Boolean);
  return Boolean(pickupArea && serviceAreas.some(area =>
    pickupArea === area || pickupArea.startsWith(area) || area.startsWith(pickupArea)));
}

export async function expireRideOffers(): Promise<void> {
  await prisma.rideOffer.updateMany({
    where: { status: 'pending', expiresAt: { lte: new Date() } },
    data: { status: 'expired', respondedAt: new Date() },
  });
}

export async function createIndependentRideOffers(jobId: string): Promise<number> {
  await expireRideOffers();
  const [job, pricing, drivers] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.pricingConfig.findUnique({ where: { id: 'default' } }),
    prisma.driver.findMany({
      where: {
        driverType: 'independentDriver',
        affiliateId: null,
        isApproved: true,
        applicationStatus: 'approved',
        status: 'available',
      },
      include: {
        documents: true,
        vehicles: { where: { isApproved: true, approvalStatus: 'approved', status: 'available' } },
      },
    }),
  ]);
  if (!job || job.status !== 'awaiting_affiliate' || job.affiliateId || job.assignedDriverId) return 0;

  const radiusMiles = pricing?.driverSearchRadiusMiles ?? 20;
  const eligible = (drivers as EligibleDriver[])
    .map(driver => ({
      driver,
      vehicle: driver.vehicles.find(vehicle => isVehicleEligible(vehicle, job)),
    }))
    .filter((candidate): candidate is { driver: EligibleDriver; vehicle: FleetVehicle } =>
      Boolean(
        candidate.vehicle
        && driverIsEligible(candidate.driver)
        && servesPickup(candidate.driver, job, radiusMiles),
      ));

  const existingOffers = await prisma.rideOffer.findMany({
    where: { jobId, driverId: { in: eligible.map(candidate => candidate.driver.id) } },
    select: { driverId: true },
  });
  const existingDriverIds = new Set(existingOffers.map(offer => offer.driverId));
  const newCandidates = eligible.filter(candidate => !existingDriverIds.has(candidate.driver.id));
  if (newCandidates.length === 0) return 0;

  const expiresAt = new Date(Date.now() + OFFER_TTL_MS);
  await prisma.rideOffer.createMany({
    data: newCandidates.map(({ driver, vehicle }) => ({
      jobId,
      driverId: driver.id,
      vehicleId: vehicle.id,
      expiresAt,
    })),
    skipDuplicates: true,
  });

  await Promise.all(newCandidates.map(async ({ driver }) => {
    const offer = {
      jobId: job.id,
      bookingRef: job.bookingRef,
      pickupAddress: job.pickupAddress,
      dropoffAddress: job.dropoffAddress,
      expiresAt: expiresAt.toISOString(),
    };
    emitToRoom(`driver:${driver.id}`, 'ride:offer', offer);
    await pushNotification(
      driver.id,
      'driver',
      'New Direct Ride Offer',
      `${job.bookingRef}: ${job.pickupAddress} to ${job.dropoffAddress}. Offer expires in 2 minutes.`,
      'job',
    );
  }));
  return newCandidates.length;
}

export async function reconcileIndependentDispatch(): Promise<void> {
  await expireRideOffers();
  const openJobs = await prisma.job.findMany({
    where: { status: 'awaiting_affiliate', affiliateId: null, assignedDriverId: null },
    select: { id: true },
  });
  for (const job of openJobs) {
    await createIndependentRideOffers(job.id);
  }
}

function driverIsEligible(driver: EligibleDriver): boolean {
  return driver.isApproved
    && driver.applicationStatus === 'approved'
    && driver.status === 'available'
    && driver.documentsStatus === 'approved'
    && isDriverDocumentEligible(driver.documents);
}

export async function claimIndependentRide(driverId: string, offerId: string) {
  const now = new Date();
  let result: Job | null = null;
  for (let attempt = 0; attempt < 3 && !result; attempt += 1) {
    try {
      result = await prisma.$transaction(async tx => {
    const offer = await tx.rideOffer.findFirst({
      where: { id: offerId, driverId, status: 'pending', expiresAt: { gt: now } },
      include: {
        job: true,
        driver: { include: { documents: true, vehicles: true } },
      },
    });
    const pricing = await tx.pricingConfig.findUnique({ where: { id: 'default' } });
    if (!offer) throw new Error('OFFER_UNAVAILABLE');
    if (!driverIsEligible(offer.driver as EligibleDriver)) throw new Error('DRIVER_INELIGIBLE');

    const vehicle = offer.driver.vehicles.find(item => item.id === offer.vehicleId);
    if (!vehicle || !isVehicleEligible(vehicle, offer.job)) throw new Error('VEHICLE_INELIGIBLE');
    if (!servesPickup(offer.driver, offer.job, pricing?.driverSearchRadiusMiles ?? 20)) {
      throw new Error('OUTSIDE_SERVICE_AREA');
    }

    const jobClaim = await tx.job.updateMany({
      where: {
        id: offer.jobId,
        status: 'awaiting_affiliate',
        affiliateId: null,
        assignedDriverId: null,
      },
      data: {
        assignedDriverId: driverId,
        assignedVehicleId: vehicle.id,
        status: 'driver_accepted',
        affiliatePayoutAmount: 0,
        driverPayoutAmount: parseFloat((offer.job.fareAmount - offer.job.commissionAmount).toFixed(2)),
      },
    });
    if (jobClaim.count !== 1) throw new Error('RIDE_ALREADY_CLAIMED');

    const driverClaim = await tx.driver.updateMany({
      where: { id: driverId, status: 'available', isApproved: true, applicationStatus: 'approved' },
      data: { status: 'busy', assignedVehicleId: vehicle.id },
    });
    if (driverClaim.count !== 1) throw new Error('DRIVER_INELIGIBLE');

    const vehicleClaim = await tx.fleetVehicle.updateMany({
      where: { id: vehicle.id, ownerDriverId: driverId, status: 'available', isApproved: true },
      data: { status: 'in_use', assignedDriverId: driverId },
    });
    if (vehicleClaim.count !== 1) throw new Error('VEHICLE_INELIGIBLE');

    await tx.rideOffer.update({
      where: { id: offer.id },
      data: { status: 'accepted', respondedAt: now },
    });
    await tx.rideOffer.updateMany({
      where: { jobId: offer.jobId, id: { not: offer.id }, status: 'pending' },
      data: { status: 'withdrawn', respondedAt: now },
    });
    await tx.booking.updateMany({
      where: { OR: [{ id: offer.job.bookingId ?? '' }, { jobId: offer.jobId }] },
      data: { status: 'accepted' },
    });
    await tx.rideStatusHistory.create({
      data: {
        jobId: offer.jobId,
        fromStatus: 'awaiting_affiliate',
        toStatus: 'driver_accepted',
        changedBy: driverId,
        changedByRole: 'driver',
        notes: 'Independent driver accepted a direct ride offer',
      },
    });
    return tx.job.findUniqueOrThrow({ where: { id: offer.jobId } });
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 15_000,
        timeout: 60_000,
      });
    } catch (error) {
      const retryable = ['P2034', 'P2028'].includes((error as { code?: string }).code ?? '');
      if (retryable && attempt < 2) continue;
      throw error;
    }
  }
  if (!result) throw new Error('RIDE_ALREADY_CLAIMED');

  emitToRoom(`job:${result.id}`, 'ride:claimed', { jobId: result.id, driverId });
  emitToRoom('ops', 'ride:claimed', { jobId: result.id, driverId });
  return result;
}

export async function withdrawIndependentOffers(jobId: string): Promise<void> {
  await prisma.rideOffer.updateMany({
    where: { jobId, status: 'pending' },
    data: { status: 'withdrawn', respondedAt: new Date() },
  });
}
