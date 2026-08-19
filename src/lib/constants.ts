/**
 * Status de confirmação de mensagem do WhatsApp (ACK Status)
 */
export enum MessageAckStatus {
  /** Mensagem ainda pendente de envio */
  PENDING = 0,
  
  /** Mensagem enviada para o servidor do WhatsApp (✓) */
  SENT = 1,
  
  /** Mensagem entregue ao dispositivo do destinatário (✓✓) */
  DELIVERED = 2,
  
  /** Mensagem lida pelo destinatário (✓✓ azul) */
  READ = 3,
}

/**
 * Status de conexão do cliente WhatsApp
 * 
 * Representa os diferentes estados possíveis da conexão.
 * Usar um enum evita erros de digitação e permite validação do TypeScript.
 */
export enum ConnectionStatus {
  DISCONNECTED = "DISCONNECTED",
  INITIALIZING = "INITIALIZING",
  QR_READY = "QR_READY",
  AUTHENTICATED = "AUTHENTICATED",
  READY = "READY",
}

/**
 * Níveis de risco baseados na quantidade de mensagens enviadas
 * 
 * O WhatsApp pode banir contas que enviam muitas mensagens.
 * Estes níveis ajudam o usuário a entender o risco atual.
 */
export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

/** Constantes de tempo em milissegundos. */
export const TIMING = {
  /** Intervalo entre verificações de status de mensagens. */
  POLLING_INTERVAL_MS: 10_000, // 10 segundos
  
  /**
   * Tempo de espera antes de tentar reconectar após desconexão
   */
  RECONNECT_DELAY_MS: 5_000, // 5 segundos

  /** Limite do backoff para evitar loop agressivo durante indisponibilidade. */
  RECONNECT_MAX_DELAY_MS: 60_000,
  
  /**
   * Timeout máximo para aguardar o cliente ficar pronto
   */
  WAIT_READY_TIMEOUT_MS: 15_000, // 15 segundos
  
  /**
   * Tempo após o qual uma mensagem pendente é considerada expirada
   * Mensagens mais antigas que isso são removidas da fila de polling
   * 
   * Cálculo: 24 horas * 60 minutos * 60 segundos * 1000 milissegundos
   * Usamos underscore (24 * 60 * 60 * 1_000) para melhor legibilidade
   */
  MESSAGE_EXPIRY_MS: 24 * 60 * 60 * 1_000, // 24 horas
  
  /**
   * MELHORIA #2: Intervalos adaptativos de polling
   * ===============================================
   * 
   * POR QUE INTERVALO ADAPTATIVO?
   * - Quando não há mensagens pendentes: não precisa verificar tão frequente
   * - Quando há muitas mensagens: precisa verificar mais rápido
   * - Economiza recursos quando ocioso, responde rápido quando ocupado
   * 
   * THRESHOLDS:
   * - 0 mensagens: 30 segundos (quase não verifica)
   * - 1-9 mensagens: 10 segundos (normal)
   * - 10-49 mensagens: 5 segundos (ocupado)
   * - 50+ mensagens: 3 segundos (pico)
   */
  ADAPTIVE_POLLING: {
    /** Intervalo quando sem mensagens pendentes */
    IDLE_INTERVAL_MS: 30_000, // 30 segundos
    
    /** Intervalo padrão para poucas mensagens (1-9) */
    NORMAL_INTERVAL_MS: 10_000, // 10 segundos
    
    /** Intervalo para carga média (10-49) */
    BUSY_INTERVAL_MS: 5_000, // 5 segundos
    
    /** Intervalo para pico de carga (50+) */
    PEAK_INTERVAL_MS: 3_000, // 3 segundos
    
    /** Thresholds para determinar intervalo */
    THRESHOLDS: {
      /** Acima disso usa BUSY_INTERVAL */
      BUSY: 10,
      /** Acima disso usa PEAK_INTERVAL */
      PEAK: 50,
    },
  },
} as const;

// =============================================================================
// LIMITES DE SEGURANÇA
// =============================================================================

