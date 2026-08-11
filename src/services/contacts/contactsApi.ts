import type { Contact, Group } from '@/lib/store';

export interface ContactsSnapshot {
  groups: Group[];
  contacts: Contact[];
}

async function readSnapshot(response: Response): Promise<ContactsSnapshot> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || 'Não foi possível persistir a alteração de contatos.');
  }
  return response.json() as Promise<ContactsSnapshot>;
}

export function loadContacts(): Promise<ContactsSnapshot> {
  return fetch('/api/contacts').then(readSnapshot);
}

export function createContact(contact: Contact): Promise<ContactsSnapshot> {
  return fetch('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  }).then(readSnapshot);
}

export function updateContactGroups(contactId: string, groupIds: string[]): Promise<ContactsSnapshot> {
  return fetch(`/api/contacts?id=${encodeURIComponent(contactId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupIds }),
  }).then(readSnapshot);
}

export function deleteContact(contactId: string): Promise<ContactsSnapshot> {
  return fetch(`/api/contacts?id=${encodeURIComponent(contactId)}`, { method: 'DELETE' }).then(readSnapshot);
}

export function clearContacts(): Promise<ContactsSnapshot> {
  return fetch('/api/contacts', { method: 'DELETE' }).then(readSnapshot);
}

export function createGroup(group: Group): Promise<ContactsSnapshot> {
  return fetch('/api/contact-groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  }).then(readSnapshot);
}

export function deleteGroup(groupId: string): Promise<ContactsSnapshot> {
  return fetch(`/api/contact-groups?id=${encodeURIComponent(groupId)}`, { method: 'DELETE' }).then(readSnapshot);
}

export function importContacts(group: Group | undefined, contacts: Contact[]): Promise<ContactsSnapshot> {
  return fetch('/api/contacts/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group, contacts }),
  }).then(readSnapshot);
}
