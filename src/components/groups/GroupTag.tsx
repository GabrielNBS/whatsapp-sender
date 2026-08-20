'use client';

import type { Group } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GroupIcon } from './GroupIcon';
import { GROUP_COLOR_STYLES } from './group-appearance';

interface GroupTagProps {
  group: Group;
  className?: string;
  compact?: boolean;
}

export function GroupTag({ group, className, compact = false }: GroupTagProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border font-medium',
        GROUP_COLOR_STYLES[group.color].badge,
        compact ? 'px-1.5 py-0 text-[10px]' : 'text-xs',
        className,
      )}
    >
      <GroupIcon icon={group.icon} className={compact ? 'size-2.5' : 'size-3'} />
      <span className="max-w-32 truncate">{group.name}</span>
    </Badge>
  );
}
