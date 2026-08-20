import { useState } from 'react';
import { DEFAULT_GROUP_COLOR, DEFAULT_GROUP_ICON } from '@/constants/group-appearance';
import type { Group, GroupColor, GroupIcon } from '@/lib/types';

export function useGroupCustomization(group: Group | null, open: boolean) {
  const [name, setName] = useState(() => (open ? group?.name ?? '' : ''));
  const [color, setColor] = useState<GroupColor>(() => (open ? group?.color ?? DEFAULT_GROUP_COLOR : DEFAULT_GROUP_COLOR));
  const [icon, setIcon] = useState<GroupIcon>(() => (open ? group?.icon ?? DEFAULT_GROUP_ICON : DEFAULT_GROUP_ICON));

  return {
    name,
    setName,
    color,
    setColor,
    icon,
    setIcon,
    appearance: { color, icon },
  };
}
