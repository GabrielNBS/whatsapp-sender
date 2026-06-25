import { useState, useMemo, useEffect } from 'react';
import { Contact } from '@/lib/types';
import { CONTACTS_PER_PAGE } from '@/constants/contacts';

export function useContactPagination(filteredContacts: Contact[]) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE) || 1;
  }, [filteredContacts.length]);

  // Sincroniza a página atual caso os contatos sejam excluídos e a página fique inválida
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = useMemo(() => {
    return (currentPage - 1) * CONTACTS_PER_PAGE;
  }, [currentPage]);

  const endIndex = useMemo(() => {
    return startIndex + CONTACTS_PER_PAGE;
  }, [startIndex]);

  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice(startIndex, endIndex);
  }, [filteredContacts, startIndex, endIndex]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedContacts,
    startIndex,
    endIndex,
  };
}
