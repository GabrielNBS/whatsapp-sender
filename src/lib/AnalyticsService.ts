import { PrismaClient } from "@prisma/client";
import { logger, maskPhone } from "@/lib/logger";
import { getRequestId } from "./CorrelationId";

export interface IAnalyticsService {
  trackMessageSent(phone: string): Promise<void>;
  trackMessageRead(phone: string): Promise<void>;
  trackBatchRead(phones: string[]): Promise<void>;
}

export class AnalyticsService implements IAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  private getLogger(method: string) {
    return logger.child({
      requestId: getRequestId(),
      method,
    });
  }

  async trackMessageSent(phone: string): Promise<void> {
    const log = this.getLogger("trackMessageSent");
    const start = performance.now();
    const maskedPhone = maskPhone(phone);

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
        phone: maskedPhone,
        durationMs: (performance.now() - start).toFixed(2),
      }, "Tracked sent message");
    } catch (error: unknown) {
      log.error({
        phone: maskedPhone,
        durationMs: (performance.now() - start).toFixed(2),
        err: error,
      }, "Failed to track sent message");
    }
  }

  async trackMessageRead(phone: string): Promise<void> {
    const log = this.getLogger("trackMessageRead");
    const start = performance.now();
    const maskedPhone = maskPhone(phone);

    try {
      await this.prisma.contactAnalytics.upsert({
        where: { phone },
        create: {
          phone,
          sentCount: 0,
          readCount: 1,
          lastReadAt: new Date(),
        },
        update: {
          readCount: { increment: 1 },
          lastReadAt: new Date(),
        },
      });

      log.info({
        phone: maskedPhone,
        durationMs: (performance.now() - start).toFixed(2),
      }, "Tracked read message");
    } catch (error: unknown) {
      log.error({
        phone: maskedPhone,
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
        this.prisma.contactAnalytics.upsert({
          where: { phone },
          create: {
            phone,
            sentCount: 0,
            readCount: 1,
            lastReadAt: new Date(),
          },
          update: {
            readCount: { increment: 1 },
            lastReadAt: new Date(),
          },
        })
      );

      await this.prisma.$transaction(operations);

      log.info({
        total: phones.length,
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
