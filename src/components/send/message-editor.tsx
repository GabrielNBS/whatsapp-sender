import {
  Smile,
  Trash2,
  Image as ImageIcon,
  User as UserIcon,
  Calendar as CalendarIcon,
  Variable,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  const insertVariable = (variable: string) => {
    if (disabled) return;
    onMessageChange(message + ` {${variable}}`);
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-[11px] font-bold gap-1.5 hover:bg-background hover:shadow-sm"
            onClick={() => {/* Open emoji picker logic or placeholder */}}
            disabled={disabled}
          >
            <Smile className="w-3.5 h-3.5" />
            Emojis
          </Button>
          
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
