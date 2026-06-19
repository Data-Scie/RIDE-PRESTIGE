const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:4000';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 30000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${payload.message || 'Request failed'}`);
    }
    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`${options.method || 'GET'} ${path}: request timed out`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function login(email, password, role) {
  return (await request('/api/auth/login', { method: 'POST', body: { email, password, role } })).token;
}

async function submitAndApproveAffiliateVehicleDocuments(vehicleId, affiliateToken, opsToken) {
  const vehicles = (await request('/api/affiliate/vehicles', { token: affiliateToken })).data;
  const vehicle = vehicles.find(item => item.id === vehicleId);
  assert(vehicle, 'Registered affiliate vehicle was not returned');
  assert(vehicle.documents?.length > 0, 'Affiliate vehicle document slots were not created');

  for (const document of vehicle.documents) {
    await request(`/api/affiliate/vehicles/${vehicleId}/documents/${document.id}`, {
      method: 'PUT',
      token: affiliateToken,
      body: {
        fileUrl: `https://documents.example.com/${vehicleId}/${document.type}.pdf`,
        expiryDate: '2028-12-31',
      },
    });
    await request(`/api/ops/vehicles/${vehicleId}/documents/${document.id}/approve`, {
      method: 'PUT',
      token: opsToken,
      body: {},
    });
  }
}

async function createApprovedAffiliate(index, suffix, opsToken, vehicleCategory) {
  const email = `dispatch.affiliate.${index}.${suffix}@example.com`;
  const password = 'AffiliateTest@2026!';
  const registered = await request('/api/auth/register/affiliate', {
    method: 'POST',
    body: {
      companyName: `Dispatch Visibility Test Affiliate ${index}`,
      email, phone: `+44 7700 92${String(index).padStart(4, '0')}`, password,
      operatorLicenceNumber: `OB-DISPATCH-${index}-${suffix}`,
      companyRegNumber: `DISPATCH${index}${suffix}`,
    },
  });
  const affiliateId = registered.affiliate.id;
  await request(`/api/ops/affiliates/${affiliateId}/approve`, { method: 'PUT', token: opsToken, body: {} });
  const token = await login(email, password, 'affiliate');
  const vehicle = (await request('/api/affiliate/vehicles', {
    method: 'POST',
    token,
    body: {
      make: 'Mercedes', model: `Dispatch Test ${index}`, year: 2026,
      registration: `DSV${String(suffix).slice(-5)}${index}`,
      vehicleType: 'Executive', vehicleCategory, colour: 'Silver',
      passengerCapacity: 4, luggageCapacity: 3,
      motExpiry: '2028-12-31', insuranceExpiry: '2028-12-31', phvLicenceExpiry: '2028-12-31',
    },
  })).data;
  await submitAndApproveAffiliateVehicleDocuments(vehicle.id, token, opsToken);
  await request(`/api/ops/vehicles/${vehicle.id}/approve`, { method: 'PUT', token: opsToken, body: {} });
  return { affiliateId, vehicleId: vehicle.id, email, token };
}

async function createApprovedAffiliateVehicle(token, opsToken, suffix, vehicleCategory, label) {
  const vehicle = (await request('/api/affiliate/vehicles', {
    method: 'POST',
    token,
    body: {
      make: 'Mercedes', model: `Dispatch Seed ${label}`, year: 2026,
      registration: `DSA${String(suffix).slice(-5)}${label}`,
      vehicleType: 'Executive', vehicleCategory, colour: 'Black',
      passengerCapacity: 4, luggageCapacity: 3,
      motExpiry: '2028-12-31', insuranceExpiry: '2028-12-31', phvLicenceExpiry: '2028-12-31',
    },
  })).data;
  await submitAndApproveAffiliateVehicleDocuments(vehicle.id, token, opsToken);
  await request(`/api/ops/vehicles/${vehicle.id}/approve`, { method: 'PUT', token: opsToken, body: {} });
  return vehicle.id;
}

