import type { GroupColor, GroupIcon } from '@/lib/types';

export const DEFAULT_GROUP_COLOR: GroupColor = 'slate';
export const DEFAULT_GROUP_ICON: GroupIcon = 'users';

export const GROUP_COLORS = [
  'slate',
  'blue',
  'violet',
  'pink',
  'orange',
  'amber',
  'emerald',
  'cyan',
] as const satisfies readonly GroupColor[];

export const GROUP_ICONS = [
  'users',
  'briefcase',
  'heart',
  'star',
  'shopping-bag',
  'megaphone',
  'graduation-cap',
  'house',
  'party-popper',
  'plane',
  'dumbbell',
  'tag',
] as const satisfies readonly GroupIcon[];

export function isGroupColor(value: unknown): value is GroupColor {
  return typeof value === 'string' && GROUP_COLORS.includes(value as GroupColor);
}

export function isGroupIcon(value: unknown): value is GroupIcon {
  return typeof value === 'string' && GROUP_ICONS.includes(value as GroupIcon);
}

export function normalizeGroupAppearance(appearance: {
  color?: unknown;
  icon?: unknown;
}): Pick<import('@/lib/types').Group, 'color' | 'icon'> {
  return {
    color: isGroupColor(appearance.color) ? appearance.color : DEFAULT_GROUP_COLOR,
    icon: isGroupIcon(appearance.icon) ? appearance.icon : DEFAULT_GROUP_ICON,
  };
}
