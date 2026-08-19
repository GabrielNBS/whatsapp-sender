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
    <div className="flex shrink-0 items-center border-b border-border bg-card p-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          aria-label="Pesquisar contatos"
          placeholder="Pesquisar contatos por nome ou número..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-muted/30 pl-9 pr-11"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
