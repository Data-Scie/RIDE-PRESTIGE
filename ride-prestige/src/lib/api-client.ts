const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; samesite=lax`;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function getToken(role: 'ops' | 'affiliate' | 'driver' | 'customer'): string | null {
  return getCookie(`rp_${role}_jwt`);
}

async function request<T>(
  path: string,
  role: 'ops' | 'affiliate' | 'driver' | 'customer',
  options: RequestInit = {},
): Promise<T> {
  const token = getToken(role);
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message || 'Request failed'), { status: res.status });
  }
  return res.json() as Promise<T>;
}

export const opsApi = {
  get:  <T>(path: string)              => request<T>(path, 'ops'),
  post: <T>(path: string, body: unknown) => request<T>(path, 'ops', { method: 'POST', body: JSON.stringify(body) }),
  put:  <T>(path: string, body: unknown) => request<T>(path, 'ops', { method: 'PUT',  body: JSON.stringify(body) }),
};

export const affiliateApi = {
  get:  <T>(path: string)              => request<T>(path, 'affiliate'),
  post: <T>(path: string, body: unknown) => request<T>(path, 'affiliate', { method: 'POST', body: JSON.stringify(body) }),
  put:  <T>(path: string, body: unknown) => request<T>(path, 'affiliate', { method: 'PUT',  body: JSON.stringify(body) }),
};

export const driverApi = {
  get:  <T>(path: string)              => request<T>(path, 'driver'),
  post: <T>(path: string, body: unknown) => request<T>(path, 'driver', { method: 'POST', body: JSON.stringify(body) }),
  put:  <T>(path: string, body: unknown) => request<T>(path, 'driver', { method: 'PUT',  body: JSON.stringify(body) }),
};

export const customerApi = {
  get:  <T>(path: string)              => request<T>(path, 'customer'),
  post: <T>(path: string, body: unknown) => request<T>(path, 'customer', { method: 'POST', body: JSON.stringify(body) }),
  put:  <T>(path: string, body: unknown) => request<T>(path, 'customer', { method: 'PUT',  body: JSON.stringify(body) }),
};

export async function backendLogin(
  email: string,
  password: string,
  role: 'ops' | 'affiliate' | 'driver' | 'customer',
): Promise<{ token: string; user: Record<string, unknown> }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}
