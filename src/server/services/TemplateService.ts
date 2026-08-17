import { prisma } from '@/lib/db';
import { CreateTemplateInput, UpdateTemplateInput } from '../validators/templates';
import { SYSTEM_TEMPLATE_CATEGORY } from '@/constants/domain';
import { getCurrentWorkspaceId } from '@/server/workspace';

export const TemplateService = {
  /**
   * Lista todos os templates de mensagem, excluindo os do sistema.
   */
  async listTemplates(workspaceId = getCurrentWorkspaceId()) {
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

  async listTemplateSummaries(workspaceId = getCurrentWorkspaceId()) {
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
  async getTemplateById(id: string, workspaceId = getCurrentWorkspaceId()) {
    return prisma.template.findFirst({
      where: { id, workspaceId },
    });
  },

  /**
   * Cria um novo template.
   */
  async createTemplate(data: CreateTemplateInput, workspaceId = getCurrentWorkspaceId()) {
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
  async updateTemplate(id: string, data: UpdateTemplateInput, workspaceId = getCurrentWorkspaceId()) {
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
  async deleteTemplate(id: string, workspaceId = getCurrentWorkspaceId()) {
    return prisma.template.delete({
      where: { id, workspaceId },
    });
  },
};
export default TemplateService;
