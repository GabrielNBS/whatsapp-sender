import { SplitText } from '@/components/ui/split-text';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TemplatesHeaderProps {
  onCreateClick: () => void;
  totalCount: number;
}

export function TemplatesHeader({ onCreateClick, totalCount }: TemplatesHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <SplitText
          text="Modelos de mensagem"
          as="h1"
          className="text-2xl font-bold tracking-tight text-foreground"
        />
        <p className="text-xs text-muted-foreground dark:text-zinc-500">
          Gerencie modelos padronizados com suporte a mídias e placeholders. Total: {totalCount}
        </p>
      </div>
      <Button
        onClick={onCreateClick}
        className="h-10 shrink-0 gap-2 rounded-lg px-5 text-sm font-semibold shadow-sm"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Criar modelo
      </Button>
    </div>
  );
}
export default TemplatesHeader;
