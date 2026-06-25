import { TemplateMedia } from '@/types/templates';

/**
 * Tenta converter a string JSON de mídia em um objeto estruturado TemplateMedia.
 * Retorna nulo e registra erro caso ocorra uma falha de parse.
 */
export function parseTemplateMedia(mediaString?: string | null): TemplateMedia | null {
  if (!mediaString) return null;

  try {
    const parsed = JSON.parse(mediaString);
    
    // Validação estrutural básica da mídia
    if (parsed && typeof parsed === 'object' && 'mimetype' in parsed && 'data' in parsed) {
      return {
        mimetype: parsed.mimetype,
        data: parsed.data,
        filename: parsed.filename || 'Arquivo de mídia',
      };
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falha ao processar JSON de mídia do template:', error);
    }
  }

  return null;
}
export default parseTemplateMedia;
