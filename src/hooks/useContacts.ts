import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { validateContact } from '@/services/contacts/validateContact';
import { normalizePhone } from '@/services/contacts/normalizePhone';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import * as contactsApi from '@/services/contacts/contactsApi';

export function useContacts() {
  const { 
    contacts, 
    groups, 
    replaceContactState,
  } = useAppStore();
  const hydratedFromServerRef = useRef(false);

  useEffect(() => {
    if (hydratedFromServerRef.current) return;
    hydratedFromServerRef.current = true;

    void (async () => {
      try {
        const snapshot = await contactsApi.loadContacts();
        replaceContactState(snapshot.groups, snapshot.contacts);
      } catch (error) {
        console.warn('Failed to hydrate contacts from database', error);
      }
    })();
  }, [contacts, groups, replaceContactState]);

  const addContact = useCallback(async (name: string, number: string, groupIds: string[]): Promise<boolean> => {
    const validation = validateContact(name, number, groupIds, contacts, groups);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Erro ao validar contato');
      return false;
    }

    try {
      const snapshot = await contactsApi.createContact({
        id: nanoid(), name: name.trim(), number: normalizePhone(number),
        groupIds: groupIds.length > 0 ? groupIds : [DEFAULT_GROUP_ID],
      });
      replaceContactState(snapshot.groups, snapshot.contacts);
      toast.success('Contato adicionado com sucesso');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao adicionar contato.');
      return false;
    }
  }, [contacts, groups, replaceContactState]);

  const updateContactGroups = useCallback(async (contactId: string, groupIds: string[]): Promise<boolean> => {
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

    try {
      const snapshot = await contactsApi.updateContactGroups(contactId, groupIds.length > 0 ? groupIds : [DEFAULT_GROUP_ID]);
      replaceContactState(snapshot.groups, snapshot.contacts);
      toast.success('Contato atualizado com sucesso');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao atualizar contato.');
      return false;
    }
  }, [contacts, groups, replaceContactState]);

  const deleteContact = useCallback(async (id: string) => {
    try {
      const snapshot = await contactsApi.deleteContact(id);
      replaceContactState(snapshot.groups, snapshot.contacts);
      toast.success('Contato excluído com sucesso');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao excluir contato.');
    }
  }, [replaceContactState]);

  return {
    contacts,
    groups,
    addContact,
    updateContactGroups,
    deleteContact,
  };
}
