import { Contact, Group } from '@/lib/types';

/**
 * Action state for move/remove operations
 */
export interface ActionState {
  type: 'move' | 'remove' | null;
  contactId: string | null;
  targetGroupId: string;
}

/**
 * Props for ContactRow component
 */
export interface ContactRowProps {
  contact: Contact;
  isMoving: boolean;
  actionState: ActionState;
  otherGroups: Group[];
  canMove: boolean;
  isDefaultGroup: boolean;
  isLoading: boolean;
  onStartMove: (contactId: string) => void;
  onCancelMove: () => void;
  onConfirmMove: (contact: Contact) => void;
  onRemove: (contact: Contact) => void;
  onTargetGroupChange: (groupId: string) => void;
}

/**
 * Props for MoveContactForm component
 */
export interface MoveContactFormProps {
  targetGroupId: string;
  otherGroups: Group[];
  isLoading: boolean;
  onTargetGroupChange: (groupId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Props for RemoveConfirmDialog component
 */
export interface RemoveConfirmDialogProps {
  contact: Contact | null;
  groupName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Props for ContactActions component
 */
export interface ContactActionsProps {
  contact: Contact;
  canMove: boolean;
  isDefaultGroup: boolean;
  isLoading: boolean;
  onStartMove: () => void;
  onRemove: () => void;
}
