import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface ContactSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function ContactSearch({ value, onChange, onClear }: ContactSearchProps) {
  return (
    <div className="p-3 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 flex items-center shrink-0">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Pesquisar contatos por nome ou número..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 pr-9 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:bg-white dark:focus-visible:bg-zinc-950 transition-all h-9"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-zinc-400 hover:text-zinc-600 hover:bg-transparent"
            onClick={onClear}
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
