import { prisma } from '@/lib/db';
import type { CreateTemplateCommand, UpdateTemplateCommand } from '@/domain/contracts';
import { SYSTEM_TEMPLATE_CATEGORY } from '@/constants/domain';

export const TemplateService = {
  /**
   * Lista todos os templates de mensagem, excluindo os do sistema.
   */
  async listTemplates(workspaceId: string) {
    return prisma.template.findMany({
      where: {
        workspaceId,
        OR: [
          { category: null },
          { category: { not: SYSTEM_TEMPLATE_CATEGORY } }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listTemplateSummaries(workspaceId: string) {
    return prisma.template.findMany({
      where: {
        workspaceId,
        OR: [
          { category: null },
          { category: { not: SYSTEM_TEMPLATE_CATEGORY } },
        ],
      },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Obtém um template específico pelo ID.
   */
  async getTemplateById(id: string, workspaceId: string) {
    return prisma.template.findFirst({
      where: { id, workspaceId },
    });
  },

  /**
   * Cria um novo template.
   */
  async createTemplate(data: CreateTemplateCommand, workspaceId: string) {
    return prisma.template.create({
      data: {
        workspaceId,
        title: data.title,
        content: data.content,
        category: data.category || null,
        media: data.media ? JSON.stringify(data.media) : null,
      },
    });
  },

  /**
   * Atualiza um template existente.
   */
  async updateTemplate(id: string, data: UpdateTemplateCommand, workspaceId: string) {
    return prisma.template.update({
      where: { id, workspaceId },
      data: {
        title: data.title,
        content: data.content,
        category: data.category !== undefined ? data.category : undefined,
        media: data.media ? JSON.stringify(data.media) : data.media === null ? null : undefined,
      },
    });
  },

  /**
   * Exclui um template.
   */
  async deleteTemplate(id: string, workspaceId: string) {
    return prisma.template.delete({
      where: { id, workspaceId },
    });
  },
};
export default TemplateService;
