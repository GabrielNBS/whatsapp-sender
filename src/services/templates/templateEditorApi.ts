import { requestJson } from '@/services/http/client';

export interface TemplateEditorSettings {
  defaultLink?: string | null;
  defaultCTA?: string | null;
}

export interface TemplateSnippet {
  id: string;
  trigger: string;
  content: string;
}

export const templateEditorApi = {
  async getInitialContent(): Promise<{ settings: TemplateEditorSettings; snippets: TemplateSnippet[] }> {
    const [settings, snippets] = await Promise.all([
      requestJson<TemplateEditorSettings>('/api/settings', { cache: 'no-store' }),
      requestJson<TemplateSnippet[]>('/api/snippets', { cache: 'no-store' }),
    ]);

    return { settings, snippets };
  },
};
