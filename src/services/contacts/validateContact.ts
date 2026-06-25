import { Contact, Group } from '@/lib/types';
import { normalizePhone } from './normalizePhone';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
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
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { isValid: false, error: 'O nome do contato é obrigatório' };
  }

  const normalized = normalizePhone(number);
  if (!normalized) {
    return { isValid: false, error: 'O número de telefone é obrigatório' };
  }

  if (normalized.length < 10 || normalized.length > 15) {
    return { isValid: false, error: 'O número deve conter entre 10 e 15 dígitos' };
  }

  // Verifica se todos os grupos existem
  for (const gid of groupIds) {
    const groupExists = existingGroups.some((g) => g.id === gid);
    if (!groupExists) {
      return { isValid: false, error: `O grupo selecionado não existe` };
    }
  }

  // Verifica duplicidade de número
  const isDuplicate = existingContacts.some(
    (c) => c.number === normalized && c.id !== currentContactId
  );
  if (isDuplicate) {
    return { isValid: false, error: 'Este número de telefone já está cadastrado' };
  }

  return { isValid: true };
}
