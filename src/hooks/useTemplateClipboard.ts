import { useState, useCallback } from 'react';
import type { FeedbackPort } from '@/presentation/feedback';

export function useTemplateClipboard(feedback: FeedbackPort) {
  const [isCopying, setIsCopying] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    if (!navigator.clipboard) {
      feedback.error('Área de transferência não suportada pelo navegador.');
      return;
    }

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      feedback.success('Conteúdo copiado com sucesso!');
    } catch (err: unknown) {
      feedback.error('Falha ao copiar conteúdo.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Falha ao copiar para o clipboard:', err);
      }
    } finally {
      setIsCopying(false);
    }
  }, [feedback]);

  return { copyToClipboard, isCopying };
}
export default useTemplateClipboard;
