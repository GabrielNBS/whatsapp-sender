import { prisma } from '@/lib/db';
import { CreateScheduleInput } from '../validators/schedule';
import { normalizePhone } from '@/services/contacts/normalizePhone';
import { ACTIVE_BATCH_STATUSES, RECENT_BATCH_WINDOW_MS } from '@/constants/domain';
import { nanoid } from 'nanoid';
import { NotFoundError } from '@/lib/api-errors';
import { SchedulerService } from './SchedulerService';

export const ScheduleService = {
  /**
   * Obtém os lotes ativos ou recentemente finalizados agrupados por batchId.
   */
  async listActiveSchedules() {
    const pendingBatches = await prisma.scheduledMessage.findMany({
      where: {
        OR: [
          { status: { in: ACTIVE_BATCH_STATUSES } },
          { scheduledFor: { gte: new Date(Date.now() - RECENT_BATCH_WINDOW_MS) } }
        ]
      },
      select: { batchId: true },
      distinct: ['batchId']
    });

    const activeBatchIds = pendingBatches.map(b => b.batchId).filter(Boolean) as string[];

    if (activeBatchIds.length === 0) {
      return [];
    }

    const messages = await prisma.scheduledMessage.findMany({
      where: {
        batchId: { in: activeBatchIds }
      },
      include: {
        template: true
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    });

    const batches: Record<string, any> = {};

    for (const msg of messages) {
      const batchId = msg.batchId || 'unknown';
      
      if (!batches[batchId]) {
        batches[batchId] = {
          id: batchId,
          batchId: batchId,
          batchName: msg.batchName || 'Sem Nome',
          scheduledFor: msg.scheduledFor,
          count: 0, // Pendente
          processing: 0,
          paused: 0,
          total: 0,
          sent: 0,
          failed: 0,
          contacts: [],
          sampleTemplate: msg.template?.content
        };
      }

      batches[batchId].total++;

      const status = msg.status;
      if (status === 'PENDING') batches[batchId].count++;
      else if (status === 'PROCESSING') batches[batchId].processing++;
      else if (status === 'PAUSED') batches[batchId].paused++;
      else if (status === 'SENT') batches[batchId].sent++;
      else if (status === 'FAILED') batches[batchId].failed++;

      batches[batchId].contacts.push({
        id: msg.id,
        name: msg.contactName,
        phone: msg.contactPhone,
        status: status
      });
    }

    return Object.values(batches);
  },

  /**
   * Cria um novo agendamento em lote.
   */
  async createSchedule(data: CreateScheduleInput) {
    const scheduledDate = new Date(data.scheduledFor);
    let templateId = data.templateId || undefined;

    // Se nenhum templateId for fornecido, cria um template SYSTEM de uso único
    if (!templateId) {
      const template = await prisma.template.create({
        data: {
          title: data.batchName || `Batch ${new Date().toISOString()}`,
          content: data.message || '',
          media: data.media ? JSON.stringify(data.media) : null,
          category: 'SYSTEM'
        }
      });
      templateId = template.id;
    }

    const batchId = nanoid();

    // Cria as ScheduledMessages em uma transação do banco de dados
    await prisma.$transaction(
      data.recipients.map((recipient) => {
        const phone = normalizePhone(recipient.number ?? recipient.phone ?? '');
        return prisma.scheduledMessage.create({
          data: {
            scheduledFor: scheduledDate,
            status: 'PENDING',
            contactName: recipient.name,
            contactPhone: phone,
            templateId: templateId!,
            batchId: batchId,
            batchName: data.batchName
          }
        });
      })
    );

    // Se o agendamento for para agora ou passado imediato, acorda o scheduler
    if (scheduledDate.getTime() <= Date.now()) {
      SchedulerService.wakeUp();
    }

    return {
      success: true,
      batchId,
      count: data.recipients.length
    };
  },

  /**
   * Cancela as mensagens pendentes/pausadas de um lote (CANCELED) sem apagá-las.
   */
  async cancelScheduleBatch(batchId: string) {
    const result = await prisma.scheduledMessage.updateMany({
      where: {
        batchId: batchId,
        status: { in: ['PENDING', 'PAUSED'] }
      },
      data: {
        status: 'CANCELED'
      }
    });

    // Se result.count === 0, significa que não há mensagens pendentes (talvez já tenham sido enviadas ou canceladas).
    // Consideramos sucesso de qualquer forma para que a UI possa refletir o estado finalizado.
    return {
      success: true,
      canceledCount: result.count
    };
  },

  /**
   * Reagenda as mensagens pendentes/pausadas de um lote.
   */
  async rescheduleBatch(batchId: string, newDateStr: string) {
    const rescheduledDate = new Date(newDateStr);

    const result = await prisma.scheduledMessage.updateMany({
      where: {
        batchId: batchId,
        status: { in: ['PENDING', 'PAUSED', 'CANCELED'] } // Permite reativar canceladas também
      },
      data: {
        scheduledFor: rescheduledDate,
        status: 'PENDING'
      }
    });

    if (result.count === 0) {
      throw new NotFoundError('Nenhum agendamento encontrado para reagendar neste lote.');
    }

    if (rescheduledDate.getTime() <= Date.now()) {
      SchedulerService.wakeUp();
    }

    return {
      success: true,
      rescheduledCount: result.count
    };
  }
};
export default ScheduleService;
