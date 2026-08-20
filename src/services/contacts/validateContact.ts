import { Contact, Group } from '@/lib/types';
import { normalizePhone } from './normalizePhone';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ContactFieldErrors {
  [key: string]: string | undefined;
  name?: string;
  number?: string;
  groupIds?: string;
}

export function validateContactFields(
  name: string,
  number: string,
  groupIds: string[],
  existingContacts: Contact[],
  existingGroups: Group[],
  currentContactId?: string,
): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  const trimmedName = name.trim();
  const normalized = normalizePhone(number);

  if (!trimmedName) {
    errors.name = 'Como devemos chamar este contato?';
  } else if (trimmedName.length > 100) {
    errors.name = 'Esse nome passou de 100 caracteres. Que tal encurtá-lo?';
  }

  if (!normalized) {
    errors.number = 'Digite o telefone com DDD — por exemplo, (11) 99999-9999.';
  } else if (normalized.length < 10 || normalized.length > 15) {
    errors.number = 'Confira o DDD e complete os 10 ou 11 dígitos.';
  }

  if (groupIds.length === 0) {
    errors.groupIds = 'Escolha ao menos um grupo para organizar este contato.';
  } else if (groupIds.some((groupId) => !existingGroups.some((group) => group.id === groupId))) {
    errors.groupIds = 'Um dos grupos não está mais disponível. Escolha outro.';
  }

  if (
    normalized &&
    existingContacts.some(
      (contact) => normalizePhone(contact.number) === normalized && contact.id !== currentContactId,
    )
  ) {
    errors.number = 'Esse número já pertence a outro contato.';
  }

  return errors;
}

/**
 * Valida os dados de um contato que está sendo criado ou editado.
 */
export function validateContact(
  name: string,
  number: string,
  groupIds: string[],
  existingContacts: Contact[],
  existingGroups: Group[],
  currentContactId?: string
): ValidationResult {
  const errors = validateContactFields(
    name,
    number,
    groupIds,
    existingContacts,
    existingGroups,
    currentContactId,
  );
  const error = errors.name || errors.number || errors.groupIds;

  return error ? { isValid: false, error } : { isValid: true };
}
