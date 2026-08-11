import { useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { validateGroup } from '@/services/contacts/validateGroup';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import * as contactsApi from '@/services/contacts/contactsApi';

export function useGroups() {
  const { 
    groups, 
    replaceContactState,
  } = useAppStore();

  const addGroup = useCallback(async (name: string): Promise<boolean> => {
    const validation = validateGroup(name, groups);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Erro ao validar grupo');
      return false;
    }

    try {
      const snapshot = await contactsApi.createGroup({ id: nanoid(), name: name.trim() });
      replaceContactState(snapshot.groups, snapshot.contacts);
      toast.success('Grupo criado com sucesso');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao criar grupo.');
      return false;
    }
  }, [groups, replaceContactState]);

  const deleteGroup = useCallback(async (id: string) => {
    if (id === DEFAULT_GROUP_ID) {
      toast.error('Não é possível remover o grupo padrão Geral');
      return;
    }

    try {
      const snapshot = await contactsApi.deleteGroup(id);
      replaceContactState(snapshot.groups, snapshot.contacts);
      toast.success('Grupo excluído com sucesso');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao excluir grupo.');
    }
  }, [replaceContactState]);

  return {
    groups,
    addGroup,
    deleteGroup,
  };
}
