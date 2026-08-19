import type { PrismaClient } from '@prisma/client';
import type { WhatsAppGateway } from '@/server/ports/WhatsAppGateway';
import { UnauthorizedError, ValidationError } from '@/lib/api-errors';

export class ReportTestService {
  constructor(
    private readonly database: PrismaClient,
    private readonly whatsapp: WhatsAppGateway,
    private readonly delay: (milliseconds: number) => Promise<void> = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
  ) {}

  private assertDevelopment() {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedError('Acesso negado: este endpoint está disponível apenas em desenvolvimento.');
    }
  }

  listRecipients(workspaceId: string) {
    this.assertDevelopment();
    return this.database.reportRecipient.findMany({
      where: { workspaceId, isActive: true },
      select: { id: true, name: true, phone: true, isActive: true },
    });
  }

  async send(workspaceId: string) {
    this.assertDevelopment();
    const recipients = await this.database.reportRecipient.findMany({
      where: { workspaceId, isActive: true },
    });
    if (recipients.length === 0) {
      throw new ValidationError('Nenhum destinatário ativo cadastrado para receber o teste.');
    }

    const testMessage = [
      '📊 *TESTE DE RELATÓRIO*',
      '━━━━━━━━━━━━━━━━━━━',
      '',
      '✅ Sistema funcionando!',
      '📱 Este é um teste do sistema de relatórios automáticos.',
      '',
      `⏰ Horário: ${new Date().toLocaleString('pt-BR')}`,
      `👤 Destinatários ativos: ${recipients.length}`,
      '',
      '━━━━━━━━━━━━━━━━━━━',
      '_Se você recebeu esta mensagem, o sistema está configurado corretamente._',
    ].join('\n');

    const results = [];
    for (const [index, recipient] of recipients.entries()) {
      try {
        const response = await this.whatsapp.sendMessage(recipient.phone, testMessage);
        results.push({ name: recipient.name, phone: recipient.phone, success: response.success });
      } catch (error) {
        results.push({
          name: recipient.name,
          phone: recipient.phone,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      if (index < recipients.length - 1) await this.delay(1_000);
    }

    const successCount = results.filter((result) => result.success).length;
    return {
      message: `Teste enviado para ${successCount}/${recipients.length} gestores`,
      results,
    };
  }
}
