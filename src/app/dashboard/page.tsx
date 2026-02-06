'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { 
  MessageSquare, 
  Users, 
  Activity, 
  ExternalLink, 
  Wifi, 
  WifiOff,
  Clock,
  Gauge,
  CheckCheck,
  MailCheck,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { MetricsCard, formatters } from '@/components/dashboard/metrics-card';
import { useRealtimeMetrics } from '@/hooks/use-realtime-metrics';

export default function DashboardPage() {
  const { contacts, groups } = useAppStore();
  const { metrics, isLoading, refresh } = useRealtimeMetrics({ pollingInterval: 3000 });

  const isConnected = metrics?.connection.status === 'connected';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Métricas em Tempo Real */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Status de Conexão */}
        <MetricsCard
          title="Status da Conexão"
          value={isConnected ? "Online" : "Offline"}
          description={
            isConnected && metrics?.connection.uptimeSeconds
              ? `Conectado há ${formatters.uptime(metrics.connection.uptimeSeconds)}`
              : "WhatsApp desconectado"
          }
          icon={isConnected ? Wifi : WifiOff}
          variant={isConnected ? "success" : "destructive"}
          isLoading={isLoading}
        />

        {/* Fila de Pendentes */}
        <MetricsCard
          title="Fila Pendente"
          value={metrics?.processing.pendingMessages ?? 0}
          description={`Intervalo: ${formatters.interval(metrics?.processing.currentIntervalMs ?? 0)}`}
          icon={Clock}
          variant={
            (metrics?.processing.pendingMessages ?? 0) > 10 
              ? "warning" 
              : "default"
          }
          isLoading={isLoading}
        />

        {/* Leituras Detectadas */}
        <MetricsCard
          title="Leituras Detectadas"
          value={metrics?.reads.total ?? 0}
          description={`${metrics?.reads.byEvent ?? 0} por evento, ${metrics?.reads.byPolling ?? 0} por polling`}
          icon={CheckCheck}
          variant="info"
          isLoading={isLoading}
        />

        {/* Taxa de Engajamento */}
        <MetricsCard
          title="Engajamento Hoje"
          value={`${metrics?.today.engagementRate ?? 0}%`}
          description={`${metrics?.today.messagesRead ?? 0} de ${metrics?.today.messagesSent ?? 0} lidas`}
          icon={MailCheck}
          variant={
            (metrics?.today.engagementRate ?? 0) >= 50 
              ? "success" 
              : (metrics?.today.engagementRate ?? 0) >= 25 
                ? "warning" 
                : "default"
          }
          isLoading={isLoading}
        />
      </div>

      {/* Cards Originais */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Contacts Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">
              Em {groups.length} grupos
            </p>
          </CardContent>
        </Card>

        {/* Polling Cycles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ciclos de Polling</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatters.number(metrics?.processing.pollingCycles ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Verificações executadas
            </p>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Envio Rápido</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/send">
              <Button className="w-full mt-1 " size="sm">
                Nova Campanha <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 bg-card shadow-md">
        <Card className="bg-card text-card-foreground border-none">
          <CardHeader>
            <CardTitle className='text-foreground'>Bem-vindo ao WhatsApp Sender</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sistema de disparos em massa e gerenciamento de contatos <br />
              Utilize o menu lateral para gerenciar seus grupos de contatos ou iniciar um novo envio de mensagens.
              Lembre-se de manter o WhatsApp conectado no dispositivo servidor.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
