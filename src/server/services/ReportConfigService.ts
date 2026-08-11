import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { ReportConfigInput } from '../validators/reports';
import { DEFAULT_CONFIG_ID } from '@/constants/domain';
import { getCurrentWorkspaceId, getWorkspaceScopedId } from '@/server/workspace';

export const ReportConfigService = {
  /**
   * Obtém a configuração de relatórios ativa, criando o registro padrão caso não exista.
   */
  async getConfig(workspaceId = getCurrentWorkspaceId()) {
    let config = await prisma.reportConfig.findUnique({
      where: { workspaceId },
      include: { recipients: true },
    });

    if (!config) {
      config = await prisma.reportConfig.create({
        data: {
          id: getWorkspaceScopedId(workspaceId, DEFAULT_CONFIG_ID),
          workspaceId,
          sendImmediate: true,
          sendEngagement: true,
          engagementDelayMins: 240,
        },
        include: { recipients: true },
      });
    }

    return config;
  },

  /**
   * Atualiza as configurações de relatórios restringindo a alteração aos campos permitidos.
   */
  async updateConfig(data: ReportConfigInput, workspaceId = getCurrentWorkspaceId()) {
    // Whitelist explícita de campos (evita mass assignment - API-009)
    const updateData: Prisma.ReportConfigUpdateInput = {};
    if (data.sendImmediate !== undefined) updateData.sendImmediate = data.sendImmediate;
    if (data.sendEngagement !== undefined) updateData.sendEngagement = data.sendEngagement;
    if (data.engagementDelayMins !== undefined && data.engagementDelayMins !== null) {
      updateData.engagementDelayMins = data.engagementDelayMins;
    }
    if (data.engagementTimeFixed !== undefined) updateData.engagementTimeFixed = data.engagementTimeFixed;

    return prisma.reportConfig.update({
      where: { workspaceId },
      data: updateData,
    });
  },
};
export default ReportConfigService;
