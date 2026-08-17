import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { ForbiddenError, UnauthorizedError } from "@/lib/api-errors";
import { PERSONAL_AUTH_COOKIE, isPersonalAuthConfigured, isSameOriginRequest, verifyPersonalAccessToken } from "@/lib/personal-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const loginSchema = z.object({ token: z.string().min(1).max(512) });

export const POST = apiHandler(async (request: NextRequest) => {
  if (!isPersonalAuthConfigured()) {
    throw new UnauthorizedError("A chave de acesso pessoal ainda nao foi configurada.");
  }
  if (!isSameOriginRequest(request)) {
    throw new ForbiddenError("A origem da requisicao nao e confiavel.");
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  checkRateLimit(`personal-login-${clientIp}`, 5, 10 * 60 * 1000);

  const parsed = loginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success || !verifyPersonalAccessToken(parsed.data.token)) {
    throw new UnauthorizedError("Chave de acesso invalida.");
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(PERSONAL_AUTH_COOKIE, parsed.data.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}, { routeName: "/api/auth/login (POST)", requireAuth: false });