/**
 * Limites para controle de risco de banimento
 * 
 * Estes valores definem os thresholds para classificar o nível de risco
 * baseado na quantidade de mensagens enviadas no dia.
 */
export const SAFETY_LIMITS = {
  /**
   * Abaixo deste número: risco BAIXO
   * O WhatsApp geralmente não detecta atividade suspeita
   */
  LOW_RISK_THRESHOLD: 50,
  
  /**
   * Entre LOW e MEDIUM: risco MÉDIO
   * Acima deste número: risco ALTO
   */
  MEDIUM_RISK_THRESHOLD: 100,
  
  /**
   * Limite diário recomendado para evitar problemas
   * Exibido na interface como sugestão ao usuário
   */
  RECOMMENDED_DAILY_LIMIT: 50,
} as const;

// =============================================================================
// PADRÕES DE SUBSTITUIÇÃO DE MENSAGEM
// =============================================================================

/**
 * Padrões (patterns) usados para substituição de variáveis em mensagens
 * 
 * Permite personalizar mensagens com dados do contato.
 * Suporta tanto formato em inglês quanto português.
 */
export const MESSAGE_PATTERNS = {
  /** 
   * Padrão para substituir pelo nome do contato
   * Matches: {{name}} ou {{nome}}
   */
  NAME: /{{name}}/g,
  NAME_PT: /{{nome}}/g,
  
  /** 
   * Padrão para substituir pelo número de telefone
   * Matches: {{phone}}
   */
  PHONE: /{{phone}}/g,
} as const;

/**
 * Nome padrão quando não conseguimos obter o nome do contato
 */
export const DEFAULT_CONTACT_NAME = "Cliente";

/**
 * Determina o nível de risco baseado na contagem diária de mensagens
 * @param dailyCount - Número de mensagens enviadas hoje
 * @returns O nível de risco correspondente
 * 
 * @example
 * getRiskLevel(30)  // RiskLevel.LOW
 * getRiskLevel(75)  // RiskLevel.MEDIUM
 * getRiskLevel(150) // RiskLevel.HIGH
 */
export function getRiskLevel(dailyCount: number): RiskLevel {
  if (dailyCount < SAFETY_LIMITS.LOW_RISK_THRESHOLD) {
    return RiskLevel.LOW;
  }
  if (dailyCount < SAFETY_LIMITS.MEDIUM_RISK_THRESHOLD) {
    return RiskLevel.MEDIUM;
  }
  return RiskLevel.HIGH;
}

/**
 * MELHORIA #2: Calcula intervalo de polling adaptativo
 * ====================================================
 * 
 * Retorna o intervalo ideal (em ms) baseado no número de mensagens pendentes.
 * 
 * LÓGICA:
 * - 0 mensagens → IDLE (30s): Quase nada para verificar
 * - 1-9 mensagens → NORMAL (10s): Fluxo padrão
 * - 10-49 mensagens → BUSY (5s): Alta demanda
 * - 50+ mensagens → PEAK (3s): Pico máximo
 * 
 * @param pendingCount - Número de mensagens pendentes na fila
 * @returns Intervalo em milissegundos
 * 
 * @example
 * getAdaptivePollingInterval(0)   // 30000 (30s)
 * getAdaptivePollingInterval(5)   // 10000 (10s)
 * getAdaptivePollingInterval(25)  // 5000 (5s)
 * getAdaptivePollingInterval(100) // 3000 (3s)
 */
export function getAdaptivePollingInterval(pendingCount: number): number {
  const { ADAPTIVE_POLLING } = TIMING;
  
  if (pendingCount === 0) {
    return ADAPTIVE_POLLING.IDLE_INTERVAL_MS;
  }
  
  if (pendingCount >= ADAPTIVE_POLLING.THRESHOLDS.PEAK) {
    return ADAPTIVE_POLLING.PEAK_INTERVAL_MS;
  }
  
  if (pendingCount >= ADAPTIVE_POLLING.THRESHOLDS.BUSY) {
    return ADAPTIVE_POLLING.BUSY_INTERVAL_MS;
  }
  
  return ADAPTIVE_POLLING.NORMAL_INTERVAL_MS;
}
