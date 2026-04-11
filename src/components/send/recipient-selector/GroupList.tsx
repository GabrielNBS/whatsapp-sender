import { Users, Check } from 'lucide-react';
import { Group } from '@/lib/store';

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
    <>
      <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2">
        Grupos
      </div>
      {groups.map((group) => (
        <div
          key={group.id}
          className="px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer flex items-center justify-between"
          onClick={() => onSelect(group)}
        >
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{group.name}</span>
            <span className="text-xs text-muted-foreground">
              ({getContactCount(group.id)})
            </span>
          </div>
          {selectedId === group.id && (
            <Check className="w-3.5 h-3.5 text-primary" />
          )}
        </div>
      ))}
    </>
  );
}
