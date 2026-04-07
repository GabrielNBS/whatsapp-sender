import { generateRequestId } from "@/lib/CorrelationId";
import { NextResponse } from "next/server";

export function middleware() {
  const requestId = generateRequestId();

  const response = NextResponse.next();

  response.headers.set("x-request-id", requestId);

  return response;
}
