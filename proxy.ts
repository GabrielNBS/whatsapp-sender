import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

const PERSONAL_AUTH_COOKIE = 'whatsapp-sender-session';

export function proxy(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req-${nanoid()}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const requiresPersonalLogin = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/dashboard');
  if (requiresPersonalLogin && !request.cookies.has(PERSONAL_AUTH_COOKIE)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('x-request-id', requestId);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('x-request-id', requestId);
  return response;
}
