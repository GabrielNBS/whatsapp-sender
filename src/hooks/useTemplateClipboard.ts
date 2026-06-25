import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useTemplateClipboard() {
  const [isCopying, setIsCopying] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    if (!navigator.clipboard) {
      toast.error('Área de transferência não suportada pelo navegador.');
      return;
    }

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Conteúdo copiado com sucesso!');
    } catch (err: unknown) {
      toast.error('Falha ao copiar conteúdo.');
      if (process.env.NODE_ENV === 'development') {
        console.error('Falha ao copiar para o clipboard:', err);
      }
    } finally {
      setIsCopying(false);
    }
  }, []);

  return { copyToClipboard, isCopying };
}
export default useTemplateClipboard;
