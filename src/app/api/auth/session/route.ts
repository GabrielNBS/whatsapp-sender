import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async () => NextResponse.json({ authenticated: true }), {
  routeName: "/api/auth/session (GET)",
});
