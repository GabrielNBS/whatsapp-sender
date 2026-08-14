import { NextRequest, NextResponse } from "next/server";
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

  const getHost = (value: string) => {
    if (!value) return '';
    try {
      return new URL(value.includes('://') ? value : `http://${value}`).host;
    } catch {
      return '';
    }
  };

  const requestHost = getHost(host);
  const isSameHost = (value: string) => !value || getHost(value) === requestHost;
  return Boolean(requestHost) && isSameHost(referer) && isSameHost(origin);
}

type ApiRouteContext = { params: Promise<Record<string, string>> };

export function apiHandler<Context extends ApiRouteContext = ApiRouteContext>(
  handler: (req: NextRequest, context: Context) => Promise<Response>,
  options?: {
    routeName?: string;
    requireAuth?: boolean;
  }
) {
  return async (nextReq: NextRequest, context: Context): Promise<Response> => {
    const correlationId = nextReq.headers.get('x-request-id') || `req-${nanoid()}`;
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

        const response = await handler(nextReq, context as Context);
        const duration = Date.now() - startTime;
        const statusCode = response.status;

        // Rotas de polling contínuo (não devem poluir o terminal quando bem sucedidas)
        const isPolling = 
          url === '/api/status' || 
          url === '/api/metrics/realtime' || 
          url === '/api/analytics' || 
          url.startsWith('/api/campaigns/status') || 
          url.startsWith('/api/schedule');

        if (statusCode >= 400) {
          logger.warn(
            { url, method, statusCode, durationMs: duration, correlationId },
            `[API Warn] ${method} ${routeName} -> ${statusCode} (${duration}ms)`
          );
        } else if (isPolling) {
          logger.debug(
            { url, method, statusCode, durationMs: duration },
            `[API Poll] ${method} ${routeName} -> ${statusCode} (${duration}ms)`
          );
        } else {
          logger.info(
            { url, method, statusCode, durationMs: duration, correlationId },
            `[API] ${method} ${routeName} -> ${statusCode} (${duration}ms)`
          );
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

        logger.error(
          {
            method,
            url,
            statusCode,
            errorCode,
            durationMs: duration,
            correlationId,
            err: error instanceof Error ? error : undefined,
          },
          `[API Error] ${method} ${routeName} -> ${statusCode} [${errorCode}] (${duration}ms) - ${message}`
        );

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
