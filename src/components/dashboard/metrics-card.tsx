/**
 * MetricsCard - Card de métrica reutilizável
 * 
 * PRINCÍPIO: Single Responsibility (SRP)
 * - Responsável apenas por exibir uma métrica individual
 * - Formatação e lógica de negócios não ficam aqui
 * 
 * Usa design tokens para estilização consistente
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type MetricVariant = "default" | "success" | "warning" | "info" | "destructive";

interface MetricsCardProps {
  /** Título da métrica */
  title: string;
  /** Valor principal a exibir */
  value: string | number;
  /** Descrição ou subtítulo */
  description?: string;
  /** Ícone do lucide-react */
  icon?: LucideIcon;
  /** Variante de cor (usa tokens) */
  variant?: MetricVariant;
  /** Indicador de tendência */
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  /** Loading state */
  isLoading?: boolean;
  /** Classes adicionais */
  className?: string;
}

const variantStyles: Record<MetricVariant, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  destructive: "text-destructive",
};

export function MetricsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  trend,
  isLoading = false,
  className,
}: MetricsCardProps) {
  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <div className={cn("text-2xl font-bold", variantStyles[variant])}>
            {value}
          </div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        
        {trend && !isLoading && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Formatadores de valores para métricas
 */
export const formatters = {
  /** Formata segundos para tempo legível (ex: "2h 30m") */
  uptime: (seconds: number | null): string => {
    if (seconds === null) return "—";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },
  
  /** Formata número com separadores de milhar */
  number: (value: number): string => {
    return new Intl.NumberFormat("pt-BR").format(value);
  },
  
  /** Formata percentual */
  percent: (value: number): string => {
    return `${value}%`;
  },
  
  /** Formata intervalo em ms para legível */
  interval: (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  },
};
