import { NextRequest, NextResponse } from 'next/server';
import whatsappService from '@/lib/whatsapp';
import { apiHandler } from '@/lib/api-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/qr
 * Retorna o QR Code e status do WhatsApp. Somente leitura.
 */
export const GET = apiHandler(async () => {
  const qr = whatsappService.getQrCode();
  const status = whatsappService.getStatus();

  const response = NextResponse.json({ qr, status });
  
  // Cache-Control explícito no-store (API-012)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}, { routeName: '/api/qr (GET)', requireAuth: true });

