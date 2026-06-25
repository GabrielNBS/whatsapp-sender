import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { logger } from "./logger";
import { ApiError, mapPrismaError, isPrismaError, UnauthorizedError } from "./api-errors";
import { nanoid } from "nanoid";
import { runWithRequestId } from "./CorrelationId";

export interface ApiErrorPayload {
  error: string;
  code: string;
  details?: unknown;
  timestamp: string;
  correlationId: string;
}

export function isAuthorizedRequest(req: Request | NextRequest): boolean {
  const host = req.headers.get("host") || "";
  const referer = req.headers.get("referer") || "";
  const origin = req.headers.get("origin") || "";
  const userAgent = req.headers.get("user-agent") || "";

  const isLocalHost = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("::1");
  const isLocalReferer = referer.includes("localhost") || referer.includes("127.0.0.1") || referer === "";
  const isLocalOrigin = origin.includes("localhost") || origin.includes("127.0.0.1") || origin === "";
  const isElectron = userAgent.toLowerCase().includes("electron");

  const appToken = process.env.APP_SESSION_TOKEN;
  if (appToken) {
    const authHeader = req.headers.get("authorization") || req.headers.get("x-app-token") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return false;
    }

    const tokenBuffer = Buffer.from(token);
    const appTokenBuffer = Buffer.from(appToken);

    if (tokenBuffer.length !== appTokenBuffer.length) {
      return false;
    }

    return timingSafeEqual(tokenBuffer, appTokenBuffer);
  }

  return isLocalHost && (isLocalReferer || isLocalOrigin || isElectron);
}

export function apiHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options?: {
    routeName?: string;
    requireAuth?: boolean;
  }
) {
  return async (req: Request | NextRequest, context?: any): Promise<NextResponse> => {
    const nextReq = req instanceof NextRequest
      ? req
      : new NextRequest(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
          duplex: "half",
        } as any);

    const correlationId = nanoid();
    const startTime = Date.now();
    const method = nextReq.method;
    const url = nextReq.nextUrl.pathname;
    const routeName = options?.routeName || url;

    return runWithRequestId(correlationId, async () => {
      try {
        const requireAuth = options?.requireAuth ?? true;
        if (requireAuth && !isAuthorizedRequest(nextReq)) {
          throw new UnauthorizedError("Acesso recusado: requisicao nao autorizada.");
        }

        const response = await handler(nextReq, context);
        const duration = Date.now() - startTime;

        const logPayload = {
          msg: `[API Success] ${method} ${routeName}`,
          method,
          url,
          statusCode: response.status,
          durationMs: duration,
          correlationId,
        };

        const isPolling = 
          url === '/api/status' || 
          url === '/api/metrics/realtime' || 
          url === '/api/analytics' || 
          url.startsWith('/api/campaigns/status') || 
          url.startsWith('/api/schedule');

        if (process.env.NODE_ENV === 'development' && isPolling && response.status < 400) {
          logger.debug(logPayload);
        } else {
          logger.info(logPayload);
        }

        return response;
      } catch (error: unknown) {
        const duration = Date.now() - startTime;

        let statusCode = 500;
        let errorCode = "INTERNAL_SERVER_ERROR";
        let message = "Falha ao processar requisicao";
        let details: unknown = null;

        if (error instanceof ApiError) {
          statusCode = error.statusCode;
          errorCode = error.code;
          message = error.message;
          details = error.details ?? null;
        } else if (isPrismaError(error)) {
          const prismaErr = mapPrismaError(error);
          statusCode = prismaErr.statusCode;
          errorCode = prismaErr.code;
          message = prismaErr.message;
        } else if (error instanceof Error && error.name === "AbortError") {
          statusCode = 499;
          errorCode = "REQUEST_ABORTED";
          message = "A requisicao foi cancelada pelo cliente.";
        }

        logger.error({
          msg: `[API Error] ${method} ${routeName} - ${errorCode}`,
          method,
          url,
          statusCode,
          errorCode,
          durationMs: duration,
          correlationId,
          err: error instanceof Error ? error : undefined,
        });

        const payload: ApiErrorPayload = {
          error: message,
          code: errorCode,
          details,
          timestamp: new Date().toISOString(),
          correlationId,
        };

        return NextResponse.json(payload, { status: statusCode });
      }
    });
  };
}
export default apiHandler;
