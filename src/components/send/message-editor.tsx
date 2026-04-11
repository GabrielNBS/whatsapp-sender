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
      "bg-card rounded-2xl shadow-sm border border-border flex flex-col h-full overflow-hidden transition-all duration-300",
      disabled && "opacity-60 pointer-events-none"
    )}>
      {/* Toolbar - Pill-shaped buttons as per reference */}
      <div className="px-3 md:px-5 py-3 md:py-4 flex flex-wrap gap-2 items-center bg-background border-b border-border/50">
        
        {templateSlot && (
          <div className="mr-auto pr-2">
            {templateSlot}
          </div>
        )}
        
        <div className="flex bg-muted/30 p-1 rounded-full border border-border/50 gap-1 overflow-x-auto no-scrollbar">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-[11px] font-bold gap-1.5 hover:bg-background hover:shadow-sm"
                disabled={disabled}
              >
                <Smile className="w-3.5 h-3.5" />
                Emojis
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="start" 
              className="w-[calc(100vw-2rem)] sm:w-72 p-0 shadow-xl border-border overflow-hidden rounded-xl"
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
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-primary/10 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
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
            className="h-8 rounded-full px-3 text-[11px] font-bold gap-1.5 hover:bg-background hover:shadow-sm"
            onClick={() => insertVariable('variavel')}
            disabled={disabled}
          >
            <Variable className="w-3.5 h-3.5" />
            Variabeles
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-[11px] font-bold gap-1.5 hover:bg-background hover:shadow-sm"
            onClick={() => insertVariable('nome')}
            disabled={disabled}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Nome
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-[11px] font-bold gap-1.5 hover:bg-background hover:shadow-sm"
            onClick={() => insertVariable('data')}
            disabled={disabled}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Data
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative group min-h-0">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="w-full h-full border-0 resize-none p-6 text-base focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/50 leading-relaxed font-roboto"
          placeholder="Escreva sua mensagem aqui..."
          disabled={disabled}
        />
      </div>

      {/* Media Attachment Area */}
      <div className="p-4 border-t border-border/50 bg-muted/10">
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
            <div className="min-w-0 max-w-[200px]">
              <p className="text-xs font-bold text-foreground truncate">
                {selectedFile.filename}
              </p>
              <p className="text-[10px] text-muted-foreground">Imagem anexada</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2 rounded-full"
              onClick={() => onFileChange(null)}
              disabled={disabled}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled}
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 h-9 bg-background border-dashed text-muted-foreground hover:text-primary hover:border-primary/50 text-xs font-bold"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={disabled}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Adicionar Imagem
            </Button>
            <span className="text-[10px] text-muted-foreground font-medium italic">
              PNG ou JPG até 5MB
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
