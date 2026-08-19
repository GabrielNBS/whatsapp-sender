import { prisma } from '@/lib/db';
import type { CreateReportRecipientCommand, UpdateReportRecipientCommand } from '@/domain/contracts';
import { normalizePhone } from '@/services/contacts/normalizePhone';
import { ConflictError, NotFoundError } from '@/lib/api-errors';
import { DEFAULT_CONFIG_ID } from '@/constants/domain';
import { getWorkspaceScopedId } from '@/server/workspace';

export const ReportRecipientService = {
  /**
   * Lista todos os destinatários de relatórios.
   */
  async listRecipients(workspaceId: string) {
    return prisma.reportRecipient.findMany({
      where: { workspaceId },
    });
  },

  /**
   * Adiciona um novo destinatário à lista de relatórios.
   * Valida duplicidade e normaliza o número de telefone (API-006 / API-009).
   */
  async addRecipient(data: CreateReportRecipientCommand, workspaceId: string) {
    const phone = normalizePhone(data.phone);

    // Valida duplicidade por telefone no banco (API-009)
    const existing = await prisma.reportRecipient.findFirst({
      where: {
        phone,
        workspaceId,
      },
    });

    if (existing) {
      throw new ConflictError('Este número de telefone já está cadastrado como destinatário de relatórios.');
    }

    return prisma.reportRecipient.create({
      data: {
        workspaceId,
        name: data.name.trim(),
        phone,
        configId: getWorkspaceScopedId(workspaceId, DEFAULT_CONFIG_ID),
      },
    });
  },

  /**
   * Remove um destinatário da lista pelo ID (API-009 / API-015).
   */
  async deleteRecipient(id: string, workspaceId: string) {
    try {
      return await prisma.reportRecipient.delete({
        where: { id, workspaceId },
      });
    } catch {
      // P2025 é o erro Prisma para "registro não encontrado"
      throw new NotFoundError('Destinatário de relatórios não encontrado no sistema.');
    }
  },

  async updateRecipient(id: string, data: UpdateReportRecipientCommand, workspaceId: string) {
    const phone = data.phone === undefined ? undefined : normalizePhone(data.phone);
    if (phone !== undefined) {
      const duplicate = await prisma.reportRecipient.findFirst({
        where: { workspaceId, phone, id: { not: id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictError('Este número de telefone já está cadastrado como destinatário de relatórios.');
      }
    }

    try {
      return await prisma.reportRecipient.update({
        where: { id, workspaceId },
        data: {
          name: data.name,
          phone,
          isActive: data.isActive,
        },
      });
    } catch {
      throw new NotFoundError('Destinatário de relatórios não encontrado no sistema.');
    }
  },
};
export default ReportRecipientService;
