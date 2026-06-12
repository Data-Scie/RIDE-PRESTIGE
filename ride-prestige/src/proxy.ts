import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE  = 'rp_admin_token';
const ADMIN_SECRET  = process.env.ADMIN_SECRET || 'rp_admin_secure_2026';

function hasJwt(request: NextRequest, cookieName: string): boolean {
  const token = request.cookies.get(cookieName)?.value;
  return !!token && token.split('.').length === 3;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Website CMS admin panel (uses static secret cookie)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (token !== ADMIN_SECRET) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Operations portal (JWT cookie)
  if (pathname.startsWith('/ops') && !pathname.startsWith('/ops/login')) {
    if (!hasJwt(request, 'rp_ops_jwt')) {
      return NextResponse.redirect(new URL('/ops/login', request.url));
    }
  }

  // Affiliate portal (JWT cookie)
  if (
    pathname.startsWith('/affiliate') &&
    !pathname.startsWith('/affiliate/login') &&
    !pathname.startsWith('/affiliate/register')
  ) {
    if (!hasJwt(request, 'rp_affiliate_jwt')) {
      return NextResponse.redirect(new URL('/affiliate/login', request.url));
    }
  }

  // Driver portal (JWT cookie)
  if (
    pathname.startsWith('/driver') &&
    !pathname.startsWith('/driver/login') &&
    !pathname.startsWith('/driver/register')
  ) {
    if (!hasJwt(request, 'rp_driver_jwt')) {
      return NextResponse.redirect(new URL('/driver/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/ops/:path*', '/affiliate/:path*', '/driver/:path*'],
};
