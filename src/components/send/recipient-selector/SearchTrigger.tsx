import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecipientValue } from './types';
import { AvatarDisplay } from '@/components/ui/avatar-display';

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
      <div className="flex items-center gap-2 truncate">
        {value.type === 'contact' && value.id !== 'all' && (
          <AvatarDisplay name={value.name} phone={value.id} className="w-5 h-5 shrink-0" />
        )}
        <span className={cn("truncate block", !value.name && "text-muted-foreground")}>
          {value.name}
        </span>
      </div>
      <Search className="w-3.5 h-3.5 text-muted-foreground ml-2 shrink-0" />
    </div>
  );
}
