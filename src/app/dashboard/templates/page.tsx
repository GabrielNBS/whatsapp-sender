'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
    Plus, 
    Trash2, 
    FileText, 
    Image as ImageIcon, 
    Copy, 
    Send, 
    Pencil, 
    Megaphone
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Template {
    id: string;
    title: string;
    content: string;
    media?: string;
    createdAt?: string;
    updatedAt?: string;
}



export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'media' | 'text'>('all');

    // Edit Mode
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFile, setSelectedFile] = useState<{ data: string, mimetype: string, filename: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64Data = reader.result as string;
                const parts = base64Data.split(',');
                if (parts.length === 2) {
                    setSelectedFile({
                        data: parts[1],
                        mimetype: file.type,
                        filename: file.name
                    });
                }
            };
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setSelectedFile(null);
        setIsOpen(true);
    }

    const handleOpenEdit = (template: Template) => {
        setEditingId(template.id);
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
        setIsOpen(true);
    }

    const handleSave = async () => {
        if (!title || !content) return;
        setIsSaving(true);
        try {
            const url = editingId ? '/api/templates' : '/api/templates';
            const method = editingId ? 'PUT' : 'POST';
            const body = {
                id: editingId, // Ignored by POST
                title,
                content,
                media: selectedFile
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsOpen(false);
                setTitle('');
                setContent('');
                setSelectedFile(null);
                setEditingId(null);
                fetchTemplates();
                toast.success(editingId ? "Modelo atualizado com sucesso" : "Modelo criado com sucesso");
            }
        } catch (error) {
            console.error('Failed to save', error);
            toast.error("Erro ao salvar modelo");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success("Modelo excluído com sucesso");
        } catch (error) {
            console.error('Failed to delete', error);
            toast.error("Erro ao excluir modelo");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Conteúdo copiado!");
    };

    const filteredTemplates = templates.filter(t => {
        if (filter === 'all') return true;
        const hasMedia = !!t.media;
        if (filter === 'media') return hasMedia;
        if (filter === 'text') return !hasMedia;
        return true;
    });

    const highlightVariables = (text: string) => {
        const parts = text.split(/(\{\{.*?\}\})/g);
        return parts.map((part, index) => {
            if (part.match(/^\{\{.*?\}\}$/)) {
                return <span key={index} className="text-blue-500 font-medium">{part}</span>;
            }
            return part;
        });
    };

    return (
        <div className="space-y-6 pb-20"> {/* pb-20 for FAB space if needed, though header button is primary */}
            
            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Modelos de Mensagem</h1>
                    <Button 
                        onClick={handleOpenCreate} 
                        size="icon" 
                        className="rounded-full h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                            filter === 'all' 
                                ? "bg-blue-500 text-white border-blue-500" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('media')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                            filter === 'media' 
                                ? "bg-blue-500 text-white border-blue-500" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        Mídia
                    </button>
                    <button
                        onClick={() => setFilter('text')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                            filter === 'text' 
                                ? "bg-blue-500 text-white border-blue-500" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                    >
                        Texto
                    </button>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => {
                    let mediaObj = null;
                    if (template.media) {
                        try {
                            mediaObj = JSON.parse(template.media);
                        } catch {}
                    }

                    return (
                        <Card key={template.id} className="overflow-hidden border-0 shadow-sm bg-white rounded-[20px] flex flex-col p-0 gap-0">
                            {/* Image Section */}
                            {mediaObj && (
                                <div className="relative w-full h-48 bg-gray-100">
                                    <Image 
                                        src={`data:${mediaObj.mimetype};base64,${mediaObj.data}`}
                                        alt="Template Media"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3" />
                                        <span className="truncate max-w-[150px]">{mediaObj.filename}</span>
                                    </div>
                                </div>
                            )}

                            <CardContent className="p-4 flex-1 flex flex-col gap-4">
                                {/* Header: Icon + Title + Meta */}
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                        mediaObj ? "bg-orange-100 text-orange-500" : "bg-blue-100 text-blue-500"
                                    )}>
                                        {mediaObj ? <Megaphone className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{template.title}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {mediaObj ? 'Criado: 12/01/2024' : 'Última edição: 2h atrás'}
                                        </p>
                                    </div>
                                </div>

                                {/* Message Preview */}
                                <div className="bg-gray-50 rounded-2xl p-3 text-sm text-gray-600 line-clamp-3">
                                    {highlightVariables(template.content)}
                                </div>

                                {/* Actions Footer */}
                                <div className="flex items-center justify-between pt-2 border-t border-transparent mt-auto"> 
                                    {/* The border is probably not needed if using 'gap' and layout spacing correctly, image shows clean look */}
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                            onClick={() => copyToClipboard(template.content)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                            // Handle send action
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                                            onClick={() => handleOpenEdit(template)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => handleDelete(template.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {!isLoading && filteredTemplates.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Nenhum modelo encontrado</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Crie um novo modelo para começar a enviar mensagens padronizadas.
                        </p>
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden bg-white rounded-2xl border-0 shadow-lg">
                    {/* Media Header / Upload Area */}
                    <div className="relative w-full aspect-video bg-gray-50 group border-b border-gray-100">
                        <label 
                            htmlFor="media-upload" 
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
                            id="media-upload"
                            type="file" 
                            accept="image/*" 
                            className="hidden"
                            onChange={handleFileChange} 
                        />
                    </div>

                    <div className="p-6 space-y-5">
                        <DialogHeader className="p-0 space-y-1 text-left">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                {editingId ? 'Editar Modelo' : 'Novo Modelo'}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">Preencha os dados do seu modelo de mensagem.</p>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-xs uppercase font-bold text-gray-500 tracking-wider">Título</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: Confirmação de Pedido"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="bg-gray-50 border-gray-200 rounded-xl px-4 py-6 text-base focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content" className="text-xs uppercase font-bold text-gray-500 tracking-wider">Mensagem</Label>
                                <div className="relative">
                                    <Textarea
                                        id="content"
                                        placeholder="Digite sua mensagem aqui..."
                                        className="h-[150px] bg-gray-50 border-gray-200 rounded-xl px-4 py-3 resize-none focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-sm leading-relaxed"
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                    />
                                </div>
                                
                                <div className="flex gap-2 text-xs pt-1">
                                    <button 
                                        onClick={() => setContent(prev => prev + ' {{name}} ')}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-medium transition-colors text-xs flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Nome
                                    </button>
                                    <button 
                                        onClick={() => setContent(prev => prev + ' {{phone}} ')}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-medium transition-colors text-xs flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Telefone
                                    </button>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-0 pt-2 gap-2">
                            <Button 
                                variant="ghost" 
                                onClick={() => setIsOpen(false)}
                                className="rounded-xl hover:bg-gray-100 text-gray-600 font-medium"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving} 
                                className="rounded-xl bg-blue-500 hover:bg-blue-600 font-bold px-6 shadow-sm shadow-blue-500/20"
                            >
                                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Floating Action Button (Optional, if needed to match strictly, but header button is cleaner for desktop) */}
            <div className="fixed bottom-24 right-6 md:hidden">
                <Button 
                    onClick={handleOpenCreate} 
                    size="icon" 
                    className="h-14 w-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}
