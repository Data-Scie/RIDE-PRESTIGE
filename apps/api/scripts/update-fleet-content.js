/**
 * One-off content push: applies the refreshed minibus/coach marketing copy and
 * specs from prisma/seed.ts to the live database. seed.ts's upsert is create-only
 * (update: {}) by design, so this script is needed to push edits to existing rows.
 *
 * Run: node scripts/update-fleet-content.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const vehicleUpdates = [
  {
    id: 'wv-m1',
    description: 'Our 16-seater minibus delivers spacious, air-conditioned comfort for airport transfers, corporate group travel, and private outings — with a professional, fully licensed driver at the wheel throughout your journey.',
    luggage: 'Up to 10 large cases',
    features: ['Air conditioning', 'High-back reclining seats', 'Dedicated luggage trailer available', 'USB charging points', 'Professional, uniformed driver', 'Door-to-door service'],
  },
  {
    id: 'wv-m2',
    description: 'Built for larger groups, our 24-seater minibus is the ideal choice for school trips, sports teams, and family transfers — combining generous seating with secure, comfortable group travel across Sheffield and beyond.',
    luggage: 'Up to 16 large cases',
    features: ['Full air conditioning', 'High-back reclining seats', 'Large rear luggage bay', 'USB charging points', 'Professional, uniformed driver', 'DDA-compliant access'],
  },
  {
    id: 'wv-c1',
    description: 'Our 44-seater executive coach is designed for events, corporate excursions, and large group journeys — offering reclining seats, underfloor luggage storage, and on-board comfort for long-distance travel.',
    luggage: 'Underfloor luggage bay (up to 44 cases)',
    features: ['Air conditioning', 'Reclining seats', 'Underfloor luggage storage', 'On-board entertainment system', 'Free Wi-Fi', 'PA system & microphone'],
  },
];

const categoryUpdates = [
  {
    id: 'cat-2',
    tagline: 'Spacious group travel, done right',
    description: 'A modern, well-maintained fleet of minibuses for airport transfers, corporate group travel, school trips, and private events — comfortable, air-conditioned, and driven by fully licensed professionals.',
  },
  {
    id: 'cat-3',
    tagline: 'Premium coach travel for large groups',
    description: 'Full-size executive coaches for large groups, corporate events, school trips, and long-distance travel — combining generous capacity with on-board comfort and professional drivers.',
  },
];

async function main() {
  for (const { id, ...data } of vehicleUpdates) {
    await prisma.websiteVehicle.update({ where: { id }, data });
    console.log(`Updated WebsiteVehicle ${id}`);
  }
  for (const { id, ...data } of categoryUpdates) {
    await prisma.websiteFleetCategory.update({ where: { id }, data });
    console.log(`Updated WebsiteFleetCategory ${id}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
