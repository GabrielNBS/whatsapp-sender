import { useCallback } from 'react';
import { useContactStore } from '@/stores/contact-store';
import { useShallow } from 'zustand/react/shallow';
import { validateContact } from '@/services/contacts/validateContact';
import { normalizePhone } from '@/services/contacts/normalizePhone';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';
import { nanoid } from 'nanoid';
import type { FeedbackPort } from '@/presentation/feedback';
import * as contactsApi from '@/services/contacts/contactsApi';
import type { ContactConsentStatus } from '@/lib/types';

export function useContacts(feedback: FeedbackPort) {
  const {
    contacts, 
    groups, 
    upsertContacts,
    removeContactFromState,
  } = useContactStore(useShallow((state) => ({
    contacts: state.contacts,
    groups: state.groups,
    upsertContacts: state.upsertContacts,
    removeContactFromState: state.removeContactFromState,
  })));

  const addContact = useCallback(async (name: string, number: string, groupIds: string[]): Promise<boolean> => {
    const validation = validateContact(name, number, groupIds, contacts, groups);
    
    if (!validation.isValid) {
      feedback.error(validation.error || 'Erro ao validar contato');
      return false;
    }

    try {
      const result = await contactsApi.createContact({
        id: nanoid(), name: name.trim(), number: normalizePhone(number),
        groupIds: groupIds.length > 0 ? groupIds : [DEFAULT_GROUP_ID],
      });
      upsertContacts([result.contact]);
      feedback.success('Contato adicionado com sucesso');
      return true;
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Falha ao adicionar contato.');
      return false;
    }
  }, [contacts, feedback, groups, upsertContacts]);

  const updateContactGroups = useCallback(async (contactId: string, groupIds: string[]): Promise<boolean> => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
      feedback.error('Contato não encontrado');
      return false;
    }

    const validation = validateContact(contact.name, contact.number, groupIds, contacts, groups, contactId);
    if (!validation.isValid) {
      feedback.error(validation.error || 'Erro ao validar contato');
      return false;
    }

    try {
      const result = await contactsApi.updateContactGroups(contactId, groupIds.length > 0 ? groupIds : [DEFAULT_GROUP_ID]);
      upsertContacts([result.contact]);
      feedback.success('Contato atualizado com sucesso');
      return true;
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Falha ao atualizar contato.');
      return false;
    }
  }, [contacts, feedback, groups, upsertContacts]);

  const updateContactDetails = useCallback(async (
    contactId: string,
    name: string,
    number: string,
    groupIds: string[],
  ): Promise<boolean> => {
    const contact = contacts.find((currentContact) => currentContact.id === contactId);
    if (!contact) {
      feedback.error('Contato não encontrado');
      return false;
    }

    const validation = validateContact(name, number, groupIds, contacts, groups, contactId);
    if (!validation.isValid) {
      feedback.error(validation.error || 'Erro ao validar contato');
      return false;
    }

    try {
      const result = await contactsApi.updateContact(contactId, {
        name: name.trim(),
        number: normalizePhone(number),
        groupIds: groupIds.length > 0 ? groupIds : [DEFAULT_GROUP_ID],
      });
      upsertContacts([result.contact]);
      feedback.success('Contato atualizado com sucesso');
      return true;
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Falha ao atualizar contato.');
      return false;
    }
  }, [contacts, feedback, groups, upsertContacts]);

  const deleteContact = useCallback(async (id: string) => {
    try {
      const result = await contactsApi.deleteContact(id);
      removeContactFromState(result.deletedContactId);
      feedback.success('Contato excluído com sucesso');
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Falha ao excluir contato.');
    }
  }, [feedback, removeContactFromState]);

  const updateContactConsent = useCallback(async (contactId: string, consentStatus: ContactConsentStatus): Promise<boolean> => {
    try {
      const result = await contactsApi.updateContactConsent(contactId, consentStatus);
      upsertContacts([result.contact]);
      feedback.success(consentStatus === 'OPTED_OUT' ? 'Opt-out registrado. O contato não receberá novos envios.' : 'Consentimento atualizado.');
      return true;
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Falha ao atualizar consentimento.');
      return false;
    }
  }, [feedback, upsertContacts]);

  return {
    contacts,
    groups,
    addContact,
    updateContactDetails,
    updateContactGroups,
    updateContactConsent,
    deleteContact,
  };
}
