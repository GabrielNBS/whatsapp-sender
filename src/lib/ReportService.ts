/**
 * ReportService
 * 
 * Responsible for formatting and sending campaign reports via WhatsApp.
 * Follows SRP: handles only report generation and delivery.
 */

import { PrismaClient, Campaign, ReportRecipient, ReportConfig } from '@prisma/client';
import { getWhatsAppInstance } from './whatsapp';

// ============================================
// INTERFACES
// ============================================

export interface IReportService {
  formatImmediateReport(campaign: Campaign): string;
  formatEngagementReport(campaign: Campaign): string;
  getImmediateChartUrl(campaign: Campaign): string;
  getEngagementChartUrl(campaign: Campaign): string;
  sendReportToAllRecipients(message: string, chartUrl?: string): Promise<SendReportResult>;
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

// ============================================
// REPORT FORMATTERS
// ============================================

function formatDuration(startedAt: Date, completedAt: Date | null): string {
  if (!completedAt) return 'Em andamento';
  
  const diffMs = completedAt.getTime() - startedAt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  
  if (diffMins > 0) {
    return `${diffMins}min ${diffSecs}s`;
  }
  return `${diffSecs}s`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function calculateSpeed(totalSent: number, startedAt: Date, completedAt: Date | null): string {
  if (!completedAt || totalSent === 0) return '0';
  
  const diffMins = (completedAt.getTime() - startedAt.getTime()) / 60000;
  if (diffMins < 1) return `${totalSent}`;
  
  return (totalSent / diffMins).toFixed(1);
}

// ============================================
// IMPLEMENTATION
// ============================================

export class ReportService implements IReportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Format immediate report (sent right after campaign completion)
   */
  formatImmediateReport(campaign: Campaign): string {
    const successRate = campaign.totalContacts > 0 
      ? ((campaign.sentCount / campaign.totalContacts) * 100).toFixed(0)
      : '0';
    
    const speed = calculateSpeed(
      campaign.sentCount, 
      campaign.startedAt, 
      campaign.completedAt
    );
    
    const duration = formatDuration(campaign.startedAt, campaign.completedAt);
    
    const report = `
📊 *RELATÓRIO DE CAMPANHA*
━━━━━━━━━━━━━━━━━━━

📝 *${campaign.name}*
${campaign.templateName ? `📋 Template: ${campaign.templateName}` : ''}

⏱️ *Tempo de Execução*
• Início: ${formatTime(campaign.startedAt)}
• Fim: ${campaign.completedAt ? formatTime(campaign.completedAt) : 'N/A'}
• Duração: ${duration}

📈 *Métricas de Envio*
• Total de contatos: ${campaign.totalContacts}
• Enviados: ${campaign.sentCount} ✅
• Falhas: ${campaign.failedCount} ❌
• Taxa de sucesso: ${successRate}%
• Velocidade: ${speed} msgs/min

━━━━━━━━━━━━━━━━━━━
_Relatório gerado automaticamente_
`.trim();

    return report;
  }

  /**
   * Format engagement report (sent after delay)
   */
  formatEngagementReport(campaign: Campaign): string {
    const readRate = campaign.sentCount > 0 
      ? ((campaign.readCount / campaign.sentCount) * 100).toFixed(0)
      : '0';
    
    const responseRate = campaign.sentCount > 0 
      ? ((campaign.responseCount / campaign.sentCount) * 100).toFixed(0)
      : '0';
    
    const report = `
📈 *RELATÓRIO DE ENGAJAMENTO*
━━━━━━━━━━━━━━━━━━━

📝 *${campaign.name}*
📅 Enviado em: ${campaign.startedAt.toLocaleDateString('pt-BR')}

👁️ *Leituras*
• Lidos: ${campaign.readCount} de ${campaign.sentCount}
• Taxa de abertura: ${readRate}%

💬 *Respostas*
• Total: ${campaign.responseCount}
• Taxa de resposta: ${responseRate}%

${parseInt(readRate) >= 70 ? '🎉 *Excelente engajamento!*' : 
  parseInt(readRate) >= 40 ? '👍 *Bom engajamento*' : 
  '⚠️ *Engajamento abaixo do esperado*'}

━━━━━━━━━━━━━━━━━━━
_Relatório gerado automaticamente_
`.trim();

    return report;
  }

  /**
   * Helper param builder for QuickChart.io visual charts
   */
  getImmediateChartUrl(campaign: Campaign): string {
    const config = {
      type: 'doughnut',
      data: {
        labels: ['Enviados', 'Falhas'],
        datasets: [{
          data: [campaign.sentCount, campaign.failedCount],
          backgroundColor: ['#10b981', '#ef4444']
        }]
      },
      options: { 
        plugins: { 
          doughnutlabel: { labels: [{ text: campaign.sentCount.toString(), font: { size: 20 } }, { text: 'Enviados' }]} 
        } 
      }
    };
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=400&h=400`;
  }

  getEngagementChartUrl(campaign: Campaign): string {
    const config = {
      type: 'bar',
      data: {
        labels: ['Enviados', 'Lidos', 'Respostas'],
        datasets: [{
          label: 'Conversão',
          data: [campaign.sentCount, campaign.readCount, campaign.responseCount],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
        }]
      },
      options: {
        legend: { display: false },
        title: { display: true, text: 'Funil de Engajamento' }
      }
    };
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=500&h=300`;
  }

  /**
   * Get report configuration with recipients
   */
  async getConfig(): Promise<ReportConfigWithRecipients | null> {
    return this.prisma.reportConfig.findUnique({
      where: { id: 'default' },
      include: { recipients: true },
    });
  }

  /**
   * Get active recipients only
   */
  async getActiveRecipients(): Promise<ReportRecipient[]> {
    return this.prisma.reportRecipient.findMany({
      where: { isActive: true },
    });
  }

  /**
   * Send report message to all active recipients
   */
  async sendReportToAllRecipients(message: string, chartUrl?: string): Promise<SendReportResult> {
    const recipients = await this.getActiveRecipients();
    
    if (recipients.length === 0) {
      console.log('[ReportService] No active recipients configured');
      return { success: false, sentTo: [], failed: [] };
    }

    const sentTo: string[] = [];
    const failed: string[] = [];

    for (const recipient of recipients) {
      try {
        console.log(`[ReportService] Sending report to ${recipient.name} (${recipient.phone})`);
        
        let mediaData;
        if (chartUrl) {
          try {
            const chartRes = await fetch(chartUrl);
            if (chartRes.ok) {
              const arrayBuffer = await chartRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              mediaData = {
                mimetype: 'image/png',
                data: buffer.toString('base64'),
                filename: 'report-chart.png'
              };
            }
          } catch (e) {
            console.error('[ReportService] Error fetching chart image:', e);
          }
        }

        const whatsapp = getWhatsAppInstance();
        
        if (!whatsapp || !whatsapp.getStatus().isAuthenticated) {
          console.error('[ReportService] WhatsApp not connected, cannot send report');
          failed.push(recipient.phone);
          continue;
        }

        await whatsapp.sendMessage(recipient.phone, message, mediaData);
        sentTo.push(recipient.phone);
        console.log(`[ReportService] ✅ Report sent to ${recipient.name}`);

        // Small delay between sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`[ReportService] Error sending to ${recipient.name}:`, error);
        failed.push(recipient.phone);
      }
    }

    return {
      success: failed.length === 0,
      sentTo,
      failed,
    };
  }

  /**
   * Ensure default config exists
   */
  async ensureDefaultConfig(): Promise<ReportConfig> {
    const existing = await this.prisma.reportConfig.findUnique({
      where: { id: 'default' },
    });

    if (existing) return existing;

    return this.prisma.reportConfig.create({
      data: { id: 'default' },
    });
  }
}

// ============================================
// SINGLETON FACTORY
// ============================================

import { prisma } from './db';

let reportServiceInstance: ReportService | null = null;

export function getReportService(): ReportService {
  if (!reportServiceInstance) {
    reportServiceInstance = new ReportService(prisma);
  }
  return reportServiceInstance;
}

export default getReportService;
