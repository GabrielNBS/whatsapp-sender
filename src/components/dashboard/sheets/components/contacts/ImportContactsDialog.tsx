import { Group, Contact } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { ImportTargetType } from '@/hooks/useContactImport';

interface ImportContactsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  importedContacts: Omit<Contact, 'id'>[];
  importTargetType: ImportTargetType;
  onTargetTypeChange: (value: string) => void;
  importTargetGroupId: string;
  onTargetGroupIdChange: (value: string) => void;
  importNewGroupName: string;
  onNewGroupNameChange: (value: string) => void;
  groups: Group[];
  onConfirmImport: () => void;
}

export function ImportContactsDialog({
  isOpen,
  onOpenChange,
  importedContacts,
  importTargetType,
  onTargetTypeChange,
  importTargetGroupId,
  onTargetGroupIdChange,
  importNewGroupName,
  onNewGroupNameChange,
  groups,
  onConfirmImport,
}: ImportContactsDialogProps) {
  const isConfirmDisabled =
    importedContacts.length === 0 ||
    (importTargetType === 'existing' && !importTargetGroupId) ||
    (importTargetType === 'new' && !importNewGroupName.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle>Importar Contatos</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{importedContacts.length} contatos encontrados no arquivo.</span>
          </div>

          <div className="space-y-3">
            <Label>Destino dos contatos</Label>
            <RadioGroup value={importTargetType} onValueChange={onTargetTypeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="r1" />
                <Label htmlFor="r1">Adicionar ao grupo Geral (Padrão)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="r2" />
                <Label htmlFor="r2">Adicionar a um grupo existente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="r3" />
                <Label htmlFor="r3">Criar um novo grupo</Label>
              </div>
            </RadioGroup>
          </div>

          {importTargetType === 'existing' && (
            <div className="space-y-2 pl-6 border-l-2 border-zinc-100 dark:border-zinc-800">
              <Label>Selecione o grupo</Label>
              <Select value={importTargetGroupId} onValueChange={onTargetGroupIdChange}>
                <SelectTrigger className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {importTargetType === 'new' && (
            <div className="space-y-2 pl-6 border-l-2 border-zinc-100 dark:border-zinc-800">
              <Label>Nome do novo grupo</Label>
              <Input
                placeholder="Ex: Clientes VIP"
                value={importNewGroupName}
                onChange={(e) => onNewGroupNameChange(e.target.value)}
                className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onConfirmImport} disabled={isConfirmDisabled}>
              Importar Contatos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default ImportContactsDialog;
