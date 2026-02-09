"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { RemoveConfirmDialogProps } from './types';

/**
 * RemoveConfirmDialog - Confirmation dialog for removing a contact from group
 */
export function RemoveConfirmDialog({
  contact,
  groupName,
  isLoading,
  onConfirm,
  onCancel,
}: RemoveConfirmDialogProps) {
  const isOpen = !!contact;
  const isOnlyGroup = contact?.groupIds.length === 1;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover contato do grupo?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover <strong>{contact?.name}</strong> do grupo <strong>{groupName}</strong>?
            {isOnlyGroup && (
              <span className="block mt-2 text-warning">
                Este é o único grupo do contato. Ele será movido para o grupo Geral.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
