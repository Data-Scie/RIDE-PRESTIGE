import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rideprestige.co.uk';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'rp_admin_secure_2026';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('rp_admin_token', ADMIN_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
}
