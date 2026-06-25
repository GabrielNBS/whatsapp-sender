import { SplitText } from '@/components/ui/split-text';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TemplatesHeaderProps {
  onCreateClick: () => void;
  totalCount: number;
}

export function TemplatesHeader({ onCreateClick, totalCount }: TemplatesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4 shrink-0">
      <div className="space-y-1">
        <SplitText
          text="Modelos de Mensagem"
          as="h1"
          className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        />
        <p className="text-xs text-muted-foreground dark:text-zinc-500">
          Gerencie modelos padronizados com suporte a mídias e placeholders. Total: {totalCount}
        </p>
      </div>
      <Button
        onClick={onCreateClick}
        className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Criar modelo
      </Button>
    </div>
  );
}
export default TemplatesHeader;
