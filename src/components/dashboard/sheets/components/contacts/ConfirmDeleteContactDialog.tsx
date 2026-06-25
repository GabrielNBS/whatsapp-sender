import { Contact } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteContactDialogProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteContactDialog({
  contact,
  isOpen,
  onClose,
  onConfirm,
}: ConfirmDeleteContactDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-2xl max-w-[400px] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-center">
              Excluir Contato
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed px-2 text-center">
              Deseja realmente remover o contato <br />
              <strong className="text-foreground font-bold text-base">&quot;{contact?.name}&quot;</strong>? <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 justify-center !justify-center w-full px-2">
          <AlertDialogCancel
            onClick={onClose}
            className="w-full sm:w-auto min-w-[120px] rounded-xl font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto min-w-[120px] rounded-xl font-bold shadow-lg shadow-destructive/20 transition-all"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export default ConfirmDeleteContactDialog;
