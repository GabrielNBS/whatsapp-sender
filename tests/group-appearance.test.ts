import { describe, expect, it } from 'vitest';
import { GROUP_COLORS, GROUP_ICONS } from '@/constants/group-appearance';
import { normalizeGroup } from '@/services/contacts/normalizeGroup';
import {
  contactGroupSnapshotSchema,
  updateContactGroupSchema,
} from '@/server/validators/contacts';

describe('group appearance', () => {
  it('exposes the curated set of colors and icons', () => {
    expect(GROUP_COLORS).toHaveLength(8);
    expect(GROUP_ICONS).toHaveLength(12);
  });

  it('normalizes groups created before appearance customization', () => {
    expect(normalizeGroup({ id: 'group-1', name: 'Clientes' })).toMatchObject({
      color: 'slate',
      icon: 'users',
    });
  });

  it('accepts appearance in snapshots and validates updates strictly', () => {
    expect(contactGroupSnapshotSchema.safeParse({
      id: 'group-1',
      name: 'Clientes',
      color: 'violet',
      icon: 'star',
    }).success).toBe(true);

    expect(updateContactGroupSchema.safeParse({
      color: 'invalid',
      icon: 'star',
    }).success).toBe(false);

    expect(updateContactGroupSchema.safeParse({
      color: 'violet',
      icon: 'star',
      extra: true,
    }).success).toBe(false);
  });
});
