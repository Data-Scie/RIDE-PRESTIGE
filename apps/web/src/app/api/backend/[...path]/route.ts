import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ROLE_COOKIE: Record<string, string> = {
  admin: 'rp_admin_jwt',
  ops: 'rp_ops_jwt',
  affiliate: 'rp_affiliate_jwt',
  driver: 'rp_driver_jwt',
  customer: 'rp_customer_jwt',
};

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const role = path[0];
  const cookieName = ROLE_COOKIE[role];
  const isPublicRoute = role === 'public';
  if (!cookieName && !isPublicRoute) {
    return NextResponse.json({ success: false, message: 'Unsupported API route' }, { status: 400 });
  }

  const token = cookieName ? request.cookies.get(cookieName)?.value : undefined;
  if (!isPublicRoute && !token) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const upstreamUrl = new URL(`/api/${path.join('/')}`, API_URL);
  request.nextUrl.searchParams.forEach((value, key) => upstreamUrl.searchParams.append(key, value));

  try {
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text();
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body,
      cache: 'no-store',
    });
    const responseBody = await upstream.text();
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'The backend API is currently unreachable' },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
