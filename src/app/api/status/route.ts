import { NextRequest, NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';
import { apiHandler } from '@/lib/api-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/status
 * Retorna o status atual do WhatsApp. Somente leitura.
 */
export const GET = apiHandler(async () => {
  const status = whatsappService.getStatus();

  const response = NextResponse.json(status);
  
  // Cache-Control explícito no-store (API-012)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}, { routeName: '/api/status (GET)', requireAuth: true });
