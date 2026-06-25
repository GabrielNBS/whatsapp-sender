import { prisma } from '@/lib/db';
import { ReportConfigInput } from '../validators/reports';
import { DEFAULT_CONFIG_ID } from '@/constants/domain';

export const ReportConfigService = {
  /**
   * Obtém a configuração de relatórios ativa, criando o registro padrão caso não exista.
   */
  async getConfig() {
    let config = await prisma.reportConfig.findUnique({
      where: { id: DEFAULT_CONFIG_ID },
      include: { recipients: true },
    });

    if (!config) {
      config = await prisma.reportConfig.create({
        data: {
          id: DEFAULT_CONFIG_ID,
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
  async updateConfig(data: ReportConfigInput) {
    // Whitelist explícita de campos (evita mass assignment - API-009)
    const updateData: any = {};
    if (data.sendImmediate !== undefined) updateData.sendImmediate = data.sendImmediate;
    if (data.sendEngagement !== undefined) updateData.sendEngagement = data.sendEngagement;
    if (data.engagementDelayMins !== undefined) updateData.engagementDelayMins = data.engagementDelayMins;
    if (data.engagementTimeFixed !== undefined) updateData.engagementTimeFixed = data.engagementTimeFixed;

    return prisma.reportConfig.update({
      where: { id: DEFAULT_CONFIG_ID },
      data: updateData,
    });
  },
};
export default ReportConfigService;
