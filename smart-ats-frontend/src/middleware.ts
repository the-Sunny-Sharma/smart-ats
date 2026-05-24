import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require auth
const PUBLIC_PATHS = ['/login', '/register', '/docs'];

// Routes that are always public regardless (landing, etc.)
const PUBLIC_PREFIXES = ['/landing', '/_next', '/favicon', '/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and static assets
  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // Check for JWT token in cookies
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // Redirect to login, preserving the intended destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — let the request through.
  // Full JWT verification happens on the backend for every API call.
  return NextResponse.next();
}

// Apply middleware to all routes except Next.js internals and static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};