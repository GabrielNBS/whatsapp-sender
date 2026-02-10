"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea"; // Removed
import { SmartTextarea } from "@/components/ui/smart-textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileText, Image as ImageIcon, Plus, Trash2, Smartphone, Save, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { WhatsAppMockup } from "./whatsapp-mockup";

interface Template {
  id: string;
  title: string;
  content: string;
  media?: string | null;
  category?: string | null;
}

interface TemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSave: () => void;
  isDuplicate?: boolean;
}

export function TemplateSheet({
  open,
  onOpenChange,
  template,
  onSave,
  isDuplicate = false,
}: TemplateSheetProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<{
    data: string;
    mimetype: string;
    filename: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [includeFooter, setIncludeFooter] = useState(false);
  const [settings, setSettings] = useState({ link: '', cta: '' });
  const [snippets, setSnippets] = useState<{id: string, trigger: string, content: string}[]>([]);

  // Fetch settings and snippets on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({ link: data.defaultLink || '', cta: data.defaultCTA || '' });
      })
      .catch(err => console.error('Failed to load settings', err));

    fetch('/api/snippets')
      .then(res => res.json())
      .then(data => setSnippets(data))
      .catch(err => console.error('Failed to load snippets', err));
  }, []);

  useEffect(() => {
    if (template) {
      setTitle(isDuplicate ? `${template.title} (Cópia)` : template.title);
      setCategory(template.category || "");
      
      let cleanContent = template.content;
      let hasFooter = false;

      // Check if content ends with the current footer settings
      if (settings.link || settings.cta) {
        const footerText = `\n\n${settings.cta}\n${settings.link}`.trim();
        if (footerText && template.content.endsWith(footerText)) {
             cleanContent = template.content.slice(0, -footerText.length).trimEnd();
             hasFooter = true;
        }
      }
      
      setContent(cleanContent);
      setIncludeFooter(hasFooter);

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
      setCategory("");
      setContent("");
      setSelectedFile(null);
      setIncludeFooter(false);
    }
  }, [template, open, settings.link, settings.cta, isDuplicate]);

  const handleToggleFooter = (checked: boolean) => {
    if (checked && !settings.link && !settings.cta) {
        toast.error("Configure o link e CTA padrão nas configurações primeiro.");
        return;
    }
    setIncludeFooter(checked);
  };

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
    if (!title || !content) {
        toast.warning("Preencha título e mensagem");
        return;
    }
    setIsSaving(true);
    
    // Append footer if enabled
    let finalContent = content;
    if (includeFooter && (settings.link || settings.cta)) {
        const footerText = `\n\n${settings.cta}\n${settings.link}`.trim();
        finalContent = `${content}\n\n${footerText}`;
    }

    try {
      const isEditing = template && !isDuplicate;
      const url = isEditing ? "/api/templates" : "/api/templates";
      const method = isEditing ? "PUT" : "POST";
      const body = {
        id: isEditing ? template?.id : undefined, 
        title: isDuplicate ? `${title} (Cópia)` : title,
        content: finalContent,
        media: selectedFile,
        category // Include category in payload
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
      <SheetContent className="sm:max-w-[1200px] w-[90vw] p-0 gap-0 flex flex-col h-full ">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
            <SheetHeader className="text-left space-y-1">
                <SheetTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                {template && !isDuplicate ? "Editar Modelo" : "Novo Modelo"}
                </SheetTitle>
                <SheetDescription className="text-xs">
                Configure o conteúdo e visualize como ficará no WhatsApp.
                </SheetDescription>
            </SheetHeader>
            <div className="flex items-center gap-3">
                 <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
                 <Button onClick={handleSaveInternal} disabled={isSaving} size="sm" className="bg-blue-600 hover:bg-blue-700 min-w-[100px]">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Salvar</>}
                 </Button>
            </div>
        </div>

        {/* Content Area - 2 Columns */}
        <div className="flex-1 overflow-hidden">
            <div className="grid md:grid-cols-[1fr_400px] h-full">
                
                {/* Left Column: Editor */}
                <div className="flex flex-col h-full bg-white/50 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        
                        {/* 1. Header Inputs (Compact) */}
                        <div className="grid grid-cols-[2fr_1fr] gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="sheet-title" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Título</Label>
                                <Input 
                                    id="sheet-title" 
                                    placeholder="Ex: Promoção de Natal" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    className="bg-white border-gray-200 focus-visible:ring-blue-500/20 font-medium h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sheet-category" className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Categoria
                                </Label>
                                <Input 
                                    id="sheet-category" 
                                    placeholder="Ex: Vendas..." 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)} 
                                    className="bg-white border-gray-200 focus-visible:ring-blue-500/20 h-10"
                                />
                            </div>
                        </div>

                        {/* 2. Media Upload (Visual & Cohesive) */}
                        <div className="bg-white rounded-xl border border-gray-100 p-1 shadow-sm flex items-center gap-3 pr-4">
                             <div className={cn(
                                "w-12 h-12 shrink-0 rounded-lg flex items-center justify-center border border-dashed transition-colors overflow-hidden relative bg-gray-50", 
                                selectedFile ? "border-transparent" : "border-gray-200"
                             )}>
                                {selectedFile ? (
                                    <Image src={`data:${selectedFile.mimetype};base64,${selectedFile.data}`} alt="Preview" fill className="object-cover" unoptimized />
                                ) : (
                                    <ImageIcon className="w-5 h-5 text-gray-400" />
                                )}
                             </div>
                             
                             <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                    {selectedFile ? selectedFile.filename : "Mídia do Cabeçalho"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedFile ? "Imagem carregada" : "Opcional • JPG/PNG"}
                                </p>
                             </div>

                             <div className="flex items-center gap-2">
                                <Label htmlFor="media-upload-sheet" className="cursor-pointer text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors">
                                    {selectedFile ? "Trocar" : "Escolher Arquivo"}
                                </Label>
                                {selectedFile && (
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)} className="h-8 w-8 text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                             </div>
                             <Input id="media-upload-sheet" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </div>

                        {/* 3. Message Editor (Primary Focus) */}
                        <div className="space-y-3 flex-1 flex flex-col min-h-[300px]">
                            <div className="flex items-center justify-between">
                                 <Label htmlFor="sheet-content" className="text-sm font-semibold text-gray-700">Mensagem</Label>
                                 <div className="flex gap-1.5">
                                    <button
                                        onClick={() => setContent((prev) => prev + " {{name}} ")}
                                        className="bg-white border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide transition-all flex items-center gap-1 shadow-sm"
                                    >
                                        <Plus className="w-3 h-3" /> Nome
                                    </button>
                                    <button
                                        onClick={() => setContent((prev) => prev + " {{phone}} ")}
                                        className="bg-white border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide transition-all flex items-center gap-1 shadow-sm"
                                    >
                                        <Plus className="w-3 h-3" /> Tel
                                    </button>
                                </div>
                            </div>

                            <div className="relative group flex-1 rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all shadow-sm flex flex-col">
                                <SmartTextarea
                                    id="sheet-content"
                                    placeholder="Digite sua mensagem aqui... Use '/' para snippets ou '{' para variáveis."
                                    className={cn(
                                        "bg-transparent border-0 focus-visible:ring-0 shadow-none resize-none px-4 py-4 text-base leading-relaxed z-10 relative flex-1 min-h-[200px]",
                                        includeFooter ? "pb-24" : "pb-4"
                                    )}
                                    value={content}
                                    onValueChange={setContent}
                                    snippets={snippets}
                                />
                                
                                {/* Visual Ghost Footer */}
                                {includeFooter && (
                                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dashed border-gray-100 bg-gray-50/50 rounded-b-xl text-xs text-muted-foreground pointer-events-none select-none">
                                        <div className="flex items-center gap-2 mb-1.5 opacity-70">
                                            <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">Rodapé Automático</span>
                                        </div>
                                        {settings.cta && <p className="whitespace-pre-wrap font-medium text-gray-600">{settings.cta}</p>}
                                        {settings.link && <p className="text-blue-500 underline mt-0.5">{settings.link}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Footer Toggle (Fixed at bottom of left column) */}
                    <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="include-footer" className="text-sm font-medium cursor-pointer text-gray-700">
                                Incluir Rodapé Padrão
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                {settings.link ? "Link e CTA configurados serão adicionados." : "Configure nas opções gerais."}
                                </p>
                            </div>
                            <Switch 
                                id="include-footer"
                                checked={includeFooter}
                                onCheckedChange={handleToggleFooter}
                                disabled={!settings.link && !settings.cta}
                            />
                        </div>
                    </div>

                </div>

                {/* Right Column: Preview */}
                <div className="bg-[#efe7dd] border-l border-gray-200 p-6 flex flex-col items-center justify-center overflow-y-auto md:flex relative">
                    {/* Wallpaper Pattern */}
                    <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] pointer-events-none opacity-[0.06]"></div>

                    <div className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 font-medium text-xs uppercase tracking-wider z-10">
                        <Smartphone className="w-4 h-4" />
                        Preview Real
                    </div>
                    
                    <div className="w-full max-w-[420px] mx-auto">
                        <WhatsAppMockup 
                             content={content} 
                             media={selectedFile} 
                             footer={settings}
                             showFooter={includeFooter}
                        />
                    </div>
                    
                    <p className="text-center text-xs text-gray-400 mt-6 max-w-[250px]">
                        Esta é uma simulação visual. A aparência final pode variar dependendo do dispositivo do usuário.
                    </p>
                </div>

            </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}
