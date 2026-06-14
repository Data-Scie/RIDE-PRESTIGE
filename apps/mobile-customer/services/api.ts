import AsyncStorage from '@react-native-async-storage/async-storage';

// On a physical device, use your machine's LAN IP instead of localhost.
// Set EXPO_PUBLIC_API_URL in a .env file, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.100:4000
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'rp_customer_jwt';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function storeToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}
export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? json.error ?? `HTTP ${res.status}`);
  return json as T;
}

export const customerApi = {
  get:  <T>(path: string)               => req<T>('GET',  path),
  post: <T>(path: string, body: unknown) => req<T>('POST', path, body),
  put:  <T>(path: string, body: unknown) => req<T>('PUT',  path, body),
};

// Extract UK postcode from a full address string
export function extractPostcode(address: string): string {
  const m = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);
  return m ? m[0].toUpperCase() : address.trim();
}

// Map app vehicle category names to backend enum values
export function mapVehicleCategory(cat: string): string {
  const m: Record<string, string> = {
    'Prestige':     'prestige',
    'Executive XL': 'prestige',
    'Minibus':      'minibus',
    'Coach':        'coaches',
  };
  return m[cat] ?? 'prestige';
}

export async function login(email: string, password: string): Promise<{ id: string; name: string; email: string }> {
  const r = await req<{ success: boolean; token: string; user: { id: string; name?: string; fullName?: string; email: string } }>(
    'POST', '/api/auth/login', { email, password, role: 'customer' }
  );
  await storeToken(r.token);
  return { id: r.user.id, name: r.user.name ?? r.user.fullName ?? email.split('@')[0], email: r.user.email };
}

export async function createBooking(params: {
  pickupAddress: string; dropoffAddress: string; passengers: number;
  vehicleCategory: string; bookingType: string; date?: string; time?: string; notes?: string;
}): Promise<{ id: string; bookingRef: string }> {
  const r = await req<{ success: boolean; data: { id: string; reference: string } }>(
    'POST', '/api/customer/bookings', {
      pickupPostcode:  extractPostcode(params.pickupAddress),
      dropoffPostcode: extractPostcode(params.dropoffAddress),
      vehicleCategory: mapVehicleCategory(params.vehicleCategory),
      passengers:      params.passengers,
      bookingType:     params.bookingType,
      date:            params.date,
      time:            params.time,
      notes:           params.notes,
    }
  );
  return { id: r.data.id, bookingRef: r.data.reference };
}

export async function getBookings(): Promise<Array<{ id: string; bookingRef: string; status: string; pickupPostcode: string; dropoffPostcode: string; createdAt: string; fareAmount?: number }>> {
  const r = await req<{
    success: boolean;
    data: Array<{
      id: string;
      reference: string;
      status: string;
      createdAt: string;
      journey: { pickupPostcode: string; dropoffPostcode: string };
      estimatedFare?: number | null;
    }>;
  }>(
    'GET', '/api/customer/bookings'
  );
  return r.data.map(booking => ({
    id: booking.id,
    bookingRef: booking.reference,
    status: booking.status,
    pickupPostcode: booking.journey.pickupPostcode,
    dropoffPostcode: booking.journey.dropoffPostcode,
    createdAt: booking.createdAt,
    fareAmount: booking.estimatedFare ?? undefined,
  }));
}

export async function cancelBooking(id: string): Promise<void> {
  await req('PUT', `/api/customer/bookings/${id}/cancel`, {});
}

export async function trackBooking(id: string): Promise<{ status: string; driverName?: string; driverPhone?: string; licencePlate?: string; eta?: string }> {
  const r = await req<{
    success: boolean;
    data: {
      bookingStatus: string;
      jobStatus: string | null;
      driver: { name: string; phone: string } | null;
    };
  }>(
    'GET', `/api/customer/bookings/${id}/track`
  );
  return {
    status: r.data.jobStatus ?? r.data.bookingStatus,
    driverName: r.data.driver?.name,
    driverPhone: r.data.driver?.phone,
  };
}

export async function rateBooking(id: string, rating: number, review?: string): Promise<void> {
  await req('POST', `/api/customer/bookings/${id}/rate`, { rating, review });
}

export async function getProfile(): Promise<{ id: string; fullName: string; email: string; phone: string; }> {
  const r = await req<{ success: boolean; data: { id: string; fullName: string; email: string; phone: string } }>(
    'GET', '/api/customer/profile'
  );
  return r.data;
}

export async function updateProfile(data: { fullName?: string; phone?: string }): Promise<void> {
  await req('PUT', '/api/customer/profile', data);
}

export async function getQuote(params: {
  pickupAddress: string;
  dropoffAddress: string;
  vehicleCategory: string;
  passengers: number;
  bookingType?: 'current' | 'scheduled';
}): Promise<{ fareAmount: number; distance: string; duration: string }> {
  const r = await req<{
    success: boolean;
    data: {
      calculation: {
        total: number;
        estimatedDistanceMiles: number;
        estimatedHours: number;
      };
    };
  }>(
    'POST', '/api/public/quote', {
      pickupPostcode:  extractPostcode(params.pickupAddress),
      dropoffPostcode: extractPostcode(params.dropoffAddress),
      vehicleCategory: mapVehicleCategory(params.vehicleCategory),
      passengers:      params.passengers,
      bookingType:     params.bookingType ?? 'current',
    }
  );
  return {
    fareAmount: r.data.calculation.total,
    distance: `${r.data.calculation.estimatedDistanceMiles} miles`,
    duration: `${Math.round(r.data.calculation.estimatedHours * 60)} min`,
  };
}

export async function submitSupportTicket(params: { bookingRef?: string; topic: string; message: string }): Promise<void> {
  const profile = await getProfile();
  await req('POST', '/api/public/contact', {
    name:    profile.fullName,
    email:   profile.email,
    phone:   profile.phone,
    subject: params.topic,
    message: params.message,
    bookingReference: params.bookingRef,
    type: params.bookingRef ? 'booking_support' : 'enquiry',
  });
}
