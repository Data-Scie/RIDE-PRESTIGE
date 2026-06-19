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
  return (await request('/api/auth/login', {
    method: 'POST',
    body: { email, password, role },
  })).token;
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

async function main() {
  const suffix = Date.now();
  const password = 'AffiliateFlow@2026!';
  const opsToken = await login('ops@rideprestige.co.uk', 'Ops@2026!', 'ops');
  const adminToken = await login('admin@rideprestige.co.uk', 'Admin@2026!', 'admin');
  let affiliateId;
  let affiliateToken;
  let driverId;
  let driverToken;
  let vehicleId;
  let bookingId;
  let jobId;
  let reference;

  try {
    const affiliateEmail = `allocation.affiliate.${suffix}@example.com`;
    const registeredAffiliate = await request('/api/auth/register/affiliate', {
      method: 'POST',
      body: {
        companyName: `Allocation Test Affiliate ${suffix}`,
        tradingName: `Allocation Test ${suffix}`,
        contactPerson: 'Allocation Manager',
        email: affiliateEmail,
        phone: '+44 7700 930001',
        password,
        address: '1 Allocation Street',
        city: 'Sheffield',
        postcode: 'S1 2BP',
        operatorLicenceNumber: `OP-${suffix}`,
        companyRegNumber: `CR-${suffix}`,
        serviceAreas: ['S1', 'S10'],
        bankAccountName: 'Allocation Test',
        sortCode: '000000',
        accountNumber: '00000000',
      },
    });
    affiliateId = registeredAffiliate.affiliate.id;
    await request(`/api/ops/affiliates/${affiliateId}/approve`, { method: 'PUT', token: opsToken, body: {} });
    affiliateToken = await login(affiliateEmail, password, 'affiliate');

    const driverEmail = `allocation.driver.${suffix}@example.com`;
    const driver = (await request('/api/affiliate/drivers', {
      method: 'POST',
      token: affiliateToken,
      body: {
        fullName: 'Allocation Test Driver',
        email: driverEmail,
        phone: '+44 7700 930002',
        password,
        address: '2 Allocation Street',
        city: 'Sheffield',
        postcode: 'S1 2BP',
        dateOfBirth: '1990-01-01',
        drivingLicenceNumber: `DL-${suffix}`,
        privateHireBadgeNumber: `PHV-${suffix}`,
      },
    })).data;
    driverId = driver.id;
    await request(`/api/ops/drivers/${driverId}/approve`, { method: 'PUT', token: opsToken, body: {} });
    driverToken = await login(driverEmail, password, 'driver');

    const documents = (await request('/api/driver/documents', { token: driverToken })).data;
    assert(documents.length > 0, 'Affiliate driver documents were not created');
    for (const document of documents) {
      await request(`/api/driver/documents/${document.id}`, {
        method: 'PUT',
        token: driverToken,
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
    await request('/api/driver/status', { method: 'PUT', token: driverToken, body: { status: 'available' } });

    const vehicle = (await request('/api/affiliate/vehicles', {
      method: 'POST',
      token: affiliateToken,
      body: {
        make: 'Mercedes',
        model: 'Allocation Van',
        year: 2026,
        registration: `AFL${String(suffix).slice(-5)}`,
        vehicleType: 'Executive',
        vehicleCategory: 'prestige',
        colour: 'Black',
        passengerCapacity: 4,
        luggageCapacity: 3,
        motExpiry: '2028-12-31',
        insuranceExpiry: '2028-12-31',
        phvLicenceExpiry: '2028-12-31',
      },
    })).data;
    vehicleId = vehicle.id;
    await submitAndApproveAffiliateVehicleDocuments(vehicleId, affiliateToken, opsToken);
    await request(`/api/ops/vehicles/${vehicleId}/approve`, { method: 'PUT', token: opsToken, body: {} });

    const created = await request('/api/public/booking', {
      method: 'POST',
      body: {
        fullName: 'Affiliate Allocation Customer',
        phone: '+44 7700 930003',
        email: `allocation.customer.${suffix}@example.com`,
        pickupPostcode: 'S1 2BP',
        dropoffPostcode: 'S10 2TN',
        vehicleCategory: 'prestige',
        passengers: 2,
        bookingType: 'current',
        notes: 'Affiliate allocation lifecycle verification',
      },
    });
    bookingId = created.data.booking.id;
    jobId = created.data.booking.jobId;
    reference = created.data.booking.reference;

    const newJobs = await request('/api/affiliate/jobs/new', { token: affiliateToken });
    assert(newJobs.data.some(job => job.id === jobId), 'Affiliate cannot see matching new booking');
    const eligibleDrivers = await request(`/api/affiliate/drivers?status=available&jobId=${jobId}`, { token: affiliateToken });
    const eligibleVehicles = await request(`/api/affiliate/vehicles?status=available&jobId=${jobId}`, { token: affiliateToken });
    assert(eligibleDrivers.data.some(driver => driver.id === driverId), 'Approved affiliate driver is not eligible for allocation');
    assert(eligibleVehicles.data.some(vehicle => vehicle.id === vehicleId), 'Approved affiliate vehicle is not eligible for allocation');

    await request(`/api/affiliate/jobs/${jobId}/accept`, { method: 'POST', token: affiliateToken, body: {} });
    await request(`/api/affiliate/jobs/${jobId}/assign-vehicle`, { method: 'POST', token: affiliateToken, body: { vehicleId } });
    const assigned = await request(`/api/affiliate/jobs/${jobId}/assign-driver`, { method: 'POST', token: affiliateToken, body: { driverId } });
    assert(assigned.data.status === 'vehicle_assigned', 'Assigned affiliate ride is not ready for driver acceptance');
    assert(assigned.data.assignedDriverId === driverId, 'Affiliate driver assignment was not saved');
    assert(assigned.data.assignedVehicleId === vehicleId, 'Affiliate vehicle assignment was not saved');

    const currentBeforeAccept = await request('/api/driver/jobs/current', { token: driverToken });
    assert(currentBeforeAccept.data?.id === jobId, 'Assigned ride is not visible on driver portal');
    assert(currentBeforeAccept.data?.vehicle?.id === vehicleId, 'Allocated vehicle is not visible on driver portal');
    assert(currentBeforeAccept.data.status === 'vehicle_assigned', 'Driver portal ride is not ready to accept');

    await request(`/api/driver/jobs/${jobId}/accept`, { method: 'POST', token: driverToken, body: {} });
    for (const status of ['on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress', 'completed']) {
      await request(`/api/driver/jobs/${jobId}/status`, {
        method: 'PUT',
        token: driverToken,
        body: { status },
      });
    }

    const [booking, ride, affiliateEarnings, adminBookings] = await Promise.all([
      request(`/api/admin/bookings/${bookingId}`, { token: adminToken }),
      request(`/api/ops/rides/${jobId}`, { token: opsToken }),
      request('/api/affiliate/earnings', { token: affiliateToken }),
      request('/api/admin/bookings?limit=200', { token: adminToken }),
    ]);
    assert(booking.data.status === 'completed', 'Booking did not complete');
    assert(ride.data.status === 'completed', 'Ops ride did not complete');
    assert(ride.data.affiliateId === affiliateId, 'Ops ride lost affiliate assignment');
    assert(ride.data.assignedDriverId === driverId, 'Ops ride lost driver assignment');
    assert(ride.data.assignedVehicleId === vehicleId, 'Ops ride lost vehicle assignment');
    assert(affiliateEarnings.data.some(item => item.jobId === jobId), 'Affiliate earning was not created on completion');
    assert(adminBookings.data.some(item => item.id === bookingId && item.driverName && item.vehicleLabel), 'Admin bookings lacks driver/vehicle allocation columns');

    const completedDriver = await prisma.driver.findUnique({ where: { id: driverId } });
    const completedVehicle = await prisma.fleetVehicle.findUnique({ where: { id: vehicleId } });
    assert(completedDriver?.status === 'available', 'Driver was not released after completion');
    assert(completedVehicle?.status === 'available', 'Vehicle was not released after completion');

    console.log(JSON.stringify({
      success: true,
      reference,
      verified: [
        'affiliate registration and approval',
        'affiliate driver approval and document approval',
        'affiliate vehicle approval',
        'booking appears to matching affiliate',
        'eligible driver and vehicle filtering',
        'vehicle then driver allocation',
        'driver portal current ride and allocated vehicle',
        'driver acceptance and status progression',
        'booking completion',
        'affiliate earnings and finance records',
        'admin/ops allocation visibility',
        'driver and vehicle release after completion',
      ],
    }));
  } finally {
    if (jobId) {
      await prisma.earningEntry.deleteMany({ where: { jobId } });
      await prisma.payment.deleteMany({ where: { jobId } });
      await prisma.rideStatusHistory.deleteMany({ where: { jobId } });
      await prisma.rideOffer.deleteMany({ where: { jobId } });
    }
    if (reference) {
      await prisma.notification.deleteMany({ where: { body: { contains: reference } } });
    }
    if (jobId) await prisma.job.deleteMany({ where: { id: jobId } });
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (vehicleId) await prisma.fleetVehicle.deleteMany({ where: { id: vehicleId } });
    if (driverId) {
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
