import { v4 as uuid } from 'uuid';
import type { VehicleDocument } from '@prisma/client';
import { prisma } from './db';

export const VEHICLE_DOCUMENTS = [
  { type: 'mot', label: 'MOT Certificate', expiryField: 'motExpiry' },
  { type: 'insurance', label: 'Insurance Certificate', expiryField: 'insuranceExpiry' },
  { type: 'phv_licence', label: 'PHV / Private Hire Vehicle Licence', expiryField: 'phvLicenceExpiry' },
] as const;

export function hasExpired(value?: string | null): boolean {
  if (!value) return true;
  const expiry = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(expiry.getTime()) || expiry.getTime() < Date.now();
}

export function isDocumentUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function hasCurrentDocumentFile(document: Pick<VehicleDocument, 'fileUrl' | 'expiryDate'>): boolean {
  return Boolean(document.fileUrl && document.expiryDate && !hasExpired(document.expiryDate));
}

export function areVehicleDocumentsApproved(documents: VehicleDocument[]): boolean {
  return documents.length >= VEHICLE_DOCUMENTS.length
    && documents.every(document => document.status === 'approved' && hasCurrentDocumentFile(document));
}

export async function ensureVehicleDocuments(vehicleId: string) {
  await prisma.vehicleDocument.createMany({
    data: VEHICLE_DOCUMENTS.map(document => ({
      id: `vdoc-${uuid()}`,
      vehicleId,
      type: document.type,
      label: document.label,
    })),
    skipDuplicates: true,
  });
  return prisma.vehicleDocument.findMany({
    where: { vehicleId },
    orderBy: { label: 'asc' },
  });
}

export async function syncVehicleDocumentExpiries(vehicleId: string) {
  const vehicle = await prisma.fleetVehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return [];
  await ensureVehicleDocuments(vehicleId);
  const expiryByType: Record<(typeof VEHICLE_DOCUMENTS)[number]['type'], string> = {
    mot: vehicle.motExpiry,
    insurance: vehicle.insuranceExpiry,
    phv_licence: vehicle.phvLicenceExpiry,
  };
  await Promise.all(VEHICLE_DOCUMENTS.map(document => {
    const expiryDate = expiryByType[document.type];
    return prisma.vehicleDocument.updateMany({
      where: { vehicleId, type: document.type, expiryDate: null },
      data: { expiryDate },
    });
  }));
  return prisma.vehicleDocument.findMany({ where: { vehicleId }, orderBy: { label: 'asc' } });
}
