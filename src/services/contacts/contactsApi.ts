import type { Contact, ContactConsentStatus, Group, GroupColor, GroupIcon } from '@/lib/types';
import type { ContactGroupCommand } from '@/domain/contracts';
import { requestJson } from '@/services/http/client';

export interface ContactsSnapshot {
  groups: Group[];
  contacts: Contact[];
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

export interface UpdateContactPayload {
  name?: string;
  number?: string;
  groupIds?: string[];
  consentStatus?: ContactConsentStatus;
}

export function loadContacts(): Promise<ContactsSnapshot> {
  return requestJson<ContactsSnapshot>('/api/contacts');
}

export function createContact(contact: Contact): Promise<ContactMutationResult> {
  return requestJson<ContactMutationResult>('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  });
}

export function updateContactGroups(contactId: string, groupIds: string[]): Promise<ContactMutationResult> {
  return updateContact(contactId, { groupIds });
}

export function updateContact(contactId: string, data: UpdateContactPayload): Promise<ContactMutationResult> {
  return requestJson<ContactMutationResult>(`/api/contacts?id=${encodeURIComponent(contactId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateContactConsent(
  contactId: string,
  consentStatus: ContactConsentStatus,
): Promise<ContactMutationResult> {
  return requestJson<ContactMutationResult>(`/api/contacts?id=${encodeURIComponent(contactId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consentStatus }),
  });
}

export function deleteContact(contactId: string): Promise<DeleteContactResult> {
  return requestJson<DeleteContactResult>(`/api/contacts?id=${encodeURIComponent(contactId)}`, {
    method: 'DELETE',
  });
}

export function clearContacts(): Promise<ClearContactsResult> {
  return requestJson<ClearContactsResult>('/api/contacts', { method: 'DELETE' });
}

export function createGroup(group: ContactGroupCommand): Promise<GroupMutationResult> {
  return requestJson<GroupMutationResult>('/api/contact-groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  });
}

export function deleteGroup(groupId: string): Promise<DeleteGroupResult> {
  return requestJson<DeleteGroupResult>(`/api/contact-groups?id=${encodeURIComponent(groupId)}`, {
    method: 'DELETE',
  });
}

export function updateGroupAppearance(
  groupId: string,
  data: { color: GroupColor; icon: GroupIcon },
): Promise<GroupMutationResult> {
  return requestJson<GroupMutationResult>(`/api/contact-groups?id=${encodeURIComponent(groupId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function importContacts(group: ContactGroupCommand | undefined, contacts: Contact[]): Promise<ImportContactsResult> {
  return requestJson<ImportContactsResult>('/api/contacts/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group, contacts }),
  });
}
