import { useCallback } from 'react';
import { useContactStore } from '@/stores/contact-store';
import { useShallow } from 'zustand/react/shallow';
import { validateGroup } from '@/services/contacts/validateGroup';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';
import { nanoid } from 'nanoid';
import type { FeedbackPort } from '@/presentation/feedback';
import * as contactsApi from '@/services/contacts/contactsApi';

export function useGroups(feedback: FeedbackPort) {
  const { 
    groups, 
    upsertGroup,
    removeGroupFromState,
    upsertContacts,
  } = useContactStore(useShallow((state) => ({
    groups: state.groups,
    upsertGroup: state.upsertGroup,
    removeGroupFromState: state.removeGroupFromState,
    upsertContacts: state.upsertContacts,
  })));

  const addGroup = useCallback(async (name: string): Promise<boolean> => {
    const validation = validateGroup(name, groups);
    
    if (!validation.isValid) {
      feedback.error(validation.error || 'Erro ao validar grupo');
      return false;
    }

    try {
      const result = await contactsApi.createGroup({ id: nanoid(), name: name.trim() });
      upsertGroup(result.group);
      feedback.success('Grupo criado com sucesso');
      return true;
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Falha ao criar grupo.');
      return false;
    }
  }, [feedback, groups, upsertGroup]);

  const deleteGroup = useCallback(async (id: string) => {
    if (id === DEFAULT_GROUP_ID) {
      feedback.error('Não é possível remover o grupo padrão Geral');
      return;
    }

    try {
      const result = await contactsApi.deleteGroup(id);
      removeGroupFromState(result.deletedGroupId);
      upsertContacts(result.contacts);
      feedback.success('Grupo excluído com sucesso');
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Falha ao excluir grupo.');
    }
  }, [feedback, removeGroupFromState, upsertContacts]);

  return {
    groups,
    addGroup,
    deleteGroup,
  };
}
