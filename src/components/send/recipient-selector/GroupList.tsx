import { Users, Check } from 'lucide-react';
import { Group } from '@/lib/store';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface GroupListProps {
  groups: Group[];
  selectedId: string;
  getContactCount: (groupId: string) => number;
  onSelect: (group: Group) => void;
}

/**
 * GroupList - Renders filtered groups in the dropdown
 */
export function GroupList({ groups, selectedId, getContactCount, onSelect }: GroupListProps) {
  if (groups.length === 0) return null;

  return (
    <CommandGroup heading="Grupos">
      {groups.map((group) => (
        <CommandItem
          key={group.id}
          onSelect={() => onSelect(group)}
          className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg mx-1 my-0.5"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted/40 rounded-lg flex items-center justify-center text-muted-foreground/60 group-data-[selected=true]:bg-primary/10 group-data-[selected=true]:text-primary transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-sm">{group.name}</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {getContactCount(group.id)} {getContactCount(group.id) === 1 ? 'contato' : 'contatos'}
              </span>
            </div>
          </div>
          {selectedId === group.id && (
            <Check className="w-4 h-4 text-primary" />
          )}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
