import { useState } from 'react';
import { Contact, Group } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface EditContactGroupIdDialogProps {
  contact: Contact | null;
  groups: Group[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactId: string, groupIds: string[]) => boolean;
}

export function EditContactGroupIdDialog({
  contact,
  groups,
  isOpen,
  onClose,
  onSave,
}: EditContactGroupIdDialogProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => contact?.groupIds || []);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      if (prev.includes(groupId)) {
        // Garante que o contato permaneça em pelo menos um grupo (padrão)
        const updated = prev.filter((id) => id !== groupId);
        return updated.length > 0 ? updated : ['default'];
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleInitiateSave = () => {
    setIsConfirmOpen(true);
  };

  const handleExecuteSave = () => {
    if (contact) {
      const success = onSave(contact.id, selectedGroupIds);
      if (success) {
        setIsConfirmOpen(false);
        onClose();
      }
    }
  };

  const handleCancelAll = () => {
    setIsConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancelAll()}>
        <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle>Editar Grupos do Contato</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Nome</Label>
              <Input
                value={contact?.name || ''}
                disabled
                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selecione os Grupos (Múltiplos)</Label>
              <div className="max-h-[180px] overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30">
                {groups.map((group) => {
                  const isChecked = selectedGroupIds.includes(group.id);
                  return (
                    <label
                      key={group.id}
                      className="flex items-center space-x-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer select-none py-1 hover:bg-zinc-100/50 dark:hover:bg-zinc-850 rounded px-1"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleGroup(group.id)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span>{group.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            <Button onClick={handleInitiateSave} className="w-full">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Salvamento */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-2xl max-w-[400px] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center text-center pt-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Save className="w-7 h-7 text-primary" />
            </div>
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="text-xl font-bold tracking-tight text-center">
                Salvar Alterações
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed px-2 text-center">
                Tem certeza que deseja salvar as alterações de grupo para <br />
                <strong className="text-foreground font-bold text-base">&quot;{contact?.name}&quot;</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 justify-center !justify-center w-full px-2">
            <AlertDialogCancel
              onClick={() => setIsConfirmOpen(false)}
              className="w-full sm:w-auto min-w-[120px] rounded-xl font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteSave}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto min-w-[120px] rounded-xl font-bold shadow-lg shadow-primary/20 transition-all"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export default EditContactGroupIdDialog;
