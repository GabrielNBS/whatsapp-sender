export interface TemplateMedia {
  mimetype: string;
  data: string; // base64 string
  filename?: string;
}

export interface Template {
  id: string;
  title: string;
  content: string;
  media?: string | null; // Armazenado no banco como string JSON (ou nulo)
  parsedMedia?: TemplateMedia | null; // Mapeado no fetch
  category?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type TemplateFilterType = 'all' | 'media' | 'text';
