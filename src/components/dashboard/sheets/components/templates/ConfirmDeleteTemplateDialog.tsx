import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDeleteTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function ConfirmDeleteTemplateDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: ConfirmDeleteTemplateDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-2xl max-w-[400px] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-center">
              Excluir Modelo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed px-2 text-center">
              Deseja realmente excluir este modelo de mensagem? <br />
              Esta ação é definitiva e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 justify-center !justify-center w-full px-2">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto min-w-[120px] rounded-xl font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto min-w-[120px] rounded-xl font-bold shadow-lg shadow-destructive/20 transition-all flex items-center justify-center"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              'Excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export default ConfirmDeleteTemplateDialog;
