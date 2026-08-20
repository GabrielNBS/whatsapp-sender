'use client';

import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Group, GroupColor, GroupIcon } from '@/lib/types';
import { useGroupCustomization } from '@/hooks/use-group-customization';
import { GroupIcon as GroupIconComponent } from './GroupIcon';
import { GroupAppearancePicker } from './GroupAppearancePicker';
import { GROUP_COLOR_STYLES } from './group-appearance';
import { cn } from '@/lib/utils';

interface GroupCustomizationDialogProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, appearance: { color: GroupColor; icon: GroupIcon }) => Promise<boolean>;
  onUpdate: (groupId: string, appearance: { color: GroupColor; icon: GroupIcon }) => Promise<boolean>;
}

export function GroupCustomizationDialog({
  group,
  open,
  onOpenChange,
  onCreate,
  onUpdate,
}: GroupCustomizationDialogProps) {
  const { name, setName, color, setColor, icon, setIcon, appearance } = useGroupCustomization(group, open);
  const isEditing = Boolean(group);

  const handleSubmit = async () => {
    const success = isEditing
      ? await onUpdate(group!.id, appearance)
      : await onCreate(name, appearance);

    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:mx-0">
            <Palette className="size-5" />
          </div>
          <DialogTitle>{isEditing ? 'Personalizar grupo' : 'Novo grupo'}</DialogTitle>
          <DialogDescription>
            Escolha uma identidade visual para encontrar este grupo mais rapidamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <label htmlFor="group-name" className="text-sm font-semibold text-foreground">Nome do grupo</label>
            <Input
              id="group-name"
              value={name}
              disabled={isEditing}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Clientes VIP"
              maxLength={30}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3">
            <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', GROUP_COLOR_STYLES[color].icon)}>
              <GroupIconComponent icon={icon} className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name.trim() || 'Prévia do grupo'}</p>
              <p className="text-xs text-muted-foreground">Aparência exibida nas listas e tags</p>
            </div>
          </div>

          <GroupAppearancePicker
            color={color}
            icon={icon}
            onColorChange={setColor}
            onIconChange={setIcon}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={!isEditing && !name.trim()}>
            {isEditing ? 'Salvar alterações' : 'Criar grupo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
