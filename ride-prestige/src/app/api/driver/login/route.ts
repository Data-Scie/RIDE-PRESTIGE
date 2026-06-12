import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const upstream = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role: 'driver' }),
  });
  const data = await upstream.json();
  if (!upstream.ok) {
    return NextResponse.json({ error: data.message || 'Invalid credentials' }, { status: upstream.status });
  }
  const res = NextResponse.json({ success: true, user: data.user });
  res.cookies.set('rp_driver_jwt', data.token, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
