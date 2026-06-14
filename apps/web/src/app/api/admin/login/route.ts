import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  try {
    // Try admin role first, then ops
    let backendRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role: 'admin' }),
    });

    if (!backendRes.ok) {
      backendRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'ops' }),
      });
    }

    if (!backendRes.ok) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const { token } = await backendRes.json();

    const response = NextResponse.json({ success: true, token });
    // JS-readable cookie so client-side adminApi can send it in Authorization header
    response.cookies.set('rp_admin_jwt', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Server error — is the API running on port 4000?' }, { status: 500 });
  }
}
