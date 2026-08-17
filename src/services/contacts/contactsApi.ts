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

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    throw new Error(payload?.message || payload?.error || 'Não foi possível persistir a alteração de contatos.');
  }
  return response.json() as Promise<T>;
}

export interface ContactMutationResult {
  contact: Contact;
}

export interface DeleteContactResult {
  deletedContactId: string;
}

export interface ClearContactsResult {
  success: boolean;
}

export interface GroupMutationResult {
  group: Group;
}

export interface DeleteGroupResult {
  deletedGroupId: string;
  contacts: Contact[];
}

export interface ImportContactsResult {
  group?: Group;
  contacts: Contact[];
}

export function loadContacts(): Promise<ContactsSnapshot> {
  return fetch('/api/contacts').then(readSnapshot);
}

export function createContact(contact: Contact): Promise<ContactMutationResult> {
  return fetch('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  }).then(readJson<ContactMutationResult>);
}

export function updateContactGroups(contactId: string, groupIds: string[]): Promise<ContactMutationResult> {
  return fetch(`/api/contacts?id=${encodeURIComponent(contactId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupIds }),
  }).then(readJson<ContactMutationResult>);
}

export function deleteContact(contactId: string): Promise<DeleteContactResult> {
  return fetch(`/api/contacts?id=${encodeURIComponent(contactId)}`, { method: 'DELETE' }).then(readJson<DeleteContactResult>);
}

export function clearContacts(): Promise<ClearContactsResult> {
  return fetch('/api/contacts', { method: 'DELETE' }).then(readJson<ClearContactsResult>);
}

export function createGroup(group: Group): Promise<GroupMutationResult> {
  return fetch('/api/contact-groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  }).then(readJson<GroupMutationResult>);
}

export function deleteGroup(groupId: string): Promise<DeleteGroupResult> {
  return fetch(`/api/contact-groups?id=${encodeURIComponent(groupId)}`, { method: 'DELETE' }).then(readJson<DeleteGroupResult>);
}

export function importContacts(group: Group | undefined, contacts: Contact[]): Promise<ImportContactsResult> {
  return fetch('/api/contacts/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group, contacts }),
  }).then(readJson<ImportContactsResult>);
}
