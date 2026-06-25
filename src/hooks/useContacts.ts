import { useCallback } from 'react';
import { useAppStore, Contact } from '@/lib/store';
import { validateContact } from '@/services/contacts/validateContact';
import { toast } from 'sonner';

export function useContacts() {
  const { 
    contacts, 
    groups, 
    addContact: storeAddContact, 
    deleteContact: storeDeleteContact, 
    updateContactGroups: storeUpdateContactGroups 
  } = useAppStore();

  const addContact = useCallback((name: string, number: string, groupIds: string[]): boolean => {
    const validation = validateContact(name, number, groupIds, contacts, groups);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Erro ao validar contato');
      return false;
    }

    storeAddContact(name.trim(), number.replace(/\D/g, ''), groupIds);
    toast.success('Contato adicionado com sucesso');
    return true;
  }, [contacts, groups, storeAddContact]);

  const updateContactGroups = useCallback((contactId: string, groupIds: string[]): boolean => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
      toast.error('Contato não encontrado');
      return false;
    }

    const validation = validateContact(contact.name, contact.number, groupIds, contacts, groups, contactId);
    if (!validation.isValid) {
      toast.error(validation.error || 'Erro ao validar contato');
      return false;
    }

    storeUpdateContactGroups(contactId, groupIds);
    toast.success('Contato atualizado com sucesso');
    return true;
  }, [contacts, groups, storeUpdateContactGroups]);

  const deleteContact = useCallback((id: string) => {
    storeDeleteContact(id);
    toast.success('Contato excluído com sucesso');
  }, [storeDeleteContact]);

  return {
    contacts,
    groups,
    addContact,
    updateContactGroups,
    deleteContact,
  };
}
