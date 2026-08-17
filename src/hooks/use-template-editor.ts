'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { templateEditorApi, type TemplateSnippet } from '@/services/templates/templateEditorApi';
import { templatesApi } from '@/services/templates/templatesApi';
import type { Template, TemplateMedia } from '@/types/templates';

interface UseTemplateEditorOptions {
  open: boolean;
  template: Template | null;
  isDuplicate: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function useTemplateEditor({
  open,
  template,
  isDuplicate,
  onClose,
  onSave,
}: UseTemplateEditorOptions) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<TemplateMedia | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [includeFooter, setIncludeFooter] = useState(false);
  const [settings, setSettings] = useState({ link: '', cta: '' });
  const [snippets, setSnippets] = useState<TemplateSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    let isActive = true;
    let loadingTimer: number | undefined;
    const loadContent = async () => {
      try {
        const { settings: loadedSettings, snippets: loadedSnippets } = await templateEditorApi.getInitialContent();
        if (!isActive) return;
        setSettings({
          link: loadedSettings.defaultLink || '',
          cta: loadedSettings.defaultCTA || '',
        });
        setSnippets(loadedSnippets);
      } catch (error) {
        console.error('Failed to load initial content', error);
      } finally {
        if (isActive) loadingTimer = window.setTimeout(() => setIsLoading(false), 300);
      }
    };

    void loadContent();
    return () => {
      isActive = false;
      if (loadingTimer) window.clearTimeout(loadingTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!template) {
      setTitle('');
      setCategory('');
      setContent('');
      setSelectedFile(null);
      setIncludeFooter(false);
      return;
    }

    setTitle(isDuplicate ? `${template.title} (Cópia)` : template.title);
    setCategory(template.category || '');

    let cleanContent = template.content;
    let hasFooter = false;
    if (settings.link || settings.cta) {
      const footerText = `\n\n${settings.cta}\n${settings.link}`.trim();
      if (footerText && template.content.endsWith(footerText)) {
        cleanContent = template.content.slice(0, -footerText.length).trimEnd();
        hasFooter = true;
      }
    }
    setContent(cleanContent);
    setIncludeFooter(hasFooter);

    if (!template.media) {
      setSelectedFile(null);
      return;
    }
    try {
      setSelectedFile(JSON.parse(template.media) as TemplateMedia);
    } catch {
      setSelectedFile(null);
    }
  }, [isDuplicate, open, settings.cta, settings.link, template]);

  const toggleFooter = (checked: boolean) => {
    if (checked && !settings.link && !settings.cta) {
      toast.error('Configure o link e CTA padrão nas configurações primeiro.');
      return;
    }
    setIncludeFooter(checked);
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const [, data] = String(reader.result).split(',');
      if (!data) return;
      setSelectedFile({ data, mimetype: file.type, filename: file.name });
    };
    reader.readAsDataURL(file);
  };

  const appendVariable = (variable: 'name' | 'phone') => {
    setContent((currentContent) => `${currentContent} {{${variable}}} `);
  };

  const saveTemplate = async () => {
    if (!title || !content) {
      toast.warning('Preencha título e mensagem');
      return;
    }

    setIsSaving(true);
    let finalContent = content;
    if (includeFooter && (settings.link || settings.cta)) {
      const footerText = `\n\n${settings.cta}\n${settings.link}`.trim();
      finalContent = `${content}\n\n${footerText}`;
    }

    try {
      const isEditing = Boolean(template && !isDuplicate);
      await templatesApi.saveTemplate(isEditing && template ? template.id : null, {
        title,
        content: finalContent,
        media: selectedFile,
        category,
      });
      toast.success(isEditing ? 'Modelo atualizado com sucesso' : 'Modelo criado com sucesso');
      onClose();
      onSave();
    } catch (error) {
      console.error('Failed to save', error);
      toast.error('Erro ao salvar modelo');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    appendVariable,
    category,
    content,
    includeFooter,
    isLoading,
    isSaving,
    saveTemplate,
    selectFile,
    selectedFile,
    setCategory,
    setContent,
    setSelectedFile,
    setTitle,
    settings,
    snippets,
    title,
    toggleFooter,
  };
}
