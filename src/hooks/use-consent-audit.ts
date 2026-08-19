'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getConsentAudit, type ConsentAuditFilters, type ConsentAuditSnapshot } from '@/services/contacts/consentAuditApi';

const DEFAULT_SNAPSHOT: ConsentAuditSnapshot = {
  items: [],
  total: 0,
  summary: { byStatus: {}, bySource: {} },
};

export function useConsentAudit() {
  const [snapshot, setSnapshot] = useState<ConsentAuditSnapshot>(DEFAULT_SNAPSHOT);
  const initialFilters = { limit: 30, offset: 0 } satisfies ConsentAuditFilters;
  const filtersRef = useRef<ConsentAuditFilters>(initialFilters);
  const [filters, setFilters] = useState<ConsentAuditFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (nextFilters: ConsentAuditFilters = filtersRef.current) => {
    setIsLoading(true);
    setError(null);
    try {
      const nextSnapshot = await getConsentAudit(nextFilters);
      setSnapshot(nextSnapshot);
      filtersRef.current = nextFilters;
      setFilters(nextFilters);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a auditoria.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { snapshot, filters, isLoading, error, refresh };
}
