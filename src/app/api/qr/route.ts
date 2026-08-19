import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { getWhatsAppApplicationService } from '@/server/services/service-factory';

export const dynamic = 'force-dynamic';

/**
 * GET /api/qr
 * Retorna o QR Code e status do WhatsApp. Somente leitura.
 */
export const GET = apiHandler(async () => {
  const response = NextResponse.json(getWhatsAppApplicationService().getConnectionSnapshot());
  
  // Cache-Control explícito no-store (API-012)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}, { routeName: '/api/qr (GET)', requireAuth: true });

