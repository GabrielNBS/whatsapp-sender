import { useState, useMemo, useCallback } from 'react';
import { useAppStore, Contact, Group } from '@/lib/store';
import { toast } from 'sonner';
import { GroupService } from '@/lib/GroupService';

/**
 * Action state for group management operations
 */
interface ActionState {
  type: 'move' | 'remove' | null;
  contactId: string | null;
  targetGroupId: string;
}

const INITIAL_ACTION_STATE: ActionState = {
  type: null,
  contactId: null,
  targetGroupId: '',
};

/**
 * Hook return type
 */
interface UseGroupManagementReturn {
  // State
  actionState: ActionState;
  isLoading: boolean;
  confirmRemove: Contact | null;
  
  // Computed
  groupContacts: Contact[];
  otherGroups: Group[];
  canMove: boolean;
  isDefaultGroup: boolean;
  
  // Actions
  handleRemoveFromGroup: (contact: Contact) => Promise<void>;
  handleMoveToGroup: (contact: Contact) => Promise<void>;
  startMoveAction: (contactId: string) => void;
  cancelAction: () => void;
  setConfirmRemove: (contact: Contact | null) => void;
  setTargetGroupId: (groupId: string) => void;
  resetState: () => void;
}

/**
 * useGroupManagement - Custom hook for group management dialog
 * 
 * Encapsulates all state and logic for managing contacts within groups,
 * separating concerns from the UI component.
 */
export function useGroupManagement(group: Group | null): UseGroupManagementReturn {
  const { contacts, groups, updateContactGroups } = useAppStore();
  const [actionState, setActionState] = useState<ActionState>(INITIAL_ACTION_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Contact | null>(null);

  // Memoized computed values using GroupService
  const groupContacts = useMemo(() => {
    if (!group) return [];
    return GroupService.getContactsInGroup(contacts, group.id);
  }, [contacts, group]);

  const otherGroups = useMemo(() => {
    if (!group) return [];
    return GroupService.getOtherGroups(groups, group.id);
  }, [groups, group]);

  const canMove = useMemo(() => {
    if (!group) return false;
    return GroupService.canMoveToOtherGroup(groups, group.id);
  }, [groups, group]);

  const isDefaultGroup = group?.id === 'default';

  // Reset state when group changes
  const resetState = useCallback(() => {
    setActionState(INITIAL_ACTION_STATE);
    setIsLoading(false);
    setConfirmRemove(null);
  }, []);

  // Handlers with error handling
  const handleRemoveFromGroup = useCallback(async (contact: Contact) => {
    if (!group) return;
    
    // Validate operation
    const validation = GroupService.validateRemoveFromGroup(contact, group.id);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }
    
    setIsLoading(true);
    try {
      const newGroupIds = GroupService.calculateGroupIdsAfterRemove(contact, group.id);
      await updateContactGroups(contact.id, newGroupIds);
      toast.success(`${contact.name} removido do grupo`);
      setConfirmRemove(null);
    } catch (error) {
      console.error('Erro ao remover contato:', error);
      toast.error('Erro ao remover contato do grupo');
    } finally {
      setIsLoading(false);
    }
  }, [group, updateContactGroups]);

  const handleMoveToGroup = useCallback(async (contact: Contact) => {
    if (!actionState.targetGroupId || !group) return;
    
    // Validate operation
    const validation = GroupService.validateMoveToGroup(
      contact,
      group.id,
      actionState.targetGroupId,
      groups
    );
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }
    
    setIsLoading(true);
    try {
      const targetGroup = otherGroups.find(g => g.id === actionState.targetGroupId);
      const newGroupIds = GroupService.calculateGroupIdsAfterMove(
        contact,
        group.id,
        actionState.targetGroupId
      );
      
      await updateContactGroups(contact.id, newGroupIds);
      toast.success(`${contact.name} movido para ${targetGroup?.name || 'outro grupo'}`);
      setActionState(INITIAL_ACTION_STATE);
    } catch (error) {
      console.error('Erro ao mover contato:', error);
      toast.error('Erro ao mover contato');
    } finally {
      setIsLoading(false);
    }
  }, [actionState.targetGroupId, group, groups, otherGroups, updateContactGroups]);

  const startMoveAction = useCallback((contactId: string) => {
    setActionState({ type: 'move', contactId, targetGroupId: '' });
  }, []);

  const cancelAction = useCallback(() => {
    setActionState(INITIAL_ACTION_STATE);
  }, []);

  const setTargetGroupId = useCallback((groupId: string) => {
    setActionState(prev => ({ ...prev, targetGroupId: groupId }));
  }, []);

  return {
    // State
    actionState,
    isLoading,
    confirmRemove,
    
    // Computed
    groupContacts,
    otherGroups,
    canMove,
    isDefaultGroup,
    
    // Actions
    handleRemoveFromGroup,
    handleMoveToGroup,
    startMoveAction,
    cancelAction,
    setConfirmRemove,
    setTargetGroupId,
    resetState,
  };
}

export default useGroupManagement;
