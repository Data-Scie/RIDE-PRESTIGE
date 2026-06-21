import { v4 as uuid } from 'uuid';
import { prisma } from './db';

export const DRIVER_DOCUMENTS = [
  { type: 'driving_licence', label: 'Driving Licence' },
  { type: 'phv_badge', label: 'PHV Badge' },
  { type: 'dbs_check', label: 'DBS Check' },
  { type: 'insurance', label: 'Insurance Certificate' },
] as const;

export function hasAllDriverDocuments(documents: { type: string }[] = []) {
  const existingTypes = new Set(documents.map(document => document.type));
  return DRIVER_DOCUMENTS.every(document => existingTypes.has(document.type));
}

export async function ensureDriverDocuments(driverId: string) {
  const existing = await prisma.driverDocument.findMany({ where: { driverId } });
  const existingTypes = new Set(existing.map(document => document.type));
  const missing = DRIVER_DOCUMENTS.filter(document => !existingTypes.has(document.type));
  if (missing.length) {
    await prisma.driverDocument.createMany({
      data: missing.map(document => ({
        id: `doc-${uuid()}`,
        driverId,
        type: document.type,
        label: document.label,
      })),
    });
  }
  return prisma.driverDocument.findMany({ where: { driverId }, orderBy: { label: 'asc' } });
}
