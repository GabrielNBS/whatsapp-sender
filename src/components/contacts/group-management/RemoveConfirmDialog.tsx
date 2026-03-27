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
import { AlertTriangle, Loader2 } from 'lucide-react';
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
      <AlertDialogContent className="rounded-2xl max-w-[400px] border-border bg-card/95 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-center">Remover contato do grupo?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed px-2 text-center">
              Tem certeza que deseja remover <strong className="text-foreground font-black">&quot;{contact?.name}&quot;</strong> do grupo <strong className="text-primary font-black">&quot;{groupName}&quot;</strong>?
              {isOnlyGroup && (
                <span className="block mt-3 text-destructive font-bold text-[11px] uppercase tracking-wide bg-destructive/5 py-2 px-3 rounded-lg border border-destructive/10">
                  Atenção: Este é o único grupo do contato. Ele será movido para o grupo Geral.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 justify-center! sm:justify-center! w-full px-2">
          <AlertDialogCancel disabled={isLoading} className="w-full sm:w-auto min-w-[120px] rounded-xl font-bold border-border hover:bg-muted transition-all">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto min-w-[120px] rounded-xl font-bold shadow-lg shadow-destructive/20 transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
