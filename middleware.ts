import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export function middleware() {
  const requestId = `req-${nanoid()}`;

  const response = NextResponse.next();

  response.headers.set("x-request-id", requestId);

  return response;
}
