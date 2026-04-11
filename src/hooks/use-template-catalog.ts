'use client';

import { useEffect, useState } from 'react';
import type { Template } from '@/lib/types';

export function useTemplateCatalog(): Template[] {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok || !isMounted) {
          return;
        }

        const data: Template[] = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error('Falha ao buscar modelos', error);
      }
    };

    fetchTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  return templates;
}
