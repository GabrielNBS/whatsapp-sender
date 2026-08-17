import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const PERSONAL_AUTH_COOKIE = "whatsapp-sender-session";

type RequestWithCookies = Request | NextRequest;

function getConfiguredAccessToken(): string | null {
  const token = process.env.APP_ACCESS_TOKEN?.trim();
  return token && token.length >= 32 ? token : null;
}

function secureEquals(candidate: string | null, expected: string): boolean {
  if (!candidate || candidate.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}

function getCookieValue(request: RequestWithCookies, name: string): string | null {
  if ("cookies" in request && request.cookies) {
    return request.cookies.get(name)?.value ?? null;
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const cookie = cookieHeader.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function getBearerToken(request: RequestWithCookies): string | null {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function isPersonalAuthConfigured(): boolean {
  return getConfiguredAccessToken() !== null;
}

export function verifyPersonalAccessToken(candidate: string | null | undefined): boolean {
  const expected = getConfiguredAccessToken();
  return Boolean(expected && secureEquals(candidate ?? null, expected));
}

export function getRequestAuthMethod(request: RequestWithCookies): "bearer" | "cookie" | null {
  if (verifyPersonalAccessToken(getBearerToken(request))) return "bearer";
  if (verifyPersonalAccessToken(getCookieValue(request, PERSONAL_AUTH_COOKIE))) return "cookie";
  return null;
}

export function isAuthorizedRequest(request: RequestWithCookies): boolean {
  return getRequestAuthMethod(request) !== null;
}

/** Validates the browser origin when authentication comes from the HttpOnly cookie. */
export function isSameOriginRequest(request: RequestWithCookies): boolean {
  const originOrReferer = request.headers.get("origin") || request.headers.get("referer");
  if (!originOrReferer) return false;

  try {
    const actualOrigin = new URL(originOrReferer).origin;
    const requestUrl = "nextUrl" in request ? request.nextUrl.toString() : request.url;
    return actualOrigin === new URL(requestUrl).origin;
  } catch {
    return false;
  }
}
