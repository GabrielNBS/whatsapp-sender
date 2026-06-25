import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { MessageSendService } from '@/server/services/MessageSendService';
import { sendMessageSchema } from '@/server/validators/messages';
import { ValidationError } from '@/lib/api-errors';

export const dynamic = 'force-dynamic';

/**
 * POST /api/messages
 * Envia uma mensagem individual pelo WhatsApp com rate-limiting e idempotência.
 */
export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  
  // Normaliza o campo 'number' enviado pelo cliente para 'phone', que é exigido pelo schema
  const payload = {
    ...body,
    phone: body.phone || body.number,
  };

  const validation = sendMessageSchema.safeParse(payload);
  if (!validation.success) {
    throw new ValidationError('Parâmetros de envio inválidos.', validation.error.flatten().fieldErrors);
  }

  // Identificação do IP do cliente para controle de rate limit
  const clientIp = 
    req.headers.get('x-forwarded-for')?.split(',')[0] || 
    req.headers.get('x-real-ip') || 
    '127.0.0.1';

  const result = await MessageSendService.sendMessage(validation.data, clientIp);

  return NextResponse.json(result);
}, { routeName: '/api/messages (POST)', requireAuth: true });
