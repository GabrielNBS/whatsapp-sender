import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { PERSONAL_AUTH_COOKIE } from "@/lib/personal-auth";

export const POST = apiHandler(async () => {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(PERSONAL_AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}, { routeName: "/api/auth/logout (POST)" });
