import type { Group } from '@/lib/types';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { GroupIcon } from '@/components/groups/GroupIcon';
import { GROUP_COLOR_STYLES } from '@/components/groups/group-appearance';
import { cn } from '@/lib/utils';

interface GroupListProps {
  groups: Group[];
  getSelectionOrder: (groupId: string) => number | null;
  getContactCount: (groupId: string) => number;
  onSelect: (group: Group) => void;
}

/**
 * GroupList - Renders filtered groups in the dropdown
 */
export function GroupList({ groups, getSelectionOrder, getContactCount, onSelect }: GroupListProps) {
  if (groups.length === 0) return null;

  return (
    <CommandGroup heading="Grupos">
      {groups.map((group) => {
        const selectionOrder = getSelectionOrder(group.id);
        const isSelected = selectionOrder !== null;
        const contactCount = getContactCount(group.id);

        return (
          <CommandItem
            key={group.id}
            value={`group:${group.id}:${group.name}`}
            onSelect={() => onSelect(group)}
            className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg mx-1 my-0.5"
          >
            <div className="flex items-center gap-3">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-colors group-data-[selected=true]:ring-2 group-data-[selected=true]:ring-primary/20', GROUP_COLOR_STYLES[group.color].icon)}>
                <GroupIcon icon={group.icon} className="h-4 w-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-sm">{group.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {contactCount} {contactCount === 1 ? 'contato' : 'contatos'}
                </span>
              </div>
            </div>
            <div className={`flex size-5 items-center justify-center rounded-full border text-xs font-bold ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>
              {selectionOrder}
            </div>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
