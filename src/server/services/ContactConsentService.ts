import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db';
import { normalizePhone } from '@/services/contacts/normalizePhone';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';
import { getWorkspaceScopedId } from '@/server/workspace';
import { ValidationError } from '@/lib/api-errors';
import type { ContactConsentStatus } from '@/lib/types';
import { detectOptOutKeyword } from '@/server/services/ContactConsentRules';

export const CONTACT_CONSENT_STATUSES = ['UNKNOWN', 'OPTED_IN', 'OPTED_OUT'] as const;
export type ConsentAuditSource = 'MANUAL' | 'WHATSAPP' | 'SYSTEM' | 'IMPORT';

export interface IncomingWhatsAppMessage {
  from: string;
  body: string;
  fromMe: boolean;
  messageId?: string;
  contactName?: string | null;
}

export interface ConsentAuditListQuery {
  limit: number;
  offset: number;
  source?: ConsentAuditSource;
  status?: ContactConsentStatus;
  search?: string;
}

export function isOptedOut(status: string | null | undefined): boolean {
  return status === 'OPTED_OUT';
}

export class ContactConsentService {
  constructor(private readonly database: PrismaClient) {}

  async setStatus(
    contactId: string,
    newStatus: ContactConsentStatus,
    options: { source?: ConsentAuditSource; reason?: string; matchedKeyword?: string; messageId?: string },
    workspaceId: string,
  ) {
    const source = options.source ?? 'MANUAL';
    const contact = await this.database.contact.findFirst({
      where: { id: contactId, workspaceId },
      select: { id: true, name: true, phone: true, consentStatus: true },
    });
    if (!contact) throw new Error('Contato não encontrado no workspace atual.');

    if (contact.consentStatus !== newStatus) {
      await this.database.$transaction(async (tx) => {
        await tx.contact.update({
          where: { id: contact.id, workspaceId },
          data: {
            consentStatus: newStatus,
            consentAt: newStatus === 'OPTED_IN' ? new Date() : null,
            optedOutAt: newStatus === 'OPTED_OUT' ? new Date() : null,
          },
        });
        await tx.contactConsentAudit.create({
          data: {
            workspaceId,
            contactId: contact.id,
            contactName: contact.name,
            phone: contact.phone,
            previousStatus: contact.consentStatus,
            newStatus,
            source,
            reason: options.reason,
            matchedKeyword: options.matchedKeyword,
            messageId: options.messageId,
          },
        });
      });
    }

    return this.database.contact.findFirst({
      where: { id: contact.id, workspaceId },
      include: { groupMemberships: { select: { groupId: true } } },
    });
  }

  async captureIncomingOptOut(message: IncomingWhatsAppMessage, workspaceId: string) {
    if (message.fromMe || !message.from.endsWith('@c.us')) return { matched: false, changed: false };

    const matchedKeyword = detectOptOutKeyword(message.body);
    if (!matchedKeyword) return { matched: false, changed: false };

    const phone = normalizePhone(message.from.replace('@c.us', ''));
    if (!phone) return { matched: true, changed: false };

    const existing = await this.database.contact.findFirst({
      where: { workspaceId, phone },
      select: { id: true, consentStatus: true },
    });

    if (existing) {
      const changed = existing.consentStatus !== 'OPTED_OUT';
      await this.setStatus(existing.id, 'OPTED_OUT', {
        source: 'WHATSAPP',
        reason: 'opt_out_received_on_whatsapp',
        matchedKeyword,
        messageId: message.messageId,
      }, workspaceId);
      return { matched: true, changed };
    }

    const contactName = message.contactName?.trim() || 'Contato WhatsApp';
    const contactId = nanoid();
    const optedOutAt = new Date();

    await this.database.$transaction(async (tx) => {
      await tx.workspace.upsert({
        where: { id: workspaceId },
        update: {},
        create: { id: workspaceId, name: 'Local Workspace' },
      });
      await tx.contactGroup.upsert({
        where: { workspaceId_name: { workspaceId, name: 'Geral' } },
        update: {},
        create: {
          id: getWorkspaceScopedId(workspaceId, DEFAULT_GROUP_ID),
          workspaceId,
          name: 'Geral',
          description: 'Lista Padrao',
        },
      });
      await tx.contact.create({
        data: {
          id: contactId,
          workspaceId,
          name: contactName,
          phone,
          consentStatus: 'OPTED_OUT',
          optedOutAt,
          groupMemberships: {
            create: { groupId: getWorkspaceScopedId(workspaceId, DEFAULT_GROUP_ID) },
          },
        },
      });
      await tx.contactConsentAudit.create({
        data: {
          workspaceId,
          contactId,
          contactName,
          phone,
          previousStatus: 'UNKNOWN',
          newStatus: 'OPTED_OUT',
          source: 'WHATSAPP',
          reason: 'opt_out_received_on_whatsapp',
          matchedKeyword,
          messageId: message.messageId,
        },
      });
    });

    return { matched: true, changed: true };
  }

  async findOptedOutRecipients(
    recipients: Array<{ name?: string | null; number?: string | null; phone?: string | null }>,
    workspaceId: string,
  ) {
    const phones = Array.from(new Set(
      recipients
        .map((recipient) => normalizePhone(recipient.number ?? recipient.phone ?? ''))
        .filter(Boolean),
    ));
    if (phones.length === 0) return [];

    const contacts = await this.database.contact.findMany({
      where: { workspaceId, phone: { in: phones }, consentStatus: 'OPTED_OUT' },
      select: { phone: true, name: true },
    });
    const namesByPhone = new Map(contacts.map((contact) => [contact.phone, contact.name]));
    return phones.filter((phone) => namesByPhone.has(phone)).map((phone) => ({
      phone,
      name: namesByPhone.get(phone) || 'Contato',
    }));
  }

  async assertRecipientsCanBeMessaged(
    recipients: Array<{ name?: string | null; number?: string | null; phone?: string | null }>,
    workspaceId: string,
  ) {
    const blocked = await this.findOptedOutRecipients(recipients, workspaceId);
    if (blocked.length > 0) {
      throw new ValidationError(
        `${blocked.length} contato(s) possuem opt-out e foram bloqueados para envio.`,
        { blockedRecipients: blocked },
      );
    }
  }

  async isPhoneOptedOut(phone: string, workspaceId: string) {
    const contact = await this.database.contact.findFirst({
      where: { workspaceId, phone: normalizePhone(phone) },
      select: { consentStatus: true },
    });
    return isOptedOut(contact?.consentStatus);
  }

  async listAudit(query: ConsentAuditListQuery, workspaceId: string) {
    const where = {
      workspaceId,
      ...(query.source ? { source: query.source } : {}),
      ...(query.status ? { newStatus: query.status } : {}),
      ...(query.search ? {
        OR: [
          { contactName: { contains: query.search } },
          { phone: { contains: query.search } },
        ],
      } : {}),
    };

    const [items, total, statusCounts, sourceCounts] = await Promise.all([
      this.database.contactConsentAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.database.contactConsentAudit.count({ where }),
      this.database.contactConsentAudit.groupBy({ by: ['newStatus'], where, _count: { _all: true } }),
      this.database.contactConsentAudit.groupBy({ by: ['source'], where, _count: { _all: true } }),
    ]);

    return {
      items,
      total,
      summary: {
        byStatus: Object.fromEntries(statusCounts.map((item) => [item.newStatus, item._count._all])),
        bySource: Object.fromEntries(sourceCounts.map((item) => [item.source, item._count._all])),
      },
    };
  }
}

let service: ContactConsentService | null = null;
export function getContactConsentService(): ContactConsentService {
  service ??= new ContactConsentService(prisma);
  return service;
}
