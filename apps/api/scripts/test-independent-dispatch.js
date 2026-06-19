const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:4000';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function rawRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json();
  return { response, payload };
}

async function request(path, options = {}) {
  const result = await rawRequest(path, options);
  if (!result.response.ok) {
    throw new Error(`${options.method || 'GET'} ${path}: ${result.response.status} ${result.payload.message || 'Request failed'}`);
  }
  return result.payload;
}

async function login(email, password, role) {
  return (await request('/api/auth/login', {
    method: 'POST',
    body: { email, password, role },
  })).token;
}

async function createCompliantDriver(index, suffix, opsToken) {
  const email = `independent.dispatch.${index}.${suffix}@example.com`;
  const password = 'DispatchTest@2026!';
  const application = await request('/api/auth/register/driver', {
    method: 'POST',
    body: {
      fullName: `Independent Dispatch ${index}`,
      email,
      phone: `+44 7700 91${String(index).padStart(4, '0')}`,
      password,
      address: `${index} Dispatch Test Road`,
      city: 'Sheffield',
      postcode: 'S1 2AB',
      dateOfBirth: '1990-01-01',
      drivingLicenceNumber: `DL-${index}-${suffix}`,
      privateHireBadgeNumber: `PHV-${index}-${suffix}`,
      driverType: 'independentDriver',
    },
  });
  const driverId = application.user.id;
  await request(`/api/ops/drivers/${driverId}/approve`, { method: 'PUT', token: opsToken, body: {} });
  const token = await login(email, password, 'driver');

  const documents = (await request('/api/driver/documents', { token })).data;
  for (const document of documents) {
    await request(`/api/driver/documents/${document.id}`, {
      method: 'PUT',
      token,
      body: {
        fileUrl: `https://documents.example.com/${driverId}/${document.type}.pdf`,
        expiryDate: '2028-12-31',
      },
    });
    await request(`/api/ops/drivers/${driverId}/documents/${document.id}/approve`, {
      method: 'PUT',
      token: opsToken,
      body: {},
    });
  }

  const vehicle = (await request('/api/driver/vehicles', {
    method: 'POST',
    token,
    body: {
      make: 'Mercedes',
      model: `E-Class ${index}`,
      year: 2026,
      registration: `DSP${String(suffix).slice(-5)}${index}`,
      vehicleType: 'Executive',
      vehicleCategory: 'taxi',
      colour: 'Black',
      passengerCapacity: 4,
      luggageCapacity: 3,
      motExpiry: '2028-12-31',
      insuranceExpiry: '2028-12-31',
      phvLicenceExpiry: '2028-12-31',
    },
  })).data;
  await request(`/api/ops/vehicles/${vehicle.id}/approve`, { method: 'PUT', token: opsToken, body: {} });
  await request('/api/driver/status', { method: 'PUT', token, body: { status: 'available' } });
  return { driverId, vehicleId: vehicle.id, email, token };
}

async function createBooking(suffix, label) {
  return request('/api/public/booking', {
    method: 'POST',
    body: {
      fullName: `Dispatch Test Customer ${label}`,
      phone: '+44 7700 929999',
      email: `dispatch.customer.${label}.${suffix}@example.com`,
      pickupPostcode: 'S1 2BP',
      dropoffPostcode: 'S10 2TN',
      vehicleCategory: 'taxi',
      passengers: 2,
      bookingType: 'current',
      notes: `Independent dispatch integration ${label}`,
    },
  });
}

