import { describe, expect, it } from 'vitest';
import {
  resolveRecipientBatches,
  resolveRecipients,
  type RecipientConfig,
} from '@/hooks/use-send-form';
import type { Contact } from '@/lib/types';

const contacts: Contact[] = [
  { id: 'ana', name: 'Ana', number: '5511999999999', groupIds: ['sales'] },
  { id: 'bia', name: 'Bia', number: '5511888888888', groupIds: ['sales', 'vip'] },
  { id: 'caio', name: 'Caio', number: '5511777777777', groupIds: ['vip'] },
];

const getContactsByGroup = (groupId: string) => (
  contacts.filter((contact) => contact.groupIds.includes(groupId))
);

describe('resolveRecipients', () => {
  it('returns every contact when all contacts is selected', () => {
    const selection: RecipientConfig[] = [
      { type: 'group', id: 'all', name: 'Todos os Contatos' },
    ];

    expect(resolveRecipients(selection, contacts, getContactsByGroup)).toEqual(contacts);
  });

  it('follows selection order while removing duplicates', () => {
    const selection: RecipientConfig[] = [
      { type: 'group', id: 'vip', name: 'VIP' },
      { type: 'group', id: 'sales', name: 'Vendas' },
      { type: 'contact', id: 'bia', name: 'Bia' },
    ];

    expect(resolveRecipients(selection, contacts, getContactsByGroup)).toEqual([
      contacts[1],
      contacts[2],
      contacts[0],
    ]);
  });

  it('tracks each selection range for real-time feedback', () => {
    const selection: RecipientConfig[] = [
      { type: 'group', id: 'vip', name: 'VIP' },
      { type: 'group', id: 'sales', name: 'Vendas' },
      { type: 'contact', id: 'ana', name: 'Ana' },
    ];

    const batches = resolveRecipientBatches(selection, contacts, getContactsByGroup);

    expect(batches.map((batch) => ({
      name: batch.name,
      recipientIds: batch.recipients.map((contact) => contact.id),
      startIndex: batch.startIndex,
      endIndex: batch.endIndex,
    }))).toEqual([
      { name: 'VIP', recipientIds: ['bia', 'caio'], startIndex: 0, endIndex: 2 },
      { name: 'Vendas', recipientIds: ['ana'], startIndex: 2, endIndex: 3 },
      { name: 'Ana', recipientIds: [], startIndex: 3, endIndex: 3 },
    ]);
  });

  it('returns no recipients when every option is deselected', () => {
    expect(resolveRecipients([], contacts, getContactsByGroup)).toEqual([]);
  });
});
