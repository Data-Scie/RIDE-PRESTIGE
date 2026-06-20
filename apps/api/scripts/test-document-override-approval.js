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
  } finally {
    clearTimeout(timeout);
  }
}

async function login(email, password, role) {
  return (await request('/api/auth/login', { method: 'POST', body: { email, password, role } })).token;
}

async function runRideToCompletion(jobId, driverToken, { needsAccept = true } = {}) {
  // Independent drivers' /claim already accepts the job; only affiliate-assigned
  // rides (vehicle_assigned -> driver_accepted) need an explicit /accept call.
  if (needsAccept) {
    await request(`/api/driver/jobs/${jobId}/accept`, { method: 'POST', token: driverToken, body: {} });
  }
  for (const status of ['on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress', 'completed']) {
    await request(`/api/driver/jobs/${jobId}/status`, { method: 'PUT', token: driverToken, body: { status } });
  }
}

async function main() {
  const suffix = Date.now();
  const password = 'OverrideFlow@2026!';
  const opsToken = await login('ops@rideprestige.co.uk', 'Ops@2026!', 'ops');
  const adminToken = await login('admin@rideprestige.co.uk', 'Admin@2026!', 'admin');

  let affiliateId, affiliateToken, affiliateDriverId, affiliateVehicleId, affiliateJobId, affiliateBookingId, affiliateReference;
  let independentDriverId, independentVehicleId, independentJobId, independentBookingId, independentReference;

  try {
    // ── Affiliate-driver ride, both driver and vehicle approved with zero documents uploaded ──
    const affiliateEmail = `override.affiliate.${suffix}@example.com`;
    const registeredAffiliate = await request('/api/auth/register/affiliate', {
      method: 'POST',
      body: {
        companyName: `Override Test Affiliate ${suffix}`,
        tradingName: `Override Test ${suffix}`,
        contactPerson: 'Override Manager',
        email: affiliateEmail,
        phone: '+44 7700 940001',
        password,
        address: '1 Override Street',
        city: 'Sheffield',
        postcode: 'S1 2BP',
        operatorLicenceNumber: `OP-OV-${suffix}`,
        companyRegNumber: `CR-OV-${suffix}`,
        serviceAreas: ['S1', 'S10'],
        bankAccountName: 'Override Test',
        sortCode: '000000',
        accountNumber: '00000000',
      },
    });
    affiliateId = registeredAffiliate.affiliate.id;
    await request(`/api/ops/affiliates/${affiliateId}/approve`, { method: 'PUT', token: opsToken, body: {} });
    affiliateToken = await login(affiliateEmail, password, 'affiliate');

    const affiliateDriverEmail = `override.affiliate.driver.${suffix}@example.com`;
    const affiliateDriver = (await request('/api/affiliate/drivers', {
      method: 'POST',
      token: affiliateToken,
      body: {
        fullName: 'Override Affiliate Driver',
        email: affiliateDriverEmail,
        phone: '+44 7700 940002',
        password,
        address: '2 Override Street',
        city: 'Sheffield',
        postcode: 'S1 2BP',
        dateOfBirth: '1990-01-01',
        drivingLicenceNumber: `DL-OV-${suffix}`,
        privateHireBadgeNumber: `PHV-OV-${suffix}`,
      },
    })).data;
    affiliateDriverId = affiliateDriver.id;

    // Sanity: confirm the driver has no documents on file before we approve.
    const preApprovalDocs = (await request(`/api/ops/drivers/${affiliateDriverId}`, { token: opsToken })).data.documents;
    assert(preApprovalDocs.every(doc => !doc.fileUrl), 'Affiliate driver should have zero uploaded document files before override test');

    // The bug fix under test: plain approve must NOT silently fix documentsStatus; override must.
    const plainApprove = await request(`/api/ops/drivers/${affiliateDriverId}/approve`, { method: 'PUT', token: opsToken, body: {} });
    assert(plainApprove.data.applicationStatus === 'approved', 'Plain approve should still set applicationStatus to approved');
    assert(plainApprove.data.documentsStatus !== 'approved', 'Plain approve must not fabricate document approval');

    const affiliateDriverToken = await login(affiliateDriverEmail, password, 'driver');
    const blockedOnline = await request('/api/driver/status', { method: 'PUT', token: affiliateDriverToken, body: { status: 'available' } }).catch(e => e);
    assert(blockedOnline instanceof Error && /documents/i.test(blockedOnline.message), 'Driver should still be blocked from going online before the override is applied');

    const overrideApprove = await request(`/api/ops/drivers/${affiliateDriverId}/approve?override=true`, {
      method: 'PUT', token: opsToken, body: { override: true, approveAnyway: true },
    });
    assert(overrideApprove.data.documentsStatus === 'approved', 'Override approve must force documentsStatus to approved');
    await request('/api/driver/status', { method: 'PUT', token: affiliateDriverToken, body: { status: 'available' } });

    const affiliateVehicle = (await request('/api/affiliate/vehicles', {
      method: 'POST',
      token: affiliateToken,
      body: {
        make: 'BMW', model: 'Override 7 Series', year: 2026, registration: `OVA${String(suffix).slice(-5)}`,
        vehicleType: 'Executive', vehicleCategory: 'prestige', colour: 'Black',
        passengerCapacity: 4, luggageCapacity: 3,
        motExpiry: '2028-12-31', insuranceExpiry: '2028-12-31', phvLicenceExpiry: '2028-12-31',
      },
    })).data;
    affiliateVehicleId = affiliateVehicle.id;
    await request(`/api/ops/vehicles/${affiliateVehicleId}/approve?override=true`, { method: 'PUT', token: opsToken, body: { override: true } });

    const affiliateBooking = await request('/api/public/booking', {
      method: 'POST',
      body: {
        fullName: 'Override Affiliate Customer', phone: '+44 7700 940003', email: `override.affiliate.customer.${suffix}@example.com`,
        pickupPostcode: 'S1 2BP', dropoffPostcode: 'S10 2TN', vehicleCategory: 'prestige', passengers: 2,
        bookingType: 'current', notes: 'Document override end-to-end test (affiliate)',
      },
    });
    affiliateBookingId = affiliateBooking.data.booking.id;
    affiliateJobId = affiliateBooking.data.booking.jobId;
    affiliateReference = affiliateBooking.data.booking.reference;

    await request(`/api/affiliate/jobs/${affiliateJobId}/accept`, { method: 'POST', token: affiliateToken, body: {} });
    await request(`/api/affiliate/jobs/${affiliateJobId}/assign-vehicle`, { method: 'POST', token: affiliateToken, body: { vehicleId: affiliateVehicleId } });
    await request(`/api/affiliate/jobs/${affiliateJobId}/assign-driver`, { method: 'POST', token: affiliateToken, body: { driverId: affiliateDriverId } });
    await runRideToCompletion(affiliateJobId, affiliateDriverToken);

    const affiliateRide = await request(`/api/ops/rides/${affiliateJobId}`, { token: opsToken });
    assert(affiliateRide.data.status === 'completed', 'Affiliate-driver ride did not complete');
    const affiliateEarnings = await request('/api/affiliate/earnings', { token: affiliateToken });
    assert(affiliateEarnings.data.some(item => item.jobId === affiliateJobId), 'Affiliate earning was not created');

    // ── Independent-driver ride, driver AND vehicle both approved with zero documents uploaded ──
    const independentEmail = `override.independent.${suffix}@example.com`;
    const independentApplication = await request('/api/auth/register/driver', {
      method: 'POST',
      body: {
        fullName: 'Override Independent Driver', email: independentEmail, phone: '+44 7700 940004', password,
        address: '3 Override Street', city: 'Sheffield', postcode: 'S1 2BP', dateOfBirth: '1990-01-01',
        drivingLicenceNumber: `IND-OV-${suffix}`, privateHireBadgeNumber: `IPH-OV-${suffix}`, driverType: 'independentDriver',
      },
    });
    independentDriverId = independentApplication.user.id;
    await request(`/api/ops/drivers/${independentDriverId}/approve?override=true`, { method: 'PUT', token: opsToken, body: { override: true } });
    const independentDriverToken = await login(independentEmail, password, 'driver');

    const independentVehicle = (await request('/api/driver/vehicles', {
      method: 'POST',
      token: independentDriverToken,
      body: {
        make: 'Skoda', model: 'Override Superb', year: 2026, registration: `OVI${String(suffix).slice(-5)}`,
        vehicleType: 'Executive', vehicleCategory: 'prestige', colour: 'Grey',
        passengerCapacity: 4, luggageCapacity: 3,
        motExpiry: '2028-12-31', insuranceExpiry: '2028-12-31', phvLicenceExpiry: '2028-12-31',
      },
    })).data;
    independentVehicleId = independentVehicle.id;
    await request(`/api/ops/vehicles/${independentVehicleId}/approve?override=true`, { method: 'PUT', token: opsToken, body: { override: true } });

    // This is the real test of the vehicle-gate fix from the regression check: with both the
    // driver and the vehicle override-approved (no documents at all), going online must succeed.
    await request('/api/driver/status', { method: 'PUT', token: independentDriverToken, body: { status: 'available' } });

    const independentBooking = await request('/api/public/booking', {
      method: 'POST',
      body: {
        fullName: 'Override Independent Customer', phone: '+44 7700 940005', email: `override.independent.customer.${suffix}@example.com`,
        pickupPostcode: 'S1 2BP', dropoffPostcode: 'S10 2TN', vehicleCategory: 'prestige', passengers: 2,
        bookingType: 'current', notes: 'Document override end-to-end test (independent)',
      },
    });
    independentBookingId = independentBooking.data.booking.id;
    independentJobId = independentBooking.data.booking.jobId;
    independentReference = independentBooking.data.booking.reference;

    const offers = await request('/api/driver/jobs/available', { token: independentDriverToken });
    const offer = offers.data.find(item => item.jobId === independentJobId);
    assert(offer, 'Override-approved independent driver did not receive the dispatch offer');
    await request(`/api/driver/jobs/${offer.id}/claim`, { method: 'POST', token: independentDriverToken, body: {} });
    await runRideToCompletion(independentJobId, independentDriverToken, { needsAccept: false });

    const independentRide = await request(`/api/ops/rides/${independentJobId}`, { token: opsToken });
    assert(independentRide.data.status === 'completed', 'Independent-driver ride did not complete');
    assert(independentRide.data.affiliateId === null, 'Independent ride should have no affiliate attached');
    const independentEarnings = await prisma.earningEntry.findMany({ where: { jobId: independentJobId, entityType: 'driver' } });
    assert(independentEarnings.length > 0, 'Independent driver earning was not created');

    console.log(JSON.stringify({
      success: true,
      affiliateReference,
      independentReference,
      verified: [
        'plain approve leaves documentsStatus unfixed and keeps the driver blocked from going online',
        'override approve forces documentsStatus to approved with zero documents uploaded',
        'override-approved affiliate driver completes a real ride end-to-end',
        'override-approved vehicle (zero documents) is accepted for dispatch',
        'override-approved independent driver + vehicle can go online and complete a real ride end-to-end',
      ],
    }));
  } finally {
    for (const jobId of [affiliateJobId, independentJobId].filter(Boolean)) {
      await prisma.earningEntry.deleteMany({ where: { jobId } });
      await prisma.payment.deleteMany({ where: { jobId } });
      await prisma.rideStatusHistory.deleteMany({ where: { jobId } });
      await prisma.rideOffer.deleteMany({ where: { jobId } });
    }
    for (const reference of [affiliateReference, independentReference].filter(Boolean)) {
      await prisma.notification.deleteMany({ where: { body: { contains: reference } } });
    }
    if (affiliateJobId) await prisma.job.deleteMany({ where: { id: affiliateJobId } });
    if (independentJobId) await prisma.job.deleteMany({ where: { id: independentJobId } });
    if (affiliateBookingId) await prisma.booking.deleteMany({ where: { id: affiliateBookingId } });
    if (independentBookingId) await prisma.booking.deleteMany({ where: { id: independentBookingId } });
    if (affiliateVehicleId) await prisma.fleetVehicle.deleteMany({ where: { id: affiliateVehicleId } });
    if (independentVehicleId) await prisma.fleetVehicle.deleteMany({ where: { id: independentVehicleId } });
    for (const driverId of [affiliateDriverId, independentDriverId].filter(Boolean)) {
      await prisma.driverDocument.deleteMany({ where: { driverId } });
      await prisma.notification.deleteMany({ where: { recipientId: driverId } });
      await prisma.driver.deleteMany({ where: { id: driverId } });
    }
    if (affiliateId) {
      await prisma.notification.deleteMany({ where: { recipientId: affiliateId } });
      await prisma.affiliateDocument.deleteMany({ where: { affiliateId } });
      await prisma.affiliate.deleteMany({ where: { id: affiliateId } });
    }
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
