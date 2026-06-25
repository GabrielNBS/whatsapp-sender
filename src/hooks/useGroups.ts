import { useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { validateGroup } from '@/services/contacts/validateGroup';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';
import { toast } from 'sonner';

export function useGroups() {
  const { 
    groups, 
    contacts, 
    addGroup: storeAddGroup, 
    deleteGroup: storeDeleteGroup,
    updateContactGroups
  } = useAppStore();

  const addGroup = useCallback((name: string): boolean => {
    const validation = validateGroup(name, groups);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Erro ao validar grupo');
      return false;
    }

    storeAddGroup(name.trim());
    toast.success('Grupo criado com sucesso');
    return true;
  }, [groups, storeAddGroup]);

  const deleteGroup = useCallback((id: string) => {
    if (id === DEFAULT_GROUP_ID) {
      toast.error('Não é possível remover o grupo padrão Geral');
      return;
    }

    // Comportamento explícito: antes de remover o grupo da store, 
    // movemos explicitamente todos os contatos que estavam associados a ele.
    // Embora a store faça algo similar internamente, fazemos isso explícito aqui.
    const contactsInGroup = contacts.filter(c => c.groupIds.includes(id));
    
    contactsInGroup.forEach(c => {
      const remainingGroups = c.groupIds.filter(gid => gid !== id);
      const newGroups = remainingGroups.length > 0 ? remainingGroups : [DEFAULT_GROUP_ID];
      updateContactGroups(c.id, newGroups);
    });

    storeDeleteGroup(id);
    toast.success('Grupo excluído com sucesso');
  }, [contacts, storeDeleteGroup, updateContactGroups]);

  return {
    groups,
    addGroup,
    deleteGroup,
  };
}
