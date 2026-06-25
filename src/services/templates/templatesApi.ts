import { Template } from '@/types/templates';
import { normalizeTemplates } from './normalizeTemplate';

/**
 * templatesApi - Funções para interagir com o endpoint de templates.
 */
export const templatesApi = {
  /**
   * Obtém a lista completa de templates da API,
   * aplicando normalizações e verificando erros de requisição.
   */
  async listTemplates(signal?: AbortSignal): Promise<Template[]> {
    const res = await fetch('/api/templates', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Erro desconhecido');
      throw new Error(`Falha ao buscar modelos: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    
    // Validação estrutural básica (API-003)
    if (!Array.isArray(data)) {
      throw new Error('Formato de resposta inválido recebido da API de modelos');
    }

    return normalizeTemplates(data);
  },

  /**
   * Exclui um template pelo seu ID.
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const res = await fetch(`/api/templates?id=${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Erro desconhecido');
      throw new Error(`Falha ao excluir modelo: ${res.status} - ${errorText}`);
    }

    return true;
  },
};
export default templatesApi;