async function main() {
  const suffix = Date.now();
  const opsToken = await login('ops@rideprestige.co.uk', 'Ops@2026!', 'ops');
  const drivers = [];
  const bookingIds = [];
  const jobIds = [];
  const references = [];

  try {
    drivers.push(await createCompliantDriver(1, suffix, opsToken));
    drivers.push(await createCompliantDriver(2, suffix, opsToken));

    const declineBooking = await createBooking(suffix, 'decline');
    bookingIds.push(declineBooking.data.booking.id);
    jobIds.push(declineBooking.data.booking.jobId);
    references.push(declineBooking.data.booking.reference);
    const declineOffers = await Promise.all(drivers.map(driver =>
      request('/api/driver/jobs/available', { token: driver.token })));
    const declinedOffer = declineOffers[0].data.find(offer => offer.jobId === declineBooking.data.booking.jobId);
    assert(declinedOffer, 'Targeted offer was not created for decline test');
    await request(`/api/driver/jobs/${declinedOffer.id}/decline`, {
      method: 'POST',
      token: drivers[0].token,
      body: {},
    });
    const declined = await prisma.rideOffer.findUnique({ where: { id: declinedOffer.id } });
    assert(declined?.status === 'declined', 'Offer decline was not persisted');

    const raceBooking = await createBooking(suffix, 'race');
    const bookingId = raceBooking.data.booking.id;
    const jobId = raceBooking.data.booking.jobId;
    bookingIds.push(bookingId);
    jobIds.push(jobId);
    references.push(raceBooking.data.booking.reference);

    const offerLists = await Promise.all(drivers.map(driver =>
      request('/api/driver/jobs/available', { token: driver.token })));
    const offers = offerLists.map(result => result.data.find(offer => offer.jobId === jobId));
    assert(offers.every(Boolean), 'Both eligible drivers did not receive targeted offers');

    const claimResults = await Promise.all(offers.map((offer, index) =>
      rawRequest(`/api/driver/jobs/${offer.id}/claim`, {
        method: 'POST',
        token: drivers[index].token,
        body: {},
      })));
    const claimStatuses = claimResults.map(result => `${result.response.status}:${result.payload.message || 'ok'}`).join(', ');
    assert(claimResults.filter(result => result.response.status === 200).length === 1, `Exactly one simultaneous claim must win (${claimStatuses})`);
    assert(claimResults.filter(result => result.response.status === 409).length === 1, `Losing simultaneous claim must receive HTTP 409 (${claimStatuses})`);

    const winnerIndex = claimResults.findIndex(result => result.response.status === 200);
    const winner = drivers[winnerIndex];
    const claimedJob = await prisma.job.findUnique({ where: { id: jobId } });
    assert(claimedJob?.assignedDriverId === winner.driverId, 'Winning driver was not assigned');
    assert(claimedJob?.assignedVehicleId === winner.vehicleId, 'Winning approved vehicle was not assigned');
    assert(claimedJob?.affiliateId === null, 'Independent ride must not have an affiliate');
    assert(claimedJob?.driverPayoutAmount === Number((claimedJob.fareAmount - claimedJob.commissionAmount).toFixed(2)), 'Independent payout must receive the full post-commission amount');

    for (const status of ['on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress', 'completed']) {
      await request(`/api/driver/jobs/${jobId}/status`, {
        method: 'PUT',
        token: winner.token,
        body: { status },
      });
    }
    const earnings = await prisma.earningEntry.findMany({ where: { jobId } });
    assert(earnings.length === 1 && earnings[0].entityType === 'driver', 'Independent completion must create only a driver earning');

    const expiryBooking = await createBooking(suffix, 'expiry');
    bookingIds.push(expiryBooking.data.booking.id);
    jobIds.push(expiryBooking.data.booking.jobId);
    references.push(expiryBooking.data.booking.reference);
    const expiringOffer = await prisma.rideOffer.findFirst({
      where: { jobId: expiryBooking.data.booking.jobId, status: 'pending' },
    });
    assert(expiringOffer, 'Expiry test offer was not found');
    await prisma.rideOffer.update({
      where: { id: expiringOffer.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await request('/api/driver/jobs/available', { token: drivers[1].token });
    const expired = await prisma.rideOffer.findUnique({ where: { id: expiringOffer.id } });
    assert(expired?.status === 'expired', 'Expired offer was not closed');

    console.log(JSON.stringify({
      success: true,
      verified: [
        'fresh independent registration',
        'operations driver approval',
        'document submission and approval',
        'vehicle registration and approval',
        'compliance-gated online status',
        'service-area/category/capacity eligibility',
        'durable targeted offers',
        'decline and expiry',
        'atomic first-claim-wins',
        'independent payout without affiliate share',
        'ride completion and earning creation',
      ],
    }));
  } finally {
    await prisma.earningEntry.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.rideStatusHistory.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.rideOffer.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { recipientId: { in: drivers.map(driver => driver.driverId) } },
          { body: { contains: String(suffix) } },
          ...references.map(reference => ({ body: { contains: reference } })),
        ],
      },
    });
    await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    await prisma.fleetVehicle.deleteMany({ where: { id: { in: drivers.map(driver => driver.vehicleId) } } });
    await prisma.driver.deleteMany({ where: { id: { in: drivers.map(driver => driver.driverId) } } });
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
