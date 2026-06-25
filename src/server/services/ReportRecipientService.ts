import { prisma } from '@/lib/db';
import { CreateRecipientInput } from '../validators/reports';
import { normalizePhone } from '@/services/contacts/normalizePhone';
import { ConflictError, NotFoundError } from '@/lib/api-errors';
import { DEFAULT_CONFIG_ID } from '@/constants/domain';

export const ReportRecipientService = {
  /**
   * Lista todos os destinatários de relatórios.
   */
  async listRecipients() {
    return prisma.reportRecipient.findMany({
      where: { configId: DEFAULT_CONFIG_ID },
    });
  },

  /**
   * Adiciona um novo destinatário à lista de relatórios.
   * Valida duplicidade e normaliza o número de telefone (API-006 / API-009).
   */
  async addRecipient(data: CreateRecipientInput) {
    const phone = normalizePhone(data.phone);

    // Valida duplicidade por telefone no banco (API-009)
    const existing = await prisma.reportRecipient.findFirst({
      where: {
        phone,
        configId: DEFAULT_CONFIG_ID,
      },
    });

    if (existing) {
      throw new ConflictError('Este número de telefone já está cadastrado como destinatário de relatórios.');
    }

    return prisma.reportRecipient.create({
      data: {
        name: data.name.trim(),
        phone,
        configId: DEFAULT_CONFIG_ID,
      },
    });
  },

  /**
   * Remove um destinatário da lista pelo ID (API-009 / API-015).
   */
  async deleteRecipient(id: string) {
    try {
      return await prisma.reportRecipient.delete({
        where: { id },
      });
    } catch (error) {
      // P2025 é o erro Prisma para "registro não encontrado"
      throw new NotFoundError('Destinatário de relatórios não encontrado no sistema.');
    }
  },
};
export default ReportRecipientService;
