import { useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { validateGroup } from '@/services/contacts/validateGroup';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import * as contactsApi from '@/services/contacts/contactsApi';

export function useGroups() {
  const { 
    groups, 
    upsertGroup,
    removeGroupFromState,
    upsertContacts,
  } = useAppStore(useShallow((state) => ({
    groups: state.groups,
    upsertGroup: state.upsertGroup,
    removeGroupFromState: state.removeGroupFromState,
    upsertContacts: state.upsertContacts,
  })));

  const addGroup = useCallback(async (name: string): Promise<boolean> => {
    const validation = validateGroup(name, groups);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Erro ao validar grupo');
      return false;
    }

    try {
      const result = await contactsApi.createGroup({ id: nanoid(), name: name.trim() });
      upsertGroup(result.group);
      toast.success('Grupo criado com sucesso');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao criar grupo.');
      return false;
    }
  }, [groups, upsertGroup]);

  const deleteGroup = useCallback(async (id: string) => {
    if (id === DEFAULT_GROUP_ID) {
      toast.error('Não é possível remover o grupo padrão Geral');
      return;
    }

    try {
      const result = await contactsApi.deleteGroup(id);
      removeGroupFromState(result.deletedGroupId);
      upsertContacts(result.contacts);
      toast.success('Grupo excluído com sucesso');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao excluir grupo.');
    }
  }, [removeGroupFromState, upsertContacts]);

  return {
    groups,
    addGroup,
    deleteGroup,
  };
}
