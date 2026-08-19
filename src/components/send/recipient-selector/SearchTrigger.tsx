import * as React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecipientValue } from './types';
import { AvatarDisplay } from '@/components/ui/avatar-display';

interface SearchTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  value: RecipientValue[];
  isOpen?: boolean;
}

/**
 * SearchTrigger - Clickable field that opens the search dropdown
 */
export const SearchTrigger = React.forwardRef<HTMLDivElement, SearchTriggerProps>(
  ({ value, isOpen, className, ...props }, ref) => {
    const singleSelection = value.length === 1 ? value[0] : null;
    const selectedGroupCount = value.filter((item) => item.type === 'group' && item.id !== 'all').length;
    const selectedContactCount = value.filter((item) => item.type === 'contact').length;
    const hasAllContacts = value.some((item) => item.type === 'group' && item.id === 'all');

    const selectionLabel = (() => {
      if (hasAllContacts) return 'Todos os Contatos';
      if (singleSelection) return singleSelection.name;
      if (selectedGroupCount > 0 && selectedContactCount > 0) {
        return `${selectedGroupCount} ${selectedGroupCount === 1 ? 'grupo' : 'grupos'} + ${selectedContactCount} ${selectedContactCount === 1 ? 'contato' : 'contatos'}`;
      }
      if (selectedGroupCount > 0) {
        return `${selectedGroupCount} ${selectedGroupCount === 1 ? 'grupo selecionado' : 'grupos selecionados'}`;
      }
      if (selectedContactCount > 0) {
        return `${selectedContactCount} ${selectedContactCount === 1 ? 'contato selecionado' : 'contatos selecionados'}`;
      }
      return '';
    })();

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between w-full h-12 px-4 py-2 text-sm bg-background border rounded-xl transition-all duration-200 group",
          isOpen ? "border-primary/50 ring-4 ring-primary/5 bg-accent/10" : "border-border/60 hover:border-border hover:bg-muted/30",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3 truncate">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            isOpen ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary"
          )}>
            <Search className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col items-start truncate leading-tight">
            <span className="mb-0.5 text-xs font-medium text-muted-foreground">
              Destinatários
            </span>
            <div className="flex items-center gap-2 truncate">
              {singleSelection?.type === 'contact' && (
                <AvatarDisplay name={singleSelection.name} phone={singleSelection.id} className="w-5 h-5 shrink-0 opacity-90" />
              )}
              <span className={cn("font-medium truncate block text-foreground", !selectionLabel && "text-muted-foreground/40 font-normal italic")}>
                {selectionLabel || "Selecione o público..."}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-300",
          isOpen && "rotate-180 text-primary/60"
        )} />
      </div>
    );
  }
);

SearchTrigger.displayName = "SearchTrigger";
