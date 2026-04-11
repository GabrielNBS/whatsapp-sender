"use client";

import { SplitText } from "@/components/ui/split-text";
import { EngagementChart } from "@/components/dashboard/engagement-chart";
import { MetricsCard, formatters } from "@/components/dashboard/metrics-card";
import { CheckCheck, MailCheck, Trophy, Users } from "lucide-react";
import { useRealtimeMetrics } from "@/hooks/use-realtime-metrics";

// Mock data for the last 7 days of engagement
const mockWeeklyData = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short' });
  
  const sent = Math.floor(Math.random() * (1000 - 500 + 1) + 500);
  // Simulating 40-80% read rate
  const readRate = Math.random() * (0.8 - 0.4) + 0.4;
  const read = Math.floor(sent * readRate);

  return { date: dateStr, sent, read };
});

export default function ReportsPage() {
  const { metrics, isLoading } = useRealtimeMetrics({ pollingInterval: 5000 });

  const totalSentToday = metrics?.today.messagesSent ?? 0;
  const totalReadToday = metrics?.today.messagesRead ?? 0;
  const engagementRate = metrics?.today.engagementRate ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SplitText text="Relatórios" as="h1" className="text-3xl font-bold tracking-tight" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Envios Hoje"
          value={formatters.number(totalSentToday)}
          description="Mensagens despachadas com sucesso"
          icon={Users}
          variant="default"
          isLoading={isLoading}
        />
        <MetricsCard
          title="Leituras Confirmadas"
          value={formatters.number(totalReadToday)}
          description="Contatos que abriram e leram"
          icon={CheckCheck}
          variant="info"
          isLoading={isLoading}
        />
        <MetricsCard
          title="Taxa Média de Engajamento"
          value={`${engagementRate}%`}
          description="Taxa de conversão diária"
          icon={MailCheck}
          variant={engagementRate >= 50 ? "success" : "warning"}
          isLoading={isLoading}
        />
        <MetricsCard
          title="Melhor Dia (Semana)"
          value="Quarta"
          description="Maior taxa de leitura (78%)"
          icon={Trophy}
          variant="default"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <EngagementChart 
          data={mockWeeklyData} 
          title="Desempenho Semanal (Área)" 
          description="Acompanhamento da taxa de abertura dos últimos 7 dias."
          type="area" 
        />
        <EngagementChart 
          data={mockWeeklyData} 
          title="Comparativo de Gaps (Barras)" 
          description="Visualização clara da diferença entre enviadas e lidas."
          type="bar" 
        />
      </div>
    </div>
  );
}