async function main() {
  const suffix = Date.now();
  const opsToken = await login('ops@rideprestige.co.uk', 'Ops@2026!', 'ops');
  const adminToken = await login('admin@rideprestige.co.uk', 'Admin@2026!', 'admin');
  const aff1 = { affiliateId: 'aff-1', token: await login('affiliate@settransfers.co.uk', 'Affiliate@123', 'affiliate') };
  const affiliates = [];
  const seedVehicleIds = [];
  let bookingId;
  let jobId;
  let reference;

  try {
    // Affiliate B: also approved, also has a 'prestige' vehicle -> should ALSO see the new job
    affiliates.push(await createApprovedAffiliate(1, suffix, opsToken, 'prestige'));
    // Affiliate C: approved, but only has a 'coaches' vehicle -> must NOT see a 'prestige' job
    affiliates.push(await createApprovedAffiliate(2, suffix, opsToken, 'coaches'));
    seedVehicleIds.push(await createApprovedAffiliateVehicle(aff1.token, opsToken, suffix, 'prestige', 'A'));
    const [affB, affC] = affiliates;

    const created = await request('/api/public/booking', {
      method: 'POST',
      body: {
        fullName: 'Dispatch Visibility Customer', phone: '+44 7700 939999',
        email: `dispatch.visibility.${suffix}@example.com`,
        pickupPostcode: 'S1 2BP', dropoffPostcode: 'S10 2TN',
        vehicleCategory: 'prestige', passengers: 1, bookingType: 'current',
        notes: 'Affiliate dispatch visibility test',
      },
    });
    bookingId = created.data.booking.id;
    jobId = created.data.booking.jobId;
    reference = created.data.booking.reference;

    // Before anyone accepts: every category-matching affiliate sees it, non-matching does not.
    const [aff1New, affBNew, affCNew] = await Promise.all([
      request('/api/affiliate/jobs/new', { token: aff1.token }),
      request('/api/affiliate/jobs/new', { token: affB.token }),
      request('/api/affiliate/jobs/new', { token: affC.token }),
    ]);
    assert(aff1New.data.some(j => j.id === jobId), 'Affiliate A (matching category) should see the new job');
    assert(affBNew.data.some(j => j.id === jobId), 'Affiliate B (matching category) should ALSO see the new job before anyone accepts');
    assert(!affCNew.data.some(j => j.id === jobId), 'Affiliate C (non-matching category) must NOT see the job');

    const [adminBookingsPre, opsRidesPre] = await Promise.all([
      request('/api/admin/bookings?limit=200', { token: adminToken }),
      request('/api/ops/rides', { token: opsToken }),
    ]);
    assert(adminBookingsPre.data.some(b => b.id === bookingId), 'Admin must see the booking immediately, before any affiliate accepts');
    assert(opsRidesPre.data.some(j => j.id === jobId), 'Ops must see the ride immediately, before any affiliate accepts');

    // Affiliate A accepts -> must disappear from every other affiliate's view, and never appear
    // in another affiliate's "accepted" list, even though it matched their category too.
    await request(`/api/affiliate/jobs/${jobId}/accept`, { method: 'POST', token: aff1.token });
    const [aff1Accepted, affBNewAfter, affBAcceptedAfter] = await Promise.all([
      request('/api/affiliate/jobs/accepted', { token: aff1.token }),
      request('/api/affiliate/jobs/new', { token: affB.token }),
      request('/api/affiliate/jobs/accepted', { token: affB.token }),
    ]);
    assert(aff1Accepted.data.some(j => j.id === jobId), 'Affiliate A must see the job in its own Active Rides after accepting');
    assert(!affBNewAfter.data.some(j => j.id === jobId), 'Job must disappear from Affiliate B once Affiliate A accepted it');
    assert(!affBAcceptedAfter.data.some(j => j.id === jobId), 'Affiliate B must never see a job it never accepted in its own Active Rides');

    const [adminBookingsPost, opsRidesPost] = await Promise.all([
      request('/api/admin/bookings?limit=200', { token: adminToken }),
      request('/api/ops/rides', { token: opsToken }),
    ]);
    assert(adminBookingsPost.data.some(b => b.id === bookingId), 'Admin must still see the booking after affiliate acceptance');
    assert(opsRidesPost.data.some(j => j.id === jobId), 'Ops must still see the ride after affiliate acceptance');

    console.log(JSON.stringify({
      success: true,
      reference,
      verified: [
        'multi-affiliate simultaneous visibility before acceptance',
        'category-based affiliate isolation (non-matching affiliate excluded)',
        'admin/ops visibility before any affiliate acts',
        'single-affiliate exclusivity after acceptance',
        'non-accepting affiliate cannot see the job in any of its own lists',
        'admin/ops visibility preserved after affiliate acceptance',
      ],
    }));
  } finally {
    if (jobId) {
      await prisma.earningEntry.deleteMany({ where: { jobId } });
      await prisma.rideStatusHistory.deleteMany({ where: { jobId } });
    }
    if (reference) {
      await prisma.notification.deleteMany({ where: { body: { contains: reference } } });
    }
    if (jobId) await prisma.job.deleteMany({ where: { id: jobId } });
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (seedVehicleIds.length) await prisma.fleetVehicle.deleteMany({ where: { id: { in: seedVehicleIds } } });
    if (affiliates.length) {
      await prisma.fleetVehicle.deleteMany({ where: { id: { in: affiliates.map(a => a.vehicleId) } } });
      await prisma.notification.deleteMany({ where: { recipientId: { in: affiliates.map(a => a.affiliateId) } } });
      await prisma.affiliate.deleteMany({ where: { id: { in: affiliates.map(a => a.affiliateId) } } });
    }
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
