'use client';

import { useState } from 'react';
import { RefreshCw, Search, ShieldAlert, ShieldCheck, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SplitText } from '@/components/ui/split-text';
import { useConsentAudit } from '@/hooks/use-consent-audit';
import type { ContactConsentStatus } from '@/lib/types';
import type { ConsentAuditSource } from '@/services/contacts/consentAuditApi';

const PAGE_SIZE = 30;

function formatStatus(status: string) {
  if (status === 'OPTED_OUT') return 'Opt-out';
  if (status === 'OPTED_IN') return 'Consentido';
  return 'Não definido';
}

function formatSource(source: string) {
  if (source === 'WHATSAPP') return 'WhatsApp';
  if (source === 'MANUAL') return 'Manual';
  if (source === 'IMPORT') return 'Importação';
  return 'Sistema';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ConsentAuditSheetContent() {
  const { snapshot, filters, isLoading, error, refresh } = useConsentAudit();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<ConsentAuditSource | 'ALL'>('ALL');
  const [status, setStatus] = useState<ContactConsentStatus | 'ALL'>('ALL');

  const applyFilters = () => {
    void refresh({
      limit: PAGE_SIZE,
      offset: 0,
      search: search.trim() || undefined,
      source: source === 'ALL' ? undefined : source,
      status: status === 'ALL' ? undefined : status,
    });
  };

  const changePage = (direction: -1 | 1) => {
    const nextOffset = Math.max(0, (filters.offset ?? 0) + direction * PAGE_SIZE);
    if (nextOffset >= snapshot.total && direction > 0) return;
    void refresh({ ...filters, limit: PAGE_SIZE, offset: nextOffset });
  };

  const optedOutCount = snapshot.summary.byStatus.OPTED_OUT ?? 0;
  const optedInCount = snapshot.summary.byStatus.OPTED_IN ?? 0;
  const automaticCount = snapshot.summary.bySource.WHATSAPP ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-card/80 pb-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <SplitText text="Auditoria de consentimento" as="h2" className="text-xl font-bold tracking-tight" />
            <p className="text-xs font-medium text-muted-foreground">
              Histórico imutável das alterações e opt-outs recebidos
            </p>
          </div>
          <Button variant="outline" size="icon" className="ml-auto" onClick={() => void refresh()} disabled={isLoading} aria-label="Atualizar auditoria">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-border">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-destructive"><ShieldAlert className="h-4 w-4" /> Opt-outs registrados</div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{optedOutCount}</p>
          </div>
          <div className="rounded-xl border border-success/20 bg-success/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-success"><ShieldCheck className="h-4 w-4" /> Consentimentos</div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{optedInCount}</p>
          </div>
          <div className="rounded-xl border border-info/20 bg-info/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-info"><History className="h-4 w-4" /> Via WhatsApp</div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{automaticCount}</p>
          </div>
        </div>

        <div className="grid gap-2 rounded-2xl border border-border bg-card p-3 md:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Buscar auditoria por nome ou telefone" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && applyFilters()} placeholder="Buscar por nome ou telefone" className="pl-9" />
          </div>
          <Select value={source} onValueChange={(value) => setSource(value as ConsentAuditSource | 'ALL')}>
            <SelectTrigger aria-label="Filtrar por origem"><SelectValue placeholder="Origem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as origens</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
              <SelectItem value="IMPORT">Importação</SelectItem>
              <SelectItem value="SYSTEM">Sistema</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => setStatus(value as ContactConsentStatus | 'ALL')}>
            <SelectTrigger aria-label="Filtrar por status"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              <SelectItem value="OPTED_OUT">Opt-out</SelectItem>
              <SelectItem value="OPTED_IN">Consentido</SelectItem>
              <SelectItem value="UNKNOWN">Não definido</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={applyFilters}>Filtrar</Button>
        </div>

        {error && <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Quando</th>
                  <th className="px-4 py-3 font-semibold">Contato</th>
                  <th className="px-4 py-3 font-semibold">Mudança</th>
                  <th className="px-4 py-3 font-semibold">Origem</th>
                  <th className="px-4 py-3 font-semibold">Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {snapshot.items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3"><div className="font-semibold">{item.contactName}</div><div className="text-xs text-muted-foreground">{item.phone}</div></td>
                    <td className="px-4 py-3"><div className="flex flex-wrap items-center gap-1.5"><Badge variant="outline">{formatStatus(item.previousStatus)}</Badge><span className="text-muted-foreground">→</span><Badge variant={item.newStatus === 'OPTED_OUT' ? 'destructive' : 'secondary'}>{formatStatus(item.newStatus)}</Badge></div></td>
                    <td className="px-4 py-3"><Badge variant="outline">{formatSource(item.source)}</Badge></td>
                    <td className="max-w-[220px] px-4 py-3 text-xs text-muted-foreground">{item.matchedKeyword ? `Palavra-chave: ${item.matchedKeyword}` : item.reason || 'Alteração manual'}</td>
                  </tr>
                ))}
                {!isLoading && snapshot.items.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum evento encontrado.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>{snapshot.total} evento(s)</span>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => changePage(-1)} disabled={(filters.offset ?? 0) === 0 || isLoading}>Anterior</Button><Button variant="outline" size="sm" onClick={() => changePage(1)} disabled={(filters.offset ?? 0) + PAGE_SIZE >= snapshot.total || isLoading}>Próxima</Button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
