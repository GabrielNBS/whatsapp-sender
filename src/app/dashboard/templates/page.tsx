'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Template {
    id: string;
    title: string;
    content: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

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

    const handleOpenEdit = (template: Template & { media?: string }) => {
        setEditingId(template.id);
        setTitle(template.title);
        setContent(template.content);
        if (template.media) {
            try {
                setSelectedFile(JSON.parse(template.media));
            } catch (e) {
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
            }
        } catch (error) {
            console.error('Failed to save', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
            setTemplates(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Modelos de Mensagem</h1>
                <Button onClick={handleOpenCreate}><Plus className="mr-2 h-4 w-4" /> Novo Modelo</Button>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Editar Modelo' : 'Criar Novo Modelo'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título do Modelo</Label>
                                <Input
                                    id="title"
                                    placeholder="Ex: Confirmação de Pedido"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Conteúdo</Label>
                                <Textarea
                                    id="content"
                                    placeholder="Olá {{name}}, seu pedido foi confirmado!"
                                    className="h-32"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Variáveis disponíveis: {'{{name}}'}, {'{{phone}}'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Imagem (Opcional)</Label>
                                <Input type="file" accept="image/*" onChange={handleFileChange} />
                                {selectedFile && (
                                    <div className="space-y-2 mt-2">
                                        <div className="relative w-full h-32 bg-muted/30 rounded-lg overflow-hidden border flex items-center justify-center">
                                            <Image 
                                                src={`data:${selectedFile.mimetype};base64,${selectedFile.data}`} 
                                                alt="Preview" 
                                                fill
                                                className="object-contain"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded border">
                                            <span className="text-success truncate max-w-[200px]">{selectedFile.filename}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => setSelectedFile(null)}
                                            >
                                                <Trash2 className="w-3 h-3 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Salvando...' : 'Salvar Modelo'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template: any) => (
                    <Card key={template.id}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                {template.title}
                            </CardTitle>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(template)}>
                                    <ViewIcon className="h-4 w-4 text-muted-foreground" /> {/* Using Pencil as View/Edit */}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(template.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {template.media && (() => {
                                try {
                                    const media = JSON.parse(template.media);
                                    return (
                                        <div className="mb-3 space-y-1">
                                            <div className="relative w-full flex items-center justify-center">
                                                <Image 
                                                    src={`data:${media.mimetype};base64,${media.data}`} 
                                                    alt="Media" 
                                                    width={0}
                                                    height={0}
                                                    sizes="100vw"
                                                    className="w-full h-auto max-h-48 object-contain rounded-md"
                                                    unoptimized
                                                />
                                            </div>
                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <ImageIcon className="w-3 h-3" />
                                                <span className="truncate">{media.filename || 'Imagem anexada'}</span>
                                            </div>
                                        </div>
                                    );
                                } catch (e) {
                                    return (
                                        <div className="mb-3 text-xs text-info flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            <span>Contém imagem (erro ao carregar preview)</span>
                                        </div>
                                    )
                                }
                            })()}
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                                {template.content}
                            </p>
                        </CardContent>
                    </Card>
                ))}

                {!isLoading && templates.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        Nenhum modelo criado ainda.
                    </div>
                )}
            </div>
        </div>
    );
}

function ViewIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
    )
}
