import { generateRequestId } from "@/lib/CorrelationId";
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const requestId = generateRequestId();

  const response = NextResponse.next();

  response.headers.set("x-request-id", requestId);

  return response;
}