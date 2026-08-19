import { requestJson } from '@/services/http/client';
import type { ContactConsentStatus } from '@/lib/types';

export type ConsentAuditSource = 'MANUAL' | 'WHATSAPP' | 'SYSTEM' | 'IMPORT';

export interface ConsentAuditItem {
  id: string;
  contactId: string | null;
  contactName: string;
  phone: string;
  previousStatus: ContactConsentStatus;
  newStatus: ContactConsentStatus;
  source: ConsentAuditSource;
  reason: string | null;
  matchedKeyword: string | null;
  messageId: string | null;
  createdAt: string;
}

export interface ConsentAuditSnapshot {
  items: ConsentAuditItem[];
  total: number;
  summary: {
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  };
}

export interface ConsentAuditFilters {
  limit?: number;
  offset?: number;
  source?: ConsentAuditSource;
  status?: ContactConsentStatus;
  search?: string;
}

export function getConsentAudit(filters: ConsentAuditFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return requestJson<ConsentAuditSnapshot>(`/api/contacts/consent-audit?${params.toString()}`);
}
