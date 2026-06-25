import { Template } from '@/types/templates';
import { parseTemplateMedia } from './parseTemplateMedia';

/**
 * Normaliza os atributos de um template recebido da API para consumo seguro na UI.
 */
export function normalizeTemplate(rawTemplate: any): Template {
  // Trata categoria (trim e capitalize)
  let normalizedCategory = null;
  if (rawTemplate.category) {
    const trimmed = rawTemplate.category.trim();
    if (trimmed) {
      normalizedCategory = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }
  }

  // Mapeia data com fallback para "Data indisponível" (DATE-001)
  let formattedDate = 'Data indisponível';
  if (rawTemplate.createdAt) {
    try {
      const date = new Date(rawTemplate.createdAt);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {}
  }

  // Pre-parse de mídia para evitar rodar JSON.parse no loop de renderização (PERF-003)
  const parsedMedia = parseTemplateMedia(rawTemplate.media);

  return {
    id: String(rawTemplate.id),
    title: rawTemplate.title || 'Sem título',
    content: rawTemplate.content || '',
    media: rawTemplate.media || null,
    parsedMedia,
    category: normalizedCategory,
    createdAt: formattedDate,
    updatedAt: rawTemplate.updatedAt || undefined,
  };
}

/**
 * Normaliza uma lista inteira de templates.
 */
export function normalizeTemplates(rawTemplates: any[]): Template[] {
  if (!Array.isArray(rawTemplates)) return [];
  return rawTemplates.map(normalizeTemplate);
}
