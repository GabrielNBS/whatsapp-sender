'use client';

import { WifiOff, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
} from '@/components/ui/popover';

interface ConnectionRequiredPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => void;
}

export function ConnectionRequiredPopover({
  open,
  onOpenChange,
  onConnect,
}: ConnectionRequiredPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-20 left-1/2 size-px -translate-x-1/2"
        />
      </PopoverAnchor>
      <PopoverContent align="center" side="top" sideOffset={12} className="w-80 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-amber-100 p-2 dark:bg-amber-900/40">
            <WifiOff className="size-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="space-y-1">
            <PopoverTitle>Conecte o WhatsApp</PopoverTitle>
            <PopoverDescription>
              Conecte seu dispositivo para acessar a etapa de mensagem e iniciar a campanha.
            </PopoverDescription>
          </div>
        </div>
        <Button size="sm" onClick={onConnect} className="mt-4 w-full gap-2">
          <QrCode className="size-4" />
          Ir para conexão
        </Button>
      </PopoverContent>
    </Popover>
  );
}
