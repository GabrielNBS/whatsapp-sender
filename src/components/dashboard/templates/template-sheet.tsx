"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  title: string;
  content: string;
  media?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSave: () => void;
}

export function TemplateSheet({
  open,
  onOpenChange,
  template,
  onSave,
}: TemplateSheetProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<{
    data: string;
    mimetype: string;
    filename: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setContent(template.content);
      if (template.media) {
        try {
          setSelectedFile(JSON.parse(template.media));
        } catch {
          setSelectedFile(null);
        }
      } else {
        setSelectedFile(null);
      }
    } else {
      setTitle("");
      setContent("");
      setSelectedFile(null);
    }
  }, [template, open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result as string;
        const parts = base64Data.split(",");
        if (parts.length === 2) {
          setSelectedFile({
            data: parts[1],
            mimetype: file.type,
            filename: file.name,
          });
        }
      };
    }
  };

  const handleSaveInternal = async () => {
    if (!title || !content) return;
    setIsSaving(true);
    try {
      const url = template ? "/api/templates" : "/api/templates";
      const method = template ? "PUT" : "POST";
      const body = {
        id: template?.id, // Ignored by POST
        title,
        content,
        media: selectedFile,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(
          template
            ? "Modelo atualizado com sucesso"
            : "Modelo criado com sucesso"
        );
        onOpenChange(false);
        onSave();
      }
    } catch (error) {
      console.error("Failed to save", error);
      toast.error("Erro ao salvar modelo");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl p-0 gap-0 overflow-y-auto w-full">
        {/* Media Header / Upload Area */}
        <div className="relative w-full aspect-video bg-gray-50 group border-b border-gray-100">
          <label
            htmlFor="media-upload-sheet"
            className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 transition-colors"
          >
            {selectedFile ? (
              <>
                <Image
                  src={`data:${selectedFile.mimetype};base64,${selectedFile.data}`}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Trocar imagem
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">Adicionar Capa</span>
              </div>
            )}
          </label>
          <Input
            id="media-upload-sheet"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="p-6 space-y-6">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              {template ? "Editar Modelo" : "Novo Modelo"}
            </SheetTitle>
            <SheetDescription>
              Preencha os dados do seu modelo de mensagem.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="sheet-title"
                className="text-xs uppercase font-bold text-gray-500 tracking-wider"
              >
                Título
              </Label>
              <Input
                id="sheet-title"
                placeholder="Ex: Confirmação de Pedido"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-50 border-gray-200 rounded-xl px-4 py-6 text-base focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="sheet-content"
                className="text-xs uppercase font-bold text-gray-500 tracking-wider"
              >
                Mensagem
              </Label>
              <div className="relative">
                <Textarea
                  id="sheet-content"
                  placeholder="Digite sua mensagem aqui..."
                  className="h-[200px] bg-gray-50 border-gray-200 rounded-xl px-4 py-3 resize-none focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-sm leading-relaxed"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="flex gap-2 text-xs pt-1">
                <button
                  onClick={() => setContent((prev) => prev + " {{name}} ")}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-medium transition-colors text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Nome
                </button>
                <button
                  onClick={() => setContent((prev) => prev + " {{phone}} ")}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-medium transition-colors text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Telefone
                </button>
              </div>
            </div>
          </div>

          <SheetFooter className="gap-2 sm:justify-between w-full mt-auto pt-6 border-t border-gray-100">
             {/* Using flex-col-reverse and w-full to match the mobile-first sheet footer, but ensure buttons are visible */}
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl hover:bg-gray-100 text-gray-600 font-medium w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveInternal}
              disabled={isSaving}
              className="rounded-xl bg-blue-500 hover:bg-blue-600 font-bold px-6 shadow-sm shadow-blue-500/20 w-full sm:w-auto"
            >
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
