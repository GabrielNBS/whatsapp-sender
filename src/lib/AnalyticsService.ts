import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";
import { getRequestId } from "./CorrelationId";

export interface IAnalyticsService {
  trackMessageSent(phone: string): Promise<void>;
  trackMessageRead(phone: string): Promise<void>;
  trackBatchRead(phones: string[]): Promise<void>;
}

export class AnalyticsService implements IAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  // 🔧 Cria um logger filho com contexto fixo — requestId + método
  private getLogger(method: string) {
    return logger.child({
      requestId: getRequestId(), // 🔗 ID de correlação
      method,
    });
  }

  async trackMessageSent(phone: string): Promise<void> {
    const log = this.getLogger("trackMessageSent");
    const start = performance.now(); // ⏱️ início da medição

    try {
      await this.prisma.contactAnalytics.upsert({
        where: { phone },
        create: {
          phone,
          sentCount: 1,
          lastSentAt: new Date(),
        },
        update: {
          sentCount: { increment: 1 },
          lastSentAt: new Date(),
        },
      });

      log.info({
        phone,
        durationMs: (performance.now() - start).toFixed(2), // ⏱️ duração
      }, "Tracked sent message");

    } catch (error: unknown) { // 🔍 tipagem correta
      log.error({
        phone,
        durationMs: (performance.now() - start).toFixed(2),
        err: error, // Pino serializa stack trace automaticamente com a chave "err"
      }, "Failed to track sent message");
    }
  }

  async trackMessageRead(phone: string): Promise<void> {
    const log = this.getLogger("trackMessageRead");
    const start = performance.now();

    try {
      const result = await this.prisma.contactAnalytics.updateMany({
        where: { phone },
        data: {
          readCount: { increment: 1 },
          lastReadAt: new Date(),
        },
      });

      if (result.count > 0) {
        log.info({
          phone,
          durationMs: (performance.now() - start).toFixed(2),
        }, "Tracked read message");
      } else {
        log.warn({ phone }, "No record found, skipping read count"); // 🎚️ warn aqui faz sentido
      }

    } catch (error: unknown) {
      log.error({
        phone,
        durationMs: (performance.now() - start).toFixed(2),
        err: error,
      }, "Failed to track read message");
    }
  }

  async trackBatchRead(phones: string[]): Promise<void> {
    if (phones.length === 0) return;
    if (phones.length === 1) return this.trackMessageRead(phones[0]);

    const log = this.getLogger("trackBatchRead");
    const start = performance.now();

    try {
      const operations = phones.map((phone) =>
        this.prisma.contactAnalytics.updateMany({
          where: { phone },
          data: {
            readCount: { increment: 1 },
            lastReadAt: new Date(),
          },
        })
      );

      const results = await this.prisma.$transaction(operations);
      const updated = results.reduce((sum, r) => sum + r.count, 0);

      log.info({
        total: phones.length,
        updated,
        durationMs: (performance.now() - start).toFixed(2),
      }, "Batch tracked read messages");

    } catch (error: unknown) {
      log.error({
        total: phones.length,
        durationMs: (performance.now() - start).toFixed(2),
        err: error,
      }, "Batch failed, falling back to individual");

      for (const phone of phones) {
        await this.trackMessageRead(phone);
      }
    }
  }
}