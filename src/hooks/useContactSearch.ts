import { useState, useMemo } from 'react';
import { Contact } from '@/lib/types';
import { formatPhoneNumber } from '@/lib/utils';

export function useContactSearch(contacts: Contact[]) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return contacts;
    
    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(term) ||
        contact.number.includes(term) ||
        formatPhoneNumber(contact.number).toLowerCase().includes(term)
      );
    });
  }, [contacts, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredContacts,
  };
}
