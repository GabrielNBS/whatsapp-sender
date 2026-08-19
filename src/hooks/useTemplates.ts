import { useState, useEffect, useCallback, useRef } from 'react';
import { Template } from '@/types/templates';
import { templatesApi } from '@/services/templates/templatesApi';
import type { FeedbackPort } from '@/presentation/feedback';
import { useTemplateRevisionStore } from '@/stores/template-revision-store';

export function useTemplates(feedback: FeedbackPort) {
  const markTemplatesChanged = useTemplateRevisionStore((state) => state.markChanged);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Rastreia quais IDs de template estão em processo de exclusão (DELETE-002)
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});

  const activeRequest = useRef<AbortController | null>(null);

  const fetchTemplates = useCallback(async () => {
    // Cancela requisição anterior se houver (API-005)
    if (activeRequest.current) {
      activeRequest.current.abort();
    }

    const controller = new AbortController();
    activeRequest.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await templatesApi.listTemplates(controller.signal);
      setTemplates(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        if (process.env.NODE_ENV === 'development') {
          console.error('Falha ao obter templates:', err);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    setDeletingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await templatesApi.deleteTemplate(id);
      
      // Só remove do estado local após o sucesso do DELETE (API-004)
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      feedback.success('Modelo excluído com sucesso');
      
      markTemplatesChanged();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir modelo';
      feedback.error(msg);
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao excluir template:', err);
      }
      return false;
    } finally {
      setDeletingIds((prev) => ({ ...prev, [id]: false }));
    }
  }, [feedback, markTemplatesChanged]);

  // Notificação centralizada após salvar um template (ASYNC-001)
  const handleSaveSuccess = useCallback(async () => {
    await fetchTemplates();
    markTemplatesChanged();
  }, [fetchTemplates, markTemplatesChanged]);

  useEffect(() => {
    fetchTemplates();
    return () => {
      if (activeRequest.current) {
        activeRequest.current.abort();
      }
    };
  }, [fetchTemplates]);

  return {
    templates,
    isLoading,
    error,
    deletingIds,
    fetchTemplates,
    deleteTemplate,
    handleSaveSuccess,
  };
}
export default useTemplates;
