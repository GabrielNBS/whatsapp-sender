'use client';

import { useEffect, useState } from 'react';
import { templatesApi, TemplateCatalogItem } from '@/services/templates/templatesApi';

export function useTemplateCatalog() {
  const [templates, setTemplates] = useState<TemplateCatalogItem[]>([]);

  useEffect(() => {
    let canceled = false;
    const fetchTemplates = async () => {
      try {
        const data = await templatesApi.listCatalog();
        if (!canceled) setTemplates(data);
      } catch (error) {
        console.error('Falha ao buscar modelos', error);
      }
    };

    void fetchTemplates();

    // Ouvir eventos de atualização de templates disparados por outros componentes
    const handleUpdate = () => {
      fetchTemplates();
    };

    window.addEventListener('templates-updated', handleUpdate);

    return () => {
      canceled = true;
      window.removeEventListener('templates-updated', handleUpdate);
    };
  }, []);

  return {
    templates,
    loadTemplate: templatesApi.getTemplate,
  };
}
