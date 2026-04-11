'use client';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useHydrated } from '@/hooks/use-hydrated';

interface TrendData {
  date: string;
  sent: number;
  read: number;
  responses: number;
}

interface EngagementTrendsProps {
  data: TrendData[];
}

export function EngagementTrendsChart({ data }: EngagementTrendsProps) {
  const hydrated = useHydrated();

  if (!data || data.length === 0) return null;

  return (
    <Card className="col-span-1 lg:col-span-2 border-muted">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Histórico Diário (Últimos 7 Dias)</CardTitle>
        <CardDescription>Volume de envios e engajamento gerado por dia</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          {hydrated ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRead" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                itemStyle={{ fontSize: '14px' }}
                labelStyle={{ fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Area 
                type="monotone" 
                dataKey="sent" 
                name="Enviadas" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSent)" 
              />
              <Area 
                type="monotone" 
                dataKey="read" 
                name="Lidas" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRead)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
