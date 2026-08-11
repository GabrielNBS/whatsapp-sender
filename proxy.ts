import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || `req-${nanoid()}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('x-request-id', requestId);
  return response;
}
