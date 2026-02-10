"use client";

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Group } from '@/lib/store';
import { useGroupManagement } from '@/hooks/use-group-management';
import { ContactRow, RemoveConfirmDialog } from './group-management';

interface GroupManagementDialogProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupManagementDialog({ group, isOpen, onClose }: GroupManagementDialogProps) {
  // Use custom hook for all state and logic
  const {
    actionState,
    isLoading,
    confirmRemove,
    groupContacts,
    otherGroups,
    canMove,
    isDefaultGroup,
    handleRemoveFromGroup,
    handleMoveToGroup,
    startMoveAction,
    cancelAction,
    setConfirmRemove,
    setTargetGroupId,
    resetState,
  } = useGroupManagement(group);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  if (!group) return null;

  const dialogTitleId = `group-dialog-title-${group.id}`;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          className="max-w-3xl max-h-[80vh] flex flex-col"
        >
          <DialogHeader>
            <DialogTitle id={dialogTitleId}>
              Gerenciar Grupo: {group.name}
            </DialogTitle>
            <DialogDescription>
              {groupContacts.length} contato{groupContacts.length !== 1 ? 's' : ''} neste grupo
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 mt-4" role="region" aria-label="Lista de contatos">
            {groupContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                Nenhum contato neste grupo.
              </div>
            ) : (
              <Table aria-labelledby={dialogTitleId}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead className="w-[300px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupContacts.map(contact => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      actionState={actionState}
                      otherGroups={otherGroups}
                      canMove={canMove}
                      isDefaultGroup={isDefaultGroup}
                      isLoading={isLoading}
                      onStartMove={startMoveAction}
                      onCancelMove={cancelAction}
                      onConfirmMove={handleMoveToGroup}
                      onRemove={setConfirmRemove}
                      onTargetGroupChange={setTargetGroupId}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          
          <div className="border-t pt-4 mt-2 flex justify-between items-center text-sm text-muted-foreground">
            <span>Total de contatos: {groupContacts.length}</span>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <RemoveConfirmDialog
        contact={confirmRemove}
        groupName={group.name}
        isLoading={isLoading}
        onConfirm={() => confirmRemove && handleRemoveFromGroup(confirmRemove)}
        onCancel={() => setConfirmRemove(null)}
      />
    </>
  );
}
