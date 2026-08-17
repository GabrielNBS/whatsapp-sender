import { prisma } from '@/lib/db';
import { CreateScheduleInput } from '../validators/schedule';
import { normalizePhone } from '@/services/contacts/normalizePhone';
import { ACTIVE_BATCH_STATUSES, RECENT_BATCH_WINDOW_MS } from '@/constants/domain';
import { nanoid } from 'nanoid';
import { NotFoundError } from '@/lib/api-errors';
import { SchedulerService } from './SchedulerService';
import { ScheduledBatch, ScheduledMessageStatus, ScheduleBatchSummary } from '@/lib/types';
import { getCurrentWorkspaceId } from '@/server/workspace';

export const ScheduleService = {
  /**
   * Obtém os lotes ativos ou recentemente finalizados agrupados por batchId.
   */
  async listActiveSchedules(workspaceId = getCurrentWorkspaceId()) {
    const pendingBatches = await prisma.scheduledMessage.groupBy({
      by: ['batchId'],
      where: {
        workspaceId,
        OR: [
          { status: { in: ACTIVE_BATCH_STATUSES } },
          { scheduledFor: { gte: new Date(Date.now() - RECENT_BATCH_WINDOW_MS) } }
        ]
      },
    });

    const activeBatchIds = pendingBatches.map(b => b.batchId).filter(Boolean) as string[];

    if (activeBatchIds.length === 0) {
      return [];
    }

    const batchStatusCounts = await prisma.scheduledMessage.groupBy({
      by: ['batchId', 'batchName', 'status'],
      where: {
        workspaceId,
        batchId: { in: activeBatchIds }
      },
      _count: { _all: true },
      _min: { scheduledFor: true },
    });

    const batches: Record<string, ScheduleBatchSummary> = {};

    for (const row of batchStatusCounts) {
      const batchId = row.batchId || 'unknown';
      
      if (!batches[batchId]) {
        batches[batchId] = {
          id: batchId,
          batchId: batchId,
          batchName: row.batchName || 'Sem Nome',
          scheduledFor: row._min.scheduledFor || new Date(),
          count: 0, // Pendente
          processing: 0,
          paused: 0,
          total: 0,
          sent: 0,
          failed: 0,
        };
      }

      const batch = batches[batchId]!;
      const count = row._count._all;
      batch.total += count;
      if (row.status === 'PENDING') batch.count += count;
      else if (row.status === 'PROCESSING') batch.processing += count;
      else if (row.status === 'PAUSED') batch.paused = (batch.paused ?? 0) + count;
      else if (row.status === 'SENT') batch.sent += count;
      else if (row.status === 'FAILED') batch.failed += count;
    }

    return Object.values(batches).sort(
      (first, second) => new Date(first.scheduledFor).getTime() - new Date(second.scheduledFor).getTime(),
    );
  },

  async getScheduleBatchDetails(batchId: string, workspaceId = getCurrentWorkspaceId()): Promise<ScheduledBatch> {
    const messages = await prisma.scheduledMessage.findMany({
      where: { workspaceId, batchId },
      include: { template: { select: { content: true } } },
      orderBy: { scheduledFor: 'asc' },
    });

    if (messages.length === 0) throw new NotFoundError('Agendamento não encontrado neste workspace.');

    const summary = await this.listActiveSchedules(workspaceId);
    const batch = summary.find((item) => item.batchId === batchId);
    if (!batch) {
      const statuses = messages.reduce<Record<string, number>>((acc, message) => {
        acc[message.status] = (acc[message.status] ?? 0) + 1;
        return acc;
      }, {});
      return {
        id: batchId,
        batchId,
        batchName: messages[0].batchName || 'Sem Nome',
        scheduledFor: messages[0].scheduledFor,
        count: statuses.PENDING ?? 0,
        processing: statuses.PROCESSING ?? 0,
        paused: statuses.PAUSED ?? 0,
        total: messages.length,
        sent: statuses.SENT ?? 0,
        failed: statuses.FAILED ?? 0,
        contacts: messages.map((message) => ({ id: message.id, name: message.contactName, phone: message.contactPhone, status: message.status as ScheduledMessageStatus })),
        sampleTemplate: messages[0].template.content,
      };
    }

    return {
      ...batch,
      contacts: messages.map((message) => ({ id: message.id, name: message.contactName, phone: message.contactPhone, status: message.status as ScheduledMessageStatus })),
      sampleTemplate: messages[0].template.content,
    };
  },

  /**
   * Cria um novo agendamento em lote.
   */
  async createSchedule(data: CreateScheduleInput, workspaceId = getCurrentWorkspaceId()) {
    const scheduledDate = new Date(data.scheduledFor);
    const batchId = nanoid();

    await prisma.$transaction(async (tx) => {
      let templateId = data.templateId || undefined;
      if (templateId) {
        const templateExists = await tx.template.findFirst({
          where: { id: templateId, workspaceId },
          select: { id: true },
        });
        if (!templateExists) throw new NotFoundError('Template não encontrado neste workspace.');
      } else {
        const template = await tx.template.create({
          data: {
            title: data.batchName || `Batch ${new Date().toISOString()}`,
            workspaceId,
            content: data.message || '',
            media: data.media ? JSON.stringify(data.media) : null,
            category: 'SYSTEM',
          },
        });
        templateId = template.id;
      }

      await tx.campaign.create({
        data: {
          id: batchId,
          workspaceId,
          name: data.batchName || `Campanha Agendada (${data.recipients.length} contatos)`,
          startedAt: scheduledDate,
          totalContacts: data.recipients.length,
          sentCount: 0,
          failedCount: 0,
        },
      });

      await tx.scheduledMessage.createMany({
        data: data.recipients.map((recipient, index) => ({
          // Millisecond offsets preserve recipient order when the scheduler
          // claims messages with the same requested delivery time.
          scheduledFor: new Date(scheduledDate.getTime() + index),
          workspaceId,
          status: 'PENDING',
          contactName: recipient.name,
          contactPhone: normalizePhone(recipient.number ?? recipient.phone ?? ''),
          templateId: templateId!,
          batchId,
          batchName: data.batchName,
        })),
      });
    });

    // Garante que o scheduler worker esteja em execução
    SchedulerService.wakeUp();

    return {
      success: true,
      batchId,
      count: data.recipients.length
    };
  },

  /**
   * Cancela as mensagens pendentes/pausadas de um lote (CANCELED) sem apagá-las.
   */
  async cancelScheduleBatch(batchId: string, workspaceId = getCurrentWorkspaceId()) {
    const result = await prisma.scheduledMessage.updateMany({
      where: {
        batchId: batchId,
        workspaceId,
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
  async rescheduleBatch(batchId: string, newDateStr: string, workspaceId = getCurrentWorkspaceId()) {
    const rescheduledDate = new Date(newDateStr);

    const result = await prisma.scheduledMessage.updateMany({
      where: {
        batchId: batchId,
        workspaceId,
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

    SchedulerService.wakeUp();

    return {
      success: true,
      rescheduledCount: result.count
    };
  }
};
export default ScheduleService;
