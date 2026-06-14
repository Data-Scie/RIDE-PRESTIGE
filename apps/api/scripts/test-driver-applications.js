const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:4000';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok && !options.expectedStatus) {
    throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${payload.message || 'Request failed'}`);
  }
  if (options.expectedStatus) {
    assert(response.status === options.expectedStatus, `${path}: expected ${options.expectedStatus}, received ${response.status}`);
  }
  return payload;
}

async function login(email, password, role) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password, role },
  });
  return result.token;
}

async function main() {
  const suffix = Date.now();
  const password = 'DriverTest@2026!';
  const affiliate = await prisma.affiliate.findUnique({ where: { id: 'aff-1' } });
  assert(affiliate?.isApproved, 'Approved seed affiliate aff-1 is required');

  const affiliateEmail = `affiliate.driver.${suffix}@example.com`;
  const independentEmail = `independent.driver.${suffix}@example.com`;
  const rejectedEmail = `rejected.driver.${suffix}@example.com`;
  let affiliateDriverId;
  let independentDriverId;
  let rejectedDriverId;
  let bookingId;
  let jobId;
  let reference;
  let vehicleId;

  try {
    const common = {
      phone: '+44 7700 900123',
      password,
      address: '1 Integration Test Road',
      city: 'Sheffield',
      postcode: 'S1 2AB',
      dateOfBirth: '1990-01-01',
      drivingLicenceNumber: `TEST${suffix}`,
      privateHireBadgeNumber: `PHV-${suffix}`,
    };
    const testVehicle = await prisma.fleetVehicle.create({
      data: {
        id: `fv-test-${suffix}`,
        make: 'Mercedes',
        model: 'E-Class',
        year: 2025,
        registration: `TST${String(suffix).slice(-7)}`,
        vehicleType: 'Executive',
        vehicleCategory: 'prestige',
        colour: 'Black',
        passengerCapacity: 4,
        luggageCapacity: 3,
        motExpiry: '2027-06-14',
        insuranceExpiry: '2027-06-14',
        phvLicenceExpiry: '2027-06-14',
        status: 'available',
        affiliateId: affiliate.id,
      },
    });
    vehicleId = testVehicle.id;

    const affiliateApplication = await request('/api/auth/register/driver', {
      method: 'POST',
      body: {
        ...common,
        fullName: 'Affiliate Application Test',
        email: affiliateEmail,
        driverType: 'affiliateDriver',
        affiliateId: affiliate.id,
      },
    });
    affiliateDriverId = affiliateApplication.user.id;

    const independentApplication = await request('/api/auth/register/driver', {
      method: 'POST',
      body: {
        ...common,
        fullName: 'Independent Application Test',
        email: independentEmail,
        drivingLicenceNumber: `INDEPENDENT${suffix}`,
        privateHireBadgeNumber: `IPH-${suffix}`,
        driverType: 'independentDriver',
      },
    });
    independentDriverId = independentApplication.user.id;

    const rejectedApplication = await request('/api/auth/register/driver', {
      method: 'POST',
      body: {
        ...common,
        fullName: 'Rejected Application Test',
        email: rejectedEmail,
        drivingLicenceNumber: `REJECTED${suffix}`,
        privateHireBadgeNumber: `RPH-${suffix}`,
        driverType: 'independentDriver',
      },
    });
    rejectedDriverId = rejectedApplication.user.id;

    const [adminToken, opsToken, affiliateToken] = await Promise.all([
      login('admin@rideprestige.co.uk', 'Admin@2026!', 'admin'),
      login('ops@rideprestige.co.uk', 'Ops@2026!', 'ops'),
      login('affiliate@settransfers.co.uk', 'Affiliate@123', 'affiliate'),
    ]);

    const [opsApplications, affiliateDrivers] = await Promise.all([
      request('/api/ops/drivers', { token: opsToken }),
      request('/api/affiliate/drivers', { token: affiliateToken }),
    ]);

    const opsAffiliate = opsApplications.data.find(driver => driver.id === affiliateDriverId);
    const opsIndependent = opsApplications.data.find(driver => driver.id === independentDriverId);
    const opsRejected = opsApplications.data.find(driver => driver.id === rejectedDriverId);
    assert(opsAffiliate?.applicationStatus === 'pending', 'Affiliate driver application missing from Operations');
    assert(opsAffiliate?.affiliate?.id === affiliate.id, 'Affiliate relationship missing in Operations');
    assert(opsIndependent?.applicationStatus === 'pending', 'Independent driver application missing from Operations');
    assert(opsRejected?.applicationStatus === 'pending', 'Rejectable driver application missing from Operations');
    assert(affiliateDrivers.data.some(driver => driver.id === affiliateDriverId), 'Applicant missing from selected affiliate portal');
    assert(!affiliateDrivers.data.some(driver => driver.id === independentDriverId), 'Independent applicant leaked into affiliate portal');

    await Promise.all([
      request(`/api/ops/drivers/${affiliateDriverId}/approve`, { method: 'PUT', token: opsToken, body: {} }),
      request(`/api/ops/drivers/${independentDriverId}/approve`, { method: 'PUT', token: opsToken, body: {} }),
      request(`/api/ops/drivers/${rejectedDriverId}/reject`, { method: 'PUT', token: opsToken, body: {} }),
    ]);
    await request('/api/auth/login', {
      method: 'POST',
      body: { email: rejectedEmail, password, role: 'driver' },
      expectedStatus: 403,
    });

    const [affiliateDriverToken, independentDriverToken] = await Promise.all([
      login(affiliateEmail, password, 'driver'),
      login(independentEmail, password, 'driver'),
    ]);

    const created = await request('/api/public/booking', {
      method: 'POST',
      body: {
        fullName: 'Driver Dispatch Test Customer',
        phone: '+44 7700 900999',
        email: `dispatch.${suffix}@example.com`,
        pickupPostcode: 'S1 2BP',
        dropoffPostcode: 'S10 2TN',
        vehicleCategory: 'taxi',
        passengers: 1,
        bookingType: 'current',
        notes: 'Driver application integration test',
      },
    });
    bookingId = created.data.booking.id;
    jobId = created.data.booking.jobId;
    reference = created.data.booking.reference;

    const [affiliateJobs, independentJobs] = await Promise.all([
      request('/api/affiliate/jobs/new', { token: affiliateToken }),
      request('/api/driver/jobs/available', { token: independentDriverToken }),
    ]);
    assert(affiliateJobs.data.some(job => job.id === jobId), 'New booking missing from affiliate job pool');
    assert(independentJobs.data.some(job => job.id === jobId), 'New booking missing from independent driver job pool');
    await request('/api/driver/jobs/available', { token: affiliateDriverToken, expectedStatus: 403 });

    await request(`/api/affiliate/jobs/${jobId}/accept`, { method: 'POST', token: affiliateToken });
    await request(`/api/affiliate/jobs/${jobId}/assign-driver`, {
      method: 'POST',
      token: affiliateToken,
      body: { driverId: affiliateDriverId },
    });
    await request(`/api/affiliate/jobs/${jobId}/assign-vehicle`, {
      method: 'POST',
      token: affiliateToken,
      body: { vehicleId },
    });
    const allocated = await prisma.job.findUnique({ where: { id: jobId } });
    assert(allocated?.affiliateId === affiliate.id, 'Booking was not accepted by the affiliate');
    assert(allocated?.assignedDriverId === affiliateDriverId, 'Affiliate could not allocate its approved driver');
    assert(allocated?.status === 'vehicle_assigned', 'Driver and vehicle allocation did not create an assigned request');

    const assignedJobs = await request('/api/driver/jobs/my', { token: affiliateDriverToken });
    assert(assignedJobs.data.some(job => job.id === jobId && job.status === 'vehicle_assigned'), 'Allocated ride missing from affiliate driver portal');

    await request(`/api/driver/jobs/${jobId}/accept`, { method: 'POST', token: affiliateDriverToken });
    for (const status of ['on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress']) {
      await request(`/api/driver/jobs/${jobId}/status`, {
        method: 'PUT',
        token: affiliateDriverToken,
        body: { status },
      });
    }

    const [opsRides, adminBookings] = await Promise.all([
      request('/api/ops/rides', { token: opsToken }),
      request('/api/admin/bookings?limit=100', { token: adminToken }),
    ]);
    assert(opsRides.data.some(job => job.id === jobId && job.status === 'in_progress'), 'In-progress ride missing from Operations');
    assert(adminBookings.data.some(booking => booking.id === bookingId && booking.status === 'in_progress'), 'In-progress ride missing from Admin');

    await request(`/api/ops/drivers/${independentDriverId}/suspend`, { method: 'PUT', token: opsToken, body: {} });
    await request('/api/auth/login', {
      method: 'POST',
      body: { email: independentEmail, password, role: 'driver' },
      expectedStatus: 403,
    });

    console.log(JSON.stringify({
      success: true,
      reference,
      verified: [
        'unified registration',
        'operations application queue',
        'affiliate driver visibility',
        'operations approval',
        'operations rejection',
        'independent dispatch',
        'affiliate allocation',
        'affiliate driver request visibility',
        'operations in-progress visibility',
        'admin in-progress visibility',
        'driver suspension',
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
    if (vehicleId) await prisma.fleetVehicle.deleteMany({ where: { id: vehicleId } });
    if (affiliateDriverId || independentDriverId || rejectedDriverId) {
      await prisma.notification.deleteMany({
        where: { recipientId: { in: [affiliateDriverId, independentDriverId, rejectedDriverId].filter(Boolean) } },
      });
      await prisma.driver.deleteMany({
        where: { id: { in: [affiliateDriverId, independentDriverId, rejectedDriverId].filter(Boolean) } },
      });
    }
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
