import { DEFAULT_GROUP_ID } from '@/constants/contacts';

export function normalizeGroupIds(groupIds?: string[]): string[] {
  const safeGroupIds = groupIds && groupIds.length > 0 ? groupIds : [DEFAULT_GROUP_ID];
  return Array.from(new Set(safeGroupIds));
}
