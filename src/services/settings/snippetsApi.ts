import { requestJson } from '@/services/http/client';

export interface Snippet {
  id: string;
  trigger: string;
  content: string;
}

export const snippetsApi = {
  list: () => requestJson<Snippet[]>('/api/snippets', { cache: 'no-store' }),
  create: (payload: Pick<Snippet, 'trigger' | 'content'>) => requestJson<Snippet>('/api/snippets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  remove: (id: string) => requestJson<{ success: boolean }>(
    `/api/snippets?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  ),
};
