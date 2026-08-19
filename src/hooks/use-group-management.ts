import { useState, useMemo, useCallback } from 'react';
import type { Contact, Group } from '@/lib/types';
import { useContactStore } from '@/stores/contact-store';
import { useShallow } from 'zustand/react/shallow';
import type { FeedbackPort } from '@/presentation/feedback';
import { GroupService } from '@/lib/GroupService';
import { updateContactGroups as persistContactGroups } from '@/services/contacts/contactsApi';

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
export function useGroupManagement(group: Group | null, feedback: FeedbackPort): UseGroupManagementReturn {
  const { contacts, groups, upsertContacts } = useContactStore(useShallow((state) => ({
    contacts: state.contacts,
    groups: state.groups,
    upsertContacts: state.upsertContacts,
  })));
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
      feedback.error(validation.message || 'Operação inválida.');
      return;
    }
    
    setIsLoading(true);
    try {
      const newGroupIds = GroupService.calculateGroupIdsAfterRemove(contact, group.id);
      const result = await persistContactGroups(contact.id, newGroupIds);
      upsertContacts([result.contact]);
      feedback.success(`${contact.name} removido do grupo`);
      setConfirmRemove(null);
    } catch (error) {
      console.error('Erro ao remover contato:', error);
      feedback.error('Erro ao remover contato do grupo');
    } finally {
      setIsLoading(false);
    }
  }, [feedback, group, upsertContacts]);

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
      feedback.error(validation.message || 'Operação inválida.');
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
      
      const result = await persistContactGroups(contact.id, newGroupIds);
      upsertContacts([result.contact]);
      feedback.success(`${contact.name} movido para ${targetGroup?.name || 'outro grupo'}`);
      setActionState(INITIAL_ACTION_STATE);
    } catch (error) {
      console.error('Erro ao mover contato:', error);
      feedback.error('Erro ao mover contato');
    } finally {
      setIsLoading(false);
    }
  }, [actionState.targetGroupId, feedback, group, groups, otherGroups, upsertContacts]);

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
