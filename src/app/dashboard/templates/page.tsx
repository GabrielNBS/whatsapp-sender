'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Plus, 
    Trash2, 
    FileText, 
    Image as ImageIcon, 
    Copy, 
    // Send, // Removed
    Pencil, 
    Megaphone
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TemplateSheet } from '@/components/dashboard/templates/template-sheet';

interface Template {
    id: string;
    title: string;
    content: string;
    media?: string | null;
    category?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'media' | 'text'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isDuplicate, setIsDuplicate] = useState(false);

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

    // Extract unique categories
    const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean))) as string[];

    const handleOpenCreate = () => {
        setEditingTemplate(null);
        setIsDuplicate(false);
        setIsSheetOpen(true);
    }

    const handleOpenEdit = (template: Template) => {
        setEditingTemplate(template);
        setIsDuplicate(false);
        setIsSheetOpen(true);
    }

    const handleDuplicate = (template: Template) => {
        setEditingTemplate(template);
        setIsDuplicate(true);
        setIsSheetOpen(true);
    }

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

    const handleSaveSuccess = () => {
        fetchTemplates();
    };

    const filteredTemplates = templates.filter(t => {
        // Filter by Type
        if (filter === 'media' && !t.media) return false;
        if (filter === 'text' && t.media) return false;
        
        // Filter by Category
        if (selectedCategory && t.category !== selectedCategory) return false;

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
                        className="fixed bottom-8 right-8 z-50 h-14 px-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 font-semibold text-base"
                    >
                        <Plus className="h-6 w-6" strokeWidth={2.5} />
                        Criar modelo
                    </Button>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-col gap-4">
                    {/* Type Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => setFilter('all')}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap",
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
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap",
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
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap",
                                filter === 'text' 
                                    ? "bg-blue-500 text-white border-blue-500" 
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            Texto
                        </button>
                    
                        {/* Divider */}
                        <div className="w-px h-6 bg-gray-200 mx-2" />

                        {/* Category Filters */}
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap flex items-center gap-1.5",
                                    selectedCategory === cat
                                        ? "bg-gray-800 text-white border-gray-800"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                {/* <Tag className="w-3 h-3" /> */}
                                {cat}
                            </button>
                        ))}
                    </div>
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
                            {mediaObj ? (
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
                            ) : (
                                <div className="relative w-full h-48 bg-slate-100 flex items-center justify-center overflow-hidden group-hover:bg-slate-200 transition-colors">
                                    <div className="z-10 flex flex-col items-center gap-2 opacity-50">
                                        <ImageIcon className="w-8 h-8 text-slate-400" />
                                        <span className="text-xs font-medium text-slate-500">Sem mídia</span>
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
                                            title="Copiar texto"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                            title="Duplicar modelo"
                                            onClick={() => handleDuplicate(template)}
                                        >
                                            <div className="relative">
                                                <Copy className="h-4 w-4" />
                                                <Plus className="h-2 w-2 absolute -bottom-1 -right-1 bg-white rounded-full text-green-600" />
                                            </div>
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                                            onClick={() => handleOpenEdit(template)}
                                            title='Editar modelo'
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => handleDelete(template.id)}
                                            title='Deletar modelo'
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

            <TemplateSheet 
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                template={editingTemplate}
                onSave={handleSaveSuccess}
                isDuplicate={isDuplicate}
            />

        </div>
    );
}
