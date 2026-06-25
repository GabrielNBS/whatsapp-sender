import { useState } from 'react';
import { Group } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';

interface AddContactDialogProps {
  groups: Group[];
  onAddContact: (name: string, number: string, groupIds: string[]) => boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddContactDialog({
  groups,
  onAddContact,
  isOpen,
  onOpenChange,
}: AddContactDialogProps) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [groupId, setGroupId] = useState(DEFAULT_GROUP_ID);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setNumber(formatted);
  };

  const handleSave = () => {
    const success = onAddContact(name, number, [groupId]);
    if (success) {
      setName('');
      setNumber('');
      setGroupId(DEFAULT_GROUP_ID);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Contato
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
            />
            <div className="space-y-1">
              <Input
                placeholder="(11) 9 9999-9999"
                value={number}
                onChange={handlePhoneChange}
                maxLength={16}
                className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
              />
              <p className="text-[10px] text-muted-foreground dark:text-zinc-500 pl-1">
                Formato: (DDD) 9 0000-0000
              </p>
            </div>

            <span className="text-sm font-medium">Selecione um grupo</span>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default AddContactDialog;
