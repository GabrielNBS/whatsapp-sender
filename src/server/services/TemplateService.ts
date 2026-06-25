import { prisma } from '@/lib/db';
import { CreateTemplateInput, UpdateTemplateInput } from '../validators/templates';
import { SYSTEM_TEMPLATE_CATEGORY } from '@/constants/domain';

export const TemplateService = {
  /**
   * Lista todos os templates de mensagem, excluindo os do sistema.
   */
  async listTemplates() {
    return prisma.template.findMany({
      where: {
        OR: [
          { category: null },
          { category: { not: SYSTEM_TEMPLATE_CATEGORY } }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Obtém um template específico pelo ID.
   */
  async getTemplateById(id: string) {
    return prisma.template.findUnique({
      where: { id },
    });
  },

  /**
   * Cria um novo template.
   */
  async createTemplate(data: CreateTemplateInput) {
    return prisma.template.create({
      data: {
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
  async updateTemplate(id: string, data: UpdateTemplateInput) {
    return prisma.template.update({
      where: { id },
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
  async deleteTemplate(id: string) {
    return prisma.template.delete({
      where: { id },
    });
  },
};
export default TemplateService;
