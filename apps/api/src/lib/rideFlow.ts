import { Prisma } from '@prisma/client';
import { prisma } from './db';

type RideFlowClient = typeof prisma | Prisma.TransactionClient;

type RideFlowJob = {
  id: string;
  bookingId: string | null;
  bookingRef: string;
  status: string;
  affiliateId: string | null;
  assignedDriverId: string | null;
  assignedVehicleId: string | null;
};

type RideFlowInput = {
  job: RideFlowJob;
  eventType: string;
  title: string;
  description?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  actorName?: string | null;
  affiliateId?: string | null;
  driverId?: string | null;
  vehicleId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function recordRideFlowEvent(input: RideFlowInput, client: RideFlowClient = prisma) {
  return (client as any).rideFlowEvent.create({
    data: {
      jobId: input.job.id,
      bookingId: input.job.bookingId,
      bookingRef: input.job.bookingRef,
      eventType: input.eventType,
      title: input.title,
      description: input.description,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      actorName: input.actorName ?? null,
      affiliateId: input.affiliateId ?? input.job.affiliateId,
      driverId: input.driverId ?? input.job.assignedDriverId,
      vehicleId: input.vehicleId ?? input.job.assignedVehicleId,
      metadata: input.metadata ?? undefined,
    },
  });
}

export function shapeRideFlowEvent(event: {
  id: string;
  jobId: string;
  bookingId: string | null;
  bookingRef: string;
  eventType: string;
  title: string;
  description: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  actorId: string | null;
  actorRole: string | null;
  actorName: string | null;
  affiliateId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  metadata: unknown;
  createdAt: Date;
}) {
  return {
    ...event,
    createdAt: event.createdAt.toISOString(),
  };
}
