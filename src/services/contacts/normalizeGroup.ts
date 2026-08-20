import {
  normalizeGroupAppearance,
} from '@/constants/group-appearance';
import type { Group } from '@/lib/types';

export function normalizeGroup(group: {
  id: string;
  name: string;
  description?: string | null;
  color?: unknown;
  icon?: unknown;
}): Group {
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? undefined,
    ...normalizeGroupAppearance(group),
  };
}
