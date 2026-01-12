'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Users, Calendar, Trash2, Loader2, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScheduledBatch } from '@/lib/types';

interface ScheduleItemProps {
    batch: ScheduledBatch;
    onCancel: (id: string) => void;
}

export function ScheduleItem({ batch, onCancel }: ScheduleItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Calculate progress percentage
    // If total is 0 (shouldn't happen for active), default to 0.
    const progress = batch.total > 0 ? Math.round((batch.sent / batch.total) * 100) : 0;
    const isCompleted = batch.count === 0 && batch.total > 0;

    const handleCancel = async () => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
        setIsCancelling(true);
        await onCancel(batch.batchId); // Use batchId, not id
        setIsCancelling(false);
    };

    return (
        <div className="border rounded-lg bg-card shadow-sm overflow-hidden mb-3">
            <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full text-primary">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">{batch.batchName}</h4>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{format(new Date(batch.scheduledFor), "dd/MM 'às' HH:mm")}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {batch.total} contatos
                                </span>
                            </div>
                            {batch.total > 0 && (
                                <div className="flex items-center gap-2 w-32">
                                    <Progress value={progress} className="h-1.5" />
                                    <span className="text-[10px] text-muted-foreground">{progress}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancel();
                        }}
                        disabled={isCancelling}
                    >
                        {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="bg-muted/30 border-t p-4 text-sm animate-in slide-in-from-top-2">
                    <div className="mb-4 space-y-2">
                        <h5 className="font-medium text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" /> Mensagem
                        </h5>
                        <div className="bg-background p-3 rounded border text-muted-foreground text-xs whitespace-pre-wrap">
                            {batch.sampleTemplate}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <h5 className="font-medium text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Users className="w-3 h-3" /> Destinatários
                            </h5>
                            
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">Ver todos</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Lista de Agendamento</DialogTitle>
                                    </DialogHeader>
                                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                                        {batch.contacts.map(c => (
                                            <div key={c.id} className="flex justify-between items-center p-2 border rounded bg-card">
                                                <div>
                                                    <p className="font-medium">{c.name}</p>
                                                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                                                </div>
                                                <Badge variant="outline">{c.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        
                        <div className="space-y-1">
                            {batch.contacts.slice(0, 3).map(c => (
                                <div key={c.id} className="flex justify-between items-center text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted">
                                    <span>{c.name}</span>
                                    <span>{c.phone}</span>
                                </div>
                            ))}
                            {batch.contacts.length > 3 && (
                                <div className="text-xs text-center text-muted-foreground pt-1">
                                    + {batch.contacts.length - 3} contatos
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
