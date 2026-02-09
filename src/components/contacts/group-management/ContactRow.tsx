"use client";

import { TableRow, TableCell } from '@/components/ui/table';
import { Contact, Group } from '@/lib/types';
import { MoveContactForm } from './MoveContactForm';
import { ContactActions } from './ContactActions';
import { ActionState } from './types';

interface ContactRowProps {
  contact: Contact;
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
 * ContactRow - Single row in the contacts table
 */
export function ContactRow({
  contact,
  actionState,
  otherGroups,
  canMove,
  isDefaultGroup,
  isLoading,
  onStartMove,
  onCancelMove,
  onConfirmMove,
  onRemove,
  onTargetGroupChange,
}: ContactRowProps) {
  const isMoving = actionState.type === 'move' && actionState.contactId === contact.id;

  return (
    <TableRow>
      <TableCell className="font-medium">{contact.name}</TableCell>
      <TableCell>{contact.number}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {isMoving ? (
            <MoveContactForm
              targetGroupId={actionState.targetGroupId}
              otherGroups={otherGroups}
              isLoading={isLoading}
              onTargetGroupChange={onTargetGroupChange}
              onConfirm={() => onConfirmMove(contact)}
              onCancel={onCancelMove}
            />
          ) : (
            <ContactActions
              contact={contact}
              canMove={canMove}
              isDefaultGroup={isDefaultGroup}
              isLoading={isLoading}
              onStartMove={() => onStartMove(contact.id)}
              onRemove={() => onRemove(contact)}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
