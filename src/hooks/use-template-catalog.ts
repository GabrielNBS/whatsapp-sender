'use client';

import { useEffect, useState } from 'react';
import { templatesApi, TemplateCatalogItem } from '@/services/templates/templatesApi';
import { useTemplateRevisionStore } from '@/stores/template-revision-store';

export function useTemplateCatalog() {
  const templateRevision = useTemplateRevisionStore((state) => state.revision);
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

    return () => {
      canceled = true;
    };
  }, [templateRevision]);

  return {
    templates,
    loadTemplate: templatesApi.getTemplate,
  };
}
