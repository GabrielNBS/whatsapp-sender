import { Contact } from '@/lib/types';
import { normalizePhone } from './normalizePhone';

interface DedupeResult {
  uniqueContacts: Omit<Contact, 'id'>[];
  duplicateCount: number;
}

/**
 * Deduplica uma lista de novos contatos baseando-se no telefone normalizado,
 * e também remove aqueles que já existem na base atual.
 */
export function dedupeContacts(
  newContacts: Omit<Contact, 'id'>[],
  existingContacts: Contact[]
): DedupeResult {
  const existingNumbers = new Set(existingContacts.map((c) => normalizePhone(c.number)));
  const uniqueNumbers = new Set<string>();
  const uniqueContacts: Omit<Contact, 'id'>[] = [];
  let duplicateCount = 0;

  for (const contact of newContacts) {
    const norm = normalizePhone(contact.number);
    
    // Verifica se já está cadastrado no sistema ou se está duplicado no próprio CSV
    if (existingNumbers.has(norm) || uniqueNumbers.has(norm)) {
      duplicateCount++;
      continue;
    }

    uniqueNumbers.add(norm);
    uniqueContacts.push({
      ...contact,
      number: norm, // Garante que o telefone importado está normalizado
    });
  }

  return {
    uniqueContacts,
    duplicateCount,
  };
}
