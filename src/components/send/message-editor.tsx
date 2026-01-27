import {
  Bold,
  Italic,
  Smile,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageEditorProps {
  message: string;
  onMessageChange: (message: string) => void;
  selectedFile: { data: string; mimetype: string; filename: string } | null;
  onFileChange: (
    file: { data: string; mimetype: string; filename: string } | null
  ) => void;
}

export function MessageEditor({
  message,
  onMessageChange,
  selectedFile,
  onFileChange,
}: MessageEditorProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col h-full overflow-hidden">
      {/* Toolbar Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/50">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Editor de Mensagem
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary rounded"
            title="Negrito"
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary rounded"
            title="Itálico"
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary rounded"
            title="Emoji"
          >
            <Smile className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative group min-h-0 overflow-hidden">
        <Textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="w-full h-full border-0 resize-none p-4 text-base focus-visible:ring-0 bg-transparent relative overflow-y-auto scrollbar-thin scrollbar-thumb-border"
          placeholder="Digite sua mensagem..."
        />
      </div>

      {/* Media Attachment Area - Bar at bottom */}
      <div className="p-3 border-t border-border bg-muted/20 relative z-20">
        {selectedFile ? (
          <div className="flex items-center gap-3 bg-card border border-primary/20 rounded-lg p-2 pr-4 shadow-sm w-fit">
            <div className="relative w-10 h-10 rounded overflow-hidden bg-muted shrink-0 border border-border">
              <Image
                src={`data:${selectedFile.mimetype};base64,${selectedFile.data}`}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 max-w-[200px]">
              <p className="text-xs font-medium text-foreground truncate">
                {selectedFile.filename}
              </p>
              <p className="text-[10px] text-muted-foreground">Mídia anexada</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2"
              onClick={() => onFileChange(null)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 bg-card border-dashed text-muted-foreground hover:text-primary hover:border-primary/50"
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              <ImageIcon className="w-3.5 h-3.5 mr-2" />
              Adicionar Imagem
            </Button>
            <span className="text-[10px] text-muted-foreground">
              Suporta PNG, JPG (Max 5MB)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
