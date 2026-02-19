import { NextRequest, NextResponse } from 'next/server';

/**
 * Standardized API error response shape.
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
}

/**
 * Wraps an API route handler with consistent error handling.
 * 
 * Usage:
 * ```ts
 * export const GET = apiHandler(async (req) => {
 *   const data = await fetchSomething();
 *   return NextResponse.json(data);
 * });
 * ```
 */
export function apiHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: { routeName?: string }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error: unknown) {
      const routeName = options?.routeName || req.nextUrl.pathname;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`[API Error] ${routeName}:`, {
        method: req.method,
        url: req.nextUrl.pathname,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      const response: ApiErrorResponse = {
        error: `Falha ao processar requisição em ${routeName}`,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(response, { status: 500 });
    }
  };
}
