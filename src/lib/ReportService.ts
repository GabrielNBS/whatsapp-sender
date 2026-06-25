import { PrismaClient, Campaign, ReportRecipient, ReportConfig } from "@prisma/client";
import { IMessageSender } from "./types";

export interface IReportService {
  formatImmediateReport(campaign: Campaign): string;
  formatEngagementReport(campaign: Campaign): string;
  getImmediateChartUrl(campaign: Campaign): string;
  getEngagementChartUrl(campaign: Campaign): string;
  sendReportToAllRecipients(sender: IMessageSender, message: string, chartUrl?: string): Promise<SendReportResult>;
  getConfig(): Promise<ReportConfigWithRecipients | null>;
  getActiveRecipients(): Promise<ReportRecipient[]>;
}

export interface ReportConfigWithRecipients extends ReportConfig {
  recipients: ReportRecipient[];
}

export interface SendReportResult {
  success: boolean;
  sentTo: string[];
  failed: string[];
}

function formatDuration(startedAt: Date, completedAt: Date | null): string {
  if (!completedAt) return "Em andamento";
  const diffMs = completedAt.getTime() - startedAt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  return diffMins > 0 ? `${diffMins}min ${diffSecs}s` : `${diffSecs}s`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function calculateSpeed(totalSent: number, startedAt: Date, completedAt: Date | null): string {
  if (!completedAt || totalSent === 0) return "0";
  const diffMins = (completedAt.getTime() - startedAt.getTime()) / 60000;
  if (diffMins < 1) return `${totalSent}`;
  return (totalSent / diffMins).toFixed(1);
}

export class ReportService implements IReportService {
  private static readonly REPORT_SEND_CONCURRENCY = 2;
  private static readonly CHART_FETCH_TIMEOUT_MS = 5000;
  private readonly debugEnabled = process.env.LOG_LEVEL === "debug";

  constructor(private prisma: PrismaClient) {}

  formatImmediateReport(campaign: Campaign): string {
    const successRate = campaign.totalContacts > 0
      ? ((campaign.sentCount / campaign.totalContacts) * 100).toFixed(0)
      : "0";
    const speed = calculateSpeed(campaign.sentCount, campaign.startedAt, campaign.completedAt);
    const duration = formatDuration(campaign.startedAt, campaign.completedAt);

    return `
RELATORIO DE CAMPANHA
-------------------

${campaign.name}
${campaign.templateName ? `Template: ${campaign.templateName}` : ""}

Tempo de Execucao
- Inicio: ${formatTime(campaign.startedAt)}
- Fim: ${campaign.completedAt ? formatTime(campaign.completedAt) : "N/A"}
- Duracao: ${duration}

Metricas de Envio
- Total de contatos: ${campaign.totalContacts}
- Enviados: ${campaign.sentCount}
- Falhas: ${campaign.failedCount}
- Taxa de sucesso: ${successRate}%
- Velocidade: ${speed} msgs/min

-------------------
Relatorio gerado automaticamente
`.trim();
  }

  formatEngagementReport(campaign: Campaign): string {
    const readRate = campaign.sentCount > 0 ? ((campaign.readCount / campaign.sentCount) * 100).toFixed(0) : "0";
    const responseRate = campaign.sentCount > 0 ? ((campaign.responseCount / campaign.sentCount) * 100).toFixed(0) : "0";
    const scoreMessage = parseInt(readRate, 10) >= 70
      ? "Excelente engajamento!"
      : parseInt(readRate, 10) >= 40
        ? "Bom engajamento"
        : "Engajamento abaixo do esperado";

    return `
RELATORIO DE ENGAJAMENTO
-------------------

${campaign.name}
Enviado em: ${campaign.startedAt.toLocaleDateString("pt-BR")}

Leituras
- Lidos: ${campaign.readCount} de ${campaign.sentCount}
- Taxa de abertura: ${readRate}%

Respostas
- Total: ${campaign.responseCount}
- Taxa de resposta: ${responseRate}%

${scoreMessage}

-------------------
Relatorio gerado automaticamente
`.trim();
  }

  getImmediateChartUrl(campaign: Campaign): string {
    const config = {
      type: "doughnut",
      data: {
        labels: ["Enviados", "Falhas"],
        datasets: [{
          data: [campaign.sentCount, campaign.failedCount],
          backgroundColor: ["#10b981", "#ef4444"],
        }],
      },
      options: {
        plugins: {
          doughnutlabel: { labels: [{ text: campaign.sentCount.toString(), font: { size: 20 } }, { text: "Enviados" }] },
        },
      },
    };
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=400&h=400`;
  }

  getEngagementChartUrl(campaign: Campaign): string {
    const config = {
      type: "bar",
      data: {
        labels: ["Enviados", "Lidos", "Respostas"],
        datasets: [{
          label: "Conversao",
          data: [campaign.sentCount, campaign.readCount, campaign.responseCount],
          backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
        }],
      },
      options: {
        legend: { display: false },
        title: { display: true, text: "Funil de Engajamento" },
      },
    };
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=500&h=300`;
  }

  async getConfig(): Promise<ReportConfigWithRecipients | null> {
    return this.prisma.reportConfig.findUnique({
      where: { id: "default" },
      include: { recipients: true },
    });
  }

  async getActiveRecipients(): Promise<ReportRecipient[]> {
    return this.prisma.reportRecipient.findMany({
      where: { isActive: true },
    });
  }

  async sendReportToAllRecipients(sender: IMessageSender, message: string, chartUrl?: string): Promise<SendReportResult> {
    const recipients = await this.getActiveRecipients();

    if (recipients.length === 0) {
      console.log("[ReportService] No active recipients configured");
      return { success: false, sentTo: [], failed: [] };
    }

    let mediaData: { mimetype: string; data: string; filename?: string } | undefined;
    if (chartUrl) {
      try {
        const chartRes = await fetch(chartUrl, { signal: AbortSignal.timeout(ReportService.CHART_FETCH_TIMEOUT_MS) });
        if (chartRes.ok) {
          const arrayBuffer = await chartRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          mediaData = {
            mimetype: "image/png",
            data: buffer.toString("base64"),
            filename: "report-chart.png",
          };
        } else {
          console.error("[ReportService] Chart request failed with status:", chartRes.status);
        }
      } catch (error) {
        console.error("[ReportService] Error fetching chart image:", error);
      }
    }

    const sentTo: string[] = [];
    const failed: string[] = [];
    const queue = [...recipients];

    const workers = Array.from(
      { length: Math.min(ReportService.REPORT_SEND_CONCURRENCY, queue.length) },
      async () => {
        while (queue.length > 0) {
          const recipient = queue.shift();
          if (!recipient) {
            break;
          }

          try {
            if (this.debugEnabled) {
              console.log(`[ReportService] Sending report to ${recipient.name} (${recipient.phone})`);
            }
            await sender.sendMessage(recipient.phone, message, mediaData);
            sentTo.push(recipient.phone);
          } catch (error) {
            console.error(`[ReportService] Error sending to ${recipient.name}:`, error);
            failed.push(recipient.phone);
          }
        }
      }
    );

    await Promise.all(workers);

    return {
      success: failed.length === 0,
      sentTo,
      failed,
    };
  }

  async ensureDefaultConfig(): Promise<ReportConfig> {
    const existing = await this.prisma.reportConfig.findUnique({
      where: { id: "default" },
    });

    if (existing) return existing;

    return this.prisma.reportConfig.create({
      data: { id: "default" },
    });
  }
}

import { prisma } from "./db";

let reportServiceInstance: ReportService | null = null;

export function getReportService(): ReportService {
  if (!reportServiceInstance) {
    reportServiceInstance = new ReportService(prisma);
  }
  return reportServiceInstance;
}

export default getReportService;
