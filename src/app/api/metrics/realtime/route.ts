/**
 * API Endpoint: /api/metrics/realtime
 * 
 * Retorna métricas em tempo real do sistema
 * Atualizado via polling do frontend
 */

import { NextResponse } from "next/server";
import { getMetricsService } from "@/lib/MetricsService";

export async function GET() {
  try {
    const metricsService = getMetricsService();
    const metrics = await metricsService.getRealtimeMetrics();
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[API] Error fetching realtime metrics:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
