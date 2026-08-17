import { Template } from '@/types/templates';
import { normalizeTemplates, RawTemplate } from './normalizeTemplate';
import { requestJson } from '@/services/http/client';

export interface TemplateCatalogItem {
  id: string;
  title: string;
}

export interface TemplatePayload {
  title: string;
  content: string;
  media?: { mimetype: string; data: string; filename?: string } | null;
  category?: string | null;
}

/**
 * templatesApi - Funções para interagir com o endpoint de templates.
 */
export const templatesApi = {
  /**
   * Obtém a lista completa de templates da API,
   * aplicando normalizações e verificando erros de requisição.
   */
  async listTemplates(signal?: AbortSignal): Promise<Template[]> {
    const data = await requestJson<RawTemplate[]>('/api/templates', {
      cache: 'no-store',
      signal,
    });
    
    // Validação estrutural básica (API-003)
    if (!Array.isArray(data)) {
      throw new Error('Formato de resposta inválido recebido da API de modelos');
    }

    return normalizeTemplates(data);
  },

  async listCatalog(signal?: AbortSignal): Promise<TemplateCatalogItem[]> {
    return requestJson<TemplateCatalogItem[]>('/api/templates?view=summary', {
      cache: 'no-store',
      signal,
    });
  },

  async getTemplate(id: string, signal?: AbortSignal): Promise<Template> {
    const data = await requestJson<RawTemplate>(`/api/templates/${encodeURIComponent(id)}`, { signal });
    return normalizeTemplates([data])[0];
  },

  async saveTemplate(id: string | null, payload: TemplatePayload): Promise<Template> {
    const data = await requestJson<RawTemplate>(
      id ? `/api/templates/${encodeURIComponent(id)}` : '/api/templates',
      {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    return normalizeTemplates([data])[0];
  },

  /**
   * Exclui um template pelo seu ID.
   */
  async deleteTemplate(id: string): Promise<boolean> {
    await requestJson(`/api/templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return true;
  },
};
export default templatesApi;
