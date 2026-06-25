import { Group } from '@/lib/types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const RESERVED_NAMES = ['default', 'geral', 'padrao', 'padrão', 'all', 'todos'];

/**
 * Valida os dados de um grupo que está sendo criado.
 */
export function validateGroup(
  name: string,
  existingGroups: Group[]
): ValidationResult {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: 'O nome do grupo é obrigatório' };
  }

  if (trimmedName.length > 30) {
    return { isValid: false, error: 'O nome do grupo deve ter no máximo 30 caracteres' };
  }

  // Verifica nomes reservados
  const lowerName = trimmedName.toLowerCase();
  if (RESERVED_NAMES.includes(lowerName)) {
    return { isValid: false, error: `"${trimmedName}" é um nome reservado e não pode ser usado` };
  }

  // Verifica caracteres especiais inválidos
  const isValidChars = /^[a-zA-Z0-9\sÀ-ÿ\-]+$/.test(trimmedName);
  if (!isValidChars) {
    return { isValid: false, error: 'O nome do grupo contém caracteres inválidos (use apenas letras, números e hifens)' };
  }

  // Verifica duplicidade case-insensitive
  const isDuplicate = existingGroups.some(
    (g) => g.name.toLowerCase().trim() === lowerName
  );
  if (isDuplicate) {
    return { isValid: false, error: 'Já existe um grupo com este nome' };
  }

  return { isValid: true };
}
