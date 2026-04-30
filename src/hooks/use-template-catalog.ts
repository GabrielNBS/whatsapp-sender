'use client';

import { useEffect, useState } from 'react';
import type { Template } from '@/lib/types';

export function useTemplateCatalog(): Template[] {
  const [templates, setTemplates] = useState<Template[]>([]);

  const fetchTemplates = async () => {
    try {
      // Adiciona timestamp para evitar cache do navegador/Next.js
      const response = await fetch(`/api/templates?_t=${Date.now()}`);
      if (!response.ok) {
        return;
      }

      const data: Template[] = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Falha ao buscar modelos', error);
    }
  };

  useEffect(() => {
    fetchTemplates();

    // Ouvir eventos de atualização de templates disparados por outros componentes
    const handleUpdate = () => {
      fetchTemplates();
    };

    window.addEventListener('templates-updated', handleUpdate);

    // Polling opcional como redundância (cada 15 segundos)
    const interval = setInterval(fetchTemplates, 15000);

    return () => {
      window.removeEventListener('templates-updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  return templates;
}
