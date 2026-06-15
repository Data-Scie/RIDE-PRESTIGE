/**
 * Rotates known seed/default account passwords using environment variables.
 *
 * Required examples:
 *   RP_ADMIN_PASSWORD="..."
 *   RP_OPS_PASSWORD="..."
 *
 * Optional:
 *   RP_AFFILIATE_PASSWORD="..."
 *   RP_DRIVER_PASSWORD="..."
 *   RP_CUSTOMER_PASSWORD="..."
 *
 * Run:
 *   node scripts/rotate-default-passwords.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function passwordHash(value) {
  if (!value || value.length < 12) {
    throw new Error('Passwords must be at least 12 characters long');
  }
  return bcrypt.hashSync(value, 10);
}

async function updateAdmin(email, password) {
  if (!password) return false;
  await prisma.admin.update({
    where: { email },
    data: { passwordHash: passwordHash(password) },
  });
  return true;
}

async function updateModel(model, email, password) {
  if (!password) return false;
  await prisma[model].update({
    where: { email },
    data: { passwordHash: passwordHash(password) },
  });
  return true;
}

async function main() {
  const updates = [
    ['admin', 'admin@rideprestige.co.uk', await updateAdmin('admin@rideprestige.co.uk', process.env.RP_ADMIN_PASSWORD)],
    ['ops', 'ops@rideprestige.co.uk', await updateAdmin('ops@rideprestige.co.uk', process.env.RP_OPS_PASSWORD)],
    ['affiliate', 'affiliate@settransfers.co.uk', await updateModel('affiliate', 'affiliate@settransfers.co.uk', process.env.RP_AFFILIATE_PASSWORD)],
    ['driver', 'driver@rideprestige.co.uk', await updateModel('driver', 'driver@rideprestige.co.uk', process.env.RP_DRIVER_PASSWORD)],
    ['customer', 'james@example.com', await updateModel('customer', 'james@example.com', process.env.RP_CUSTOMER_PASSWORD)],
  ];

  const changed = updates.filter(([, , didUpdate]) => didUpdate);
  if (changed.length === 0) {
    throw new Error('No password env vars were provided. Nothing changed.');
  }

  console.log('Rotated passwords for:');
  for (const [role, email] of changed) {
    console.log(`- ${role}: ${email}`);
  }
}

main()
  .catch(error => {
    console.error(error.message || error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
