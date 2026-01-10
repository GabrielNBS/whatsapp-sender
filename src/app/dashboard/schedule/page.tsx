'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Template {
    id: string;
    title: string;
}

interface Schedule {
    id: string;
    contactName: string;
    contactPhone: string;
    template: { title: string };
    scheduledFor: string;
    status: string;
}

export default function SchedulePage() {
    const { contacts, groups, getContactsByGroup } = useAppStore();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form
    const [selectedContactId, setSelectedContactId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Poll for updates every 5 seconds
        const interval = setInterval(() => {
            fetchData();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        // Remove setIsLoading(true) to avoid flickering on poll
        try {
            const [schedRes, templRes] = await Promise.all([
                fetch('/api/schedule'),
                fetch('/api/templates')
            ]);

            if (schedRes.ok) setSchedules(await schedRes.json());
            if (templRes.ok) setTemplates(await templRes.json());
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!selectedContactId || !selectedTemplateId || !date || !time) return;

        const scheduledFor = new Date(`${date}T${time}`);

        if (scheduledFor < new Date()) {
            alert('A data deve ser futura.');
            return;
        }

        let recipients: { name: string, phone: string }[] = [];

        if (selectedContactId.startsWith('group:')) {
            const groupId = selectedContactId.split(':')[1];
            const groupContacts = getContactsByGroup(groupId);
            recipients = groupContacts.map(c => ({ name: c.name, phone: c.number }));
        } else {
            const contact = contacts.find(c => c.id === selectedContactId);
            if (contact) {
                recipients.push({ name: contact.name, phone: contact.number });
            }
        }

        if (recipients.length === 0) {
            alert('Nenhum contato encontrado para agendar.');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients,
                    templateId: selectedTemplateId,
                    scheduledFor: scheduledFor.toISOString()
                }),
            });

            if (res.ok) {
                setIsOpen(false);
                fetchData();
                // Reset form
                setSelectedContactId('');
                setSelectedTemplateId('');
            } else {
                alert('Erro ao agendar.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir agendamento?')) return;
        try {
            await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
            setSchedules(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SENT': return <CheckCircle className="h-4 w-4 text-success" />;
            case 'FAILED': return <XCircle className="h-4 w-4 text-destructive" />;
            default: return <Clock className="h-4 w-4 text-warning" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'SENT': return 'Enviado';
            case 'FAILED': return 'Falhou';
            default: return 'Pendente';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Calendar className="mr-2 h-4 w-4" /> Novo Agendamento</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agendar Mensagem</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Destinatário(s)</Label>
                                <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um contato ou grupo..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[250px]">
                                        <SelectItem value="group_header" disabled className="font-semibold text-foreground bg-muted">Grupos</SelectItem>
                                        {groups.map(g => (
                                            <SelectItem key={`group_${g.id}`} value={`group:${g.id}`}>
                                                [Grupo] {g.name} ({contacts.filter(c => c.groupIds.includes(g.id)).length})
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="contact_header" disabled className="font-semibold text-foreground bg-muted mt-2">Contatos Individuais</SelectItem>
                                        {contacts.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name} ({c.number})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Modelo</Label>
                                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um modelo..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Data</Label>
                                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hora</Label>
                                    <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button onClick={handleCreate} disabled={isSaving}>Agendar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="rounded-md border bg-card">
                {schedules.length === 0 && !isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Nenhum agendamento encontrado.</div>
                ) : (
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Data/Hora</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Contato</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Modelo</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {schedules.map((schedule) => (
                                    <tr key={schedule.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">
                                            {format(new Date(schedule.scheduledFor), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </td>
                                        <td className="p-4 align-middle font-medium">
                                            {schedule.contactName}
                                            <div className="text-xs text-muted-foreground">{schedule.contactPhone}</div>
                                        </td>
                                        <td className="p-4 align-middle">{schedule.template?.title || 'Modelo Excluído'}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(schedule.status)}
                                                <span>{getStatusLabel(schedule.status)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
