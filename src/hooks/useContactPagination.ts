import { useState, useMemo, useCallback } from 'react';
import { Contact } from '@/lib/types';
import { CONTACTS_PER_PAGE } from '@/constants/contacts';

export function useContactPagination(filteredContacts: Contact[]) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE) || 1;
  }, [filteredContacts.length]);

  const visiblePage = Math.min(currentPage, totalPages);

  const startIndex = useMemo(() => {
    return (visiblePage - 1) * CONTACTS_PER_PAGE;
  }, [visiblePage]);

  const setVisiblePage = useCallback((page: number | ((current: number) => number)) => {
    setCurrentPage((current) => {
      const nextPage = typeof page === 'function' ? page(Math.min(current, totalPages)) : page;
      return Math.max(1, Math.min(nextPage, totalPages));
    });
  }, [totalPages]);

  const endIndex = useMemo(() => {
    return startIndex + CONTACTS_PER_PAGE;
  }, [startIndex]);

  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice(startIndex, endIndex);
  }, [filteredContacts, startIndex, endIndex]);

  return {
    currentPage: visiblePage,
    setCurrentPage: setVisiblePage,
    totalPages,
    paginatedContacts,
    startIndex,
    endIndex,
  };
}
