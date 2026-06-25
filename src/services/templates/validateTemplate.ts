import { Template, TemplateMedia } from '@/types/templates';
import { MAX_CATEGORY_LENGTH } from '@/constants/templates';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valida a integridade estrutural e de tamanho de um template antes de salvar.
 */
export function validateTemplate(
  title: string,
  content: string,
  category?: string | null,
  media?: TemplateMedia | null
): ValidationResult {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { isValid: false, error: 'O título do modelo é obrigatório' };
  }

  if (trimmedTitle.length > 50) {
    return { isValid: false, error: 'O título deve ter no máximo 50 caracteres' };
  }

  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { isValid: false, error: 'O conteúdo da mensagem é obrigatório' };
  }

  if (trimmedContent.length > 1024) {
    return { isValid: false, error: 'O conteúdo da mensagem deve ter no máximo 1024 caracteres' };
  }

  if (category) {
    const trimmedCategory = category.trim();
    if (trimmedCategory.length > MAX_CATEGORY_LENGTH) {
      return {
        isValid: false,
        error: `A categoria deve ter no máximo ${MAX_CATEGORY_LENGTH} caracteres`
      };
    }
  }

  if (media) {
    if (!media.mimetype) {
      return { isValid: false, error: 'O tipo MIME da mídia é obrigatório' };
    }
    if (!media.data) {
      return { isValid: false, error: 'Os dados do arquivo de mídia estão ausentes' };
    }
  }

  return { isValid: true };
}
export default validateTemplate;
