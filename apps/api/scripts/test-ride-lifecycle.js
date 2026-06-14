const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:4000';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${payload.message || 'Request failed'}`);
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
  const affiliate = await prisma.affiliate.findUnique({ where: { id: 'aff-1' } });
  const driver = await prisma.driver.findUnique({ where: { id: 'drv-2' } });
  const customer = await prisma.customer.findUnique({ where: { email: 'james@example.com' } });
  assert(affiliate && driver && customer, 'Seed affiliate, independent driver, and customer are required');

  const originalAffiliateApproved = affiliate.isApproved;
  const originalDriver = {
    isApproved: driver.isApproved,
    status: driver.status,
    totalJobs: driver.totalJobs,
    totalEarnings: driver.totalEarnings,
  };
  const originalCustomerBookings = customer.totalBookings;

  let bookingId;
  let jobId;
  let reference;

  try {
    await prisma.affiliate.update({ where: { id: affiliate.id }, data: { isApproved: true } });
    await prisma.driver.update({
      where: { id: driver.id },
      data: { isApproved: true, status: 'available' },
    });

    const [adminToken, opsToken, affiliateToken, driverToken, customerToken] = await Promise.all([
      login('admin@rideprestige.co.uk', 'Admin@2026!', 'admin'),
      login('ops@rideprestige.co.uk', 'Ops@2026!', 'ops'),
      login('affiliate@settransfers.co.uk', 'Affiliate@123', 'affiliate'),
      login('thomas.driver@example.com', 'Driver@123', 'driver'),
      login('james@example.com', 'Customer@123', 'customer'),
    ]);

    const created = await request('/api/public/booking', {
      method: 'POST',
      body: {
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        pickupPostcode: 'S1 2BP',
        dropoffPostcode: 'S10 2TN',
        vehicleCategory: 'taxi',
        passengers: 1,
        bookingType: 'current',
        notes: 'Automated lifecycle verification',
      },
    });

    const booking = created.data.booking;
    bookingId = booking.id;
    jobId = booking.jobId;
    reference = booking.reference;
    assert(booking.customerId === undefined || booking.customerId === customer.id, 'Unexpected customer association');

    const [adminBookings, opsRides, customerBookings, affiliateJobs, driverJobs] = await Promise.all([
      request('/api/admin/bookings?limit=100', { token: adminToken }),
      request('/api/ops/rides', { token: opsToken }),
      request('/api/customer/bookings', { token: customerToken }),
      request('/api/affiliate/jobs/new', { token: affiliateToken }),
      request('/api/driver/jobs/available', { token: driverToken }),
    ]);

    assert(adminBookings.data.some(item => item.id === bookingId), 'Booking missing from admin portal');
    assert(opsRides.data.some(item => item.id === jobId), 'Ride missing from operations portal');
    assert(customerBookings.data.some(item => item.id === bookingId), 'Booking missing from customer portal');
    assert(affiliateJobs.data.some(item => item.id === jobId), 'Ride missing from affiliate new jobs');
    assert(driverJobs.data.some(item => item.id === jobId), 'Ride missing from independent driver jobs');

    await request(`/api/driver/jobs/${jobId}/claim`, { method: 'POST', token: driverToken });
    for (const status of ['on_route', 'arrived_pickup', 'passenger_onboard', 'in_progress', 'completed']) {
      await request(`/api/driver/jobs/${jobId}/status`, {
        method: 'PUT',
        token: driverToken,
        body: { status },
      });
    }

    const [completedBooking, completedRide, customerTracking, earnings] = await Promise.all([
      request(`/api/admin/bookings/${bookingId}`, { token: adminToken }),
      request(`/api/ops/rides/${jobId}`, { token: opsToken }),
      request(`/api/customer/bookings/${bookingId}/track`, { token: customerToken }),
      request('/api/driver/earnings', { token: driverToken }),
    ]);

    assert(completedBooking.data.status === 'completed', 'Customer booking was not completed');
    assert(completedRide.data.status === 'completed', 'Operations ride was not completed');
    assert(customerTracking.data.jobStatus === 'completed', 'Customer tracking did not show completion');
    assert(earnings.data.some(item => item.jobId === jobId), 'Driver earnings were not created');

    console.log(JSON.stringify({
      success: true,
      reference,
      verified: ['customer', 'admin', 'operations', 'affiliate', 'driver', 'completion', 'earnings'],
    }));
  } finally {
    if (jobId) {
      await prisma.earningEntry.deleteMany({ where: { jobId } });
      await prisma.rideStatusHistory.deleteMany({ where: { jobId } });
      await prisma.notification.deleteMany({ where: { body: { contains: reference || jobId } } });
    }
    if (bookingId) await prisma.booking.deleteMany({ where: { id: bookingId } });
    if (jobId) await prisma.job.deleteMany({ where: { id: jobId } });
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { isApproved: originalAffiliateApproved },
    });
    await prisma.driver.update({
      where: { id: driver.id },
      data: originalDriver,
    });
    await prisma.customer.update({
      where: { id: customer.id },
      data: { totalBookings: originalCustomerBookings },
    });
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
