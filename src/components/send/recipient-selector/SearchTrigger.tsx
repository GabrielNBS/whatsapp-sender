import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecipientValue } from './types';

interface SearchTriggerProps {
  value: RecipientValue;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * SearchTrigger - Clickable field that opens the search dropdown
 */
export function SearchTrigger({ value, isOpen, onToggle }: SearchTriggerProps) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between w-full h-9 px-3 py-2 text-sm bg-background border rounded-md shadow-sm cursor-pointer hover:bg-accent",
        isOpen ? "border-primary ring-1 ring-ring" : "border-border"
      )}
    >
      <span className={cn("truncate block", !value.name && "text-muted-foreground")}>
        {value.name}
      </span>
      <Search className="w-3.5 h-3.5 text-muted-foreground" />
    </div>
  );
}
