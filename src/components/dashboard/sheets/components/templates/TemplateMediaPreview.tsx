import { ImageIcon } from 'lucide-react';
import { TemplateMedia } from '@/types/templates';

interface TemplateMediaPreviewProps {
  media: TemplateMedia | null | undefined;
  templateTitle: string;
}

export function TemplateMediaPreview({
  media,
  templateTitle,
}: TemplateMediaPreviewProps) {
  if (!media) {
    return (
      <div className="relative w-full h-48 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-zinc-150 dark:border-zinc-800">
        <div className="flex flex-col items-center gap-2 opacity-50">
          <ImageIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-650" />
          <span className="text-xs font-medium text-zinc-500">Sem mídia</span>
        </div>
      </div>
    );
  }

  const src = `data:${media.mimetype};base64,${media.data}`;

  return (
    <div className="relative w-full h-48 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
      {/* 
        Usamos img nativa para data URLs base64 para evitar avisos de 
        otimização e limites de tamanho em requisições de otimização de imagens (MEDIA-004)
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Mídia associada ao modelo: ${templateTitle}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Trata falha no carregamento dos dados da imagem
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            const fallback = parent.querySelector('.media-fallback');
            if (fallback) fallback.classList.remove('hidden');
          }
        }}
      />
      
      {/* Fallback de erro de renderização da mídia */}
      <div className="media-fallback hidden absolute inset-0 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <ImageIcon className="w-8 h-8 text-red-400 mb-1" />
        <span className="text-xs text-red-500 font-medium">Mídia inválida ou corrompida</span>
      </div>

      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 shadow">
        <ImageIcon className="w-3 h-3 text-zinc-300" />
        <span className="truncate max-w-[150px] font-medium">
          {media.filename || 'Arquivo de mídia'}
        </span>
      </div>
    </div>
  );
}
export default TemplateMediaPreview;
