import {
  Smile,
  Trash2,
  Image as ImageIcon,
  User as UserIcon,
  Calendar as CalendarIcon,
  Variable,
  Briefcase,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const EMOJI_CATEGORIES = [
  {
    id: 'faces',
    label: 'Rostos',
    icon: Smile,
    emojis: ['😊', '😂', '😍', '🥰', '😎', '🤩', '😒', '😔', '😭', '🤔', '🙄', '😤', '😮', '😴', '🥳', '😇', '😜', '🤫', '🤨', '😬']
  },
  {
    id: 'gestures',
    label: 'Gestos',
    icon: UserIcon,
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🫡', '👋', '👏', '🙌', '🙏', '🤝', '💪', '🤳', '✍️', '👇', '👉', '👈']
  },
  {
    id: 'business',
    label: 'Negócios',
    icon: Briefcase,
    emojis: ['✅', '❌', '⚠️', '🚀', '💡', '💰', '✉️', '📞', '📍', '💬', '📅', '⌛', '🔔', '📈', '🏢', '🏷️', '📦']
  },
  {
    id: 'others',
    label: 'Extras',
    icon: Zap,
    emojis: ['🔥', '✨', '🌟', '💯', '🎉', '🎁', '❤️', '💙', '💚', '💛', '💜', '💥', '🎈', '🏆', '🌈', '🌍', '⚡']
  }
];

interface MessageEditorProps {
  message: string;
  onMessageChange: (message: string) => void;
  selectedFile: { data: string; mimetype: string; filename: string } | null;
  onFileChange: (
    file: { data: string; mimetype: string; filename: string } | null
  ) => void;
  disabled?: boolean;
  templateSlot?: React.ReactNode;
}

export function MessageEditor({
  message,
  onMessageChange,
  selectedFile,
  onFileChange,
  disabled = false,
  templateSlot,
}: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = (text: string) => {
    if (disabled || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    
    const newText = currentText.substring(0, start) + text + currentText.substring(end);
    onMessageChange(newText);
    
    // Devolve o foco e seta a posição do cursor após o texto inserido
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertVariable = (variable: string) => {
    insertAtCursor(` {${variable}}`);
  };

  const insertEmoji = (emoji: string) => {
    insertAtCursor(emoji);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result as string;
        const parts = base64Data.split(",");
        if (parts.length === 2) {
          onFileChange({
            data: parts[1],
            mimetype: file.type,
            filename: file.name,
          });
        }
      };
    }
  };

  return (
    <div className={cn(
      "flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-[border-color,box-shadow,opacity] focus-within:border-primary/45 focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--ring)_10%,transparent)]",
      disabled && "opacity-60 pointer-events-none"
    )}>
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/25 px-2.5 py-2 sm:px-3">
        
        {templateSlot && (
          <div className="mr-auto shrink-0">
            {templateSlot}
          </div>
        )}
        
        <div className="no-scrollbar flex min-w-0 gap-1 overflow-x-auto rounded-lg border border-border bg-background p-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-md px-3 text-sm font-semibold hover:bg-accent"
                disabled={disabled}
              >
                <Smile className="w-3.5 h-3.5" />
                Emojis
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="start" 
              className="w-[calc(100vw-2rem)] overflow-hidden rounded-xl border-border p-0 shadow-lg sm:w-72"
            >
              <Tabs defaultValue="faces" className="w-full">
                <TabsList className="w-full h-10 grid grid-cols-4 bg-muted/40 rounded-none border-b border-border/50 p-0">
                  {EMOJI_CATEGORIES.map(cat => (
                    <TabsTrigger 
                      key={cat.id} 
                      value={cat.id}
                      aria-label={`Categoria ${cat.label}`}
                      className="rounded-none h-full data-[state=active]:bg-background data-[state=active]:shadow-none border-r border-border/20 last:border-0"
                    >
                      <cat.icon className="w-3.5 h-3.5" />
                    </TabsTrigger>
                  ))}
                </TabsList>
                {EMOJI_CATEGORIES.map(cat => (
                  <TabsContent key={cat.id} value={cat.id} className="p-3 mt-0">
                    <div 
                      className="grid grid-cols-7 gap-1"
                      role="grid"
                      aria-label={`Grade de emojis de ${cat.label}`}
                    >
                      {cat.emojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => insertEmoji(emoji)}
                          aria-label={emoji}
                          type="button"
                          className="flex size-10 items-center justify-center rounded-lg text-lg transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="ghost"
            size="sm"
            className="rounded-md px-3 text-sm font-semibold hover:bg-accent"
            onClick={() => insertVariable('variavel')}
            disabled={disabled}
          >
            <Variable className="w-3.5 h-3.5" />
            Variáveis
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-md px-3 text-sm font-semibold hover:bg-accent"
            onClick={() => insertVariable('nome')}
            disabled={disabled}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Nome
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-md px-3 text-sm font-semibold hover:bg-accent"
            onClick={() => insertVariable('data')}
            disabled={disabled}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Data
          </Button>
        </div>
      </div>

      <div className="group relative min-h-0 flex-1">
        <label className="sr-only" htmlFor="campaign-message">Mensagem da campanha</label>
        <Textarea
          id="campaign-message"
          ref={textareaRef}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="h-full w-full resize-none rounded-none border-0 bg-transparent p-4 pb-10 text-base leading-relaxed placeholder:text-muted-foreground/80 focus-visible:ring-0 sm:p-5 sm:pb-10"
          placeholder="Escreva sua mensagem…"
          disabled={disabled}
        />
        <span className="pointer-events-none absolute bottom-3 right-4 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground opacity-70 backdrop-blur-sm transition-opacity group-focus-within:opacity-100" aria-hidden="true">
          {message.length} {message.length === 1 ? 'caractere' : 'caracteres'}
        </span>
      </div>

      <div className="border-t border-border/50 bg-muted/10 p-2.5 sm:px-3">
        {selectedFile ? (
          <div className="flex items-center gap-3 bg-background border border-border rounded-xl p-2 pr-4 shadow-sm w-fit">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
              <Image
                src={`data:${selectedFile.mimetype};base64,${selectedFile.data}`}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 max-w-50">
              <p className="text-xs font-bold text-foreground truncate">
                {selectedFile.filename}
              </p>
              <p className="text-xs text-muted-foreground">Imagem anexada</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onFileChange(null)}
              disabled={disabled}
              aria-label={`Remover imagem ${selectedFile.filename}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-dashed bg-background px-3 text-sm font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Adicionar Imagem
            </Button>
            <span className="text-xs text-muted-foreground">
              PNG ou JPG até 5MB
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
