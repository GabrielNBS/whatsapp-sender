'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FunnelData {
  name: string;
  value: number;
}

interface EngagementFunnelProps {
  data: FunnelData[];
}

const COLORS = ['#94a3b8', '#3b82f6', '#10b981']; // Gray, Blue, Green

export function EngagementFunnelChart({ data }: EngagementFunnelProps) {
  if (!data || data.length === 0) return null;

  // Calculate conversion rates
  const total = data[0]?.value || 1;
  const metrics = data.map((item, index) => ({
    ...item,
    conversion: Math.round((item.value / total) * 100),
    color: COLORS[index % COLORS.length]
  }));

  return (
    <Card className="col-span-1 border-muted">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Funil de Engajamento Global</CardTitle>
        <CardDescription>Conversão de Contatos Válidos até a Leitura</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-sm text-sm">
                        <p className="font-medium mb-1">{data.name}</p>
                        <p className="text-muted-foreground">Volume: <span className="font-medium text-foreground">{data.value}</span></p>
                        <p className="text-muted-foreground">Retenção: <span className="font-medium text-foreground">{data.conversion}%</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                {metrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
