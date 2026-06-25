import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiHandler } from '@/lib/api-handler';
import { UnauthorizedError, ValidationError } from '@/lib/api-errors';
import whatsappService from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/test
 * Envia um relatório de teste para todos os gestores ativos.
 * Restrito apenas para ambiente de desenvolvimento (API-009).
 */
export const POST = apiHandler(async () => {
  // Restringe a execução apenas em desenvolvimento (API-009)
  if (process.env.NODE_ENV === 'production') {
    throw new UnauthorizedError('Acesso negado: Este endpoint está disponível apenas em ambiente de desenvolvimento.');
  }

  // Busca destinatários ativos
  const recipients = await prisma.reportRecipient.findMany({
    where: { isActive: true },
  });

  if (recipients.length === 0) {
    throw new ValidationError('Nenhum destinatário ativo cadastrado para receber o teste.');
  }

  const testMessage = `
📊 *TESTE DE RELATÓRIO*
━━━━━━━━━━━━━━━━━━━

✅ Sistema funcionando!
📱 Este é um teste do sistema de relatórios automáticos.

⏰ Horário: ${new Date().toLocaleString('pt-BR')}
👤 Destinatários ativos: ${recipients.length}

━━━━━━━━━━━━━━━━━━━
_Se você recebeu esta mensagem, o sistema está configurado corretamente._
`.trim();

  const results = [];

  for (const recipient of recipients) {
    try {
      // Chama o whatsappService diretamente ao invés de fazer fetch interno (API-009)
      const response = await whatsappService.sendMessage(recipient.phone, testMessage);
      
      results.push({
        name: recipient.name,
        phone: recipient.phone,
        success: response.success,
        response,
      });

      // Pequeno delay preventivo entre os disparos
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: unknown) {
      results.push({
        name: recipient.name,
        phone: recipient.phone,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const successCount = results.filter(r => r.success).length;

  return NextResponse.json({
    message: `Teste enviado para ${successCount}/${recipients.length} gestores`,
    results,
  });
}, { routeName: '/api/reports/test (POST)', requireAuth: true });

/**
 * GET /api/reports/test
 * Lista os destinatários de teste para auditoria (apenas em desenvolvimento).
 */
export const GET = apiHandler(async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new UnauthorizedError('Acesso negado.');
  }

  const recipients = await prisma.reportRecipient.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      phone: true,
      isActive: true,
    },
  });

  return NextResponse.json({
    count: recipients.length,
    recipients,
  });
}, { routeName: '/api/reports/test (GET)', requireAuth: true });
