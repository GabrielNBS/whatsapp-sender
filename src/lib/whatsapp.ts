/**
 * =============================================================================
 * WHATSAPP SERVICE - Versão Refatorada com SOLID
 * =============================================================================
 * 
 * MUDANÇAS REALIZADAS (SOLID REFACTORING):
 * ----------------------------------------
 * 
 * 1. SRP (Single Responsibility Principle):
 *    - ANTES: Esta classe fazia conexão, envio, formatação e analytics
 *    - DEPOIS: Esta classe SÓ faz conexão e envio de mensagens
 *    - Analytics foi movido para AnalyticsService
 *    - Formatação foi movida para MessageFormatter
 * 
 * 2. DIP (Dependency Inversion Principle):
 *    - ANTES: Usava `await import("@/lib/db")` dinamicamente (acoplamento forte)
 *    - DEPOIS: Recebe dependências pelo construtor (injeção de dependência)
 * 
 * 3. Clean Code:
 *    - ANTES: Magic numbers como `ack === 3`, `5000`, `10000`
 *    - DEPOIS: Constantes descritivas como `MessageAckStatus.READ`, `TIMING.*`
 * 
 * BENEFÍCIOS:
 * -----------
 * - Código mais testável (pode mockar dependências)
 * - Cada classe tem uma responsabilidade clara
 * - Fácil trocar implementações (ex: outro banco de dados)
 * - Código mais legível e manutenível
 */

import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";

// MUDANÇA: Importações centralizadas das novas classes e constantes
// Antes eram imports dinâmicos espalhados pelo código
import { prisma } from "./db";
import { AnalyticsService, IAnalyticsService } from "./AnalyticsService";
import { MessageFormatter, IMessageFormatter, ContactInfo } from "./MessageFormatter";
import {
  MessageAckStatus,
  ConnectionStatus,
  RiskLevel,
  TIMING,
  SAFETY_LIMITS,
  getRiskLevel,
  getAdaptivePollingInterval,
} from "./constants";

// Define global interface to prevent multiple instances in dev mode
declare global {
  var whatsappClientInstance: WhatsAppService | undefined;
}

/**
 * Dados sobre uma mensagem pendente de confirmação
 */
interface PendingMessageData {
  phone: string;
  timestamp: number;
}

/**
 * MELHORIA #4: Interface de métricas de polling
 * =============================================
 * 
 * Permite observar o comportamento do polling sem alterar seu funcionamento.
 * Útil para:
 * - Debugging
 * - Monitoramento
 * - Otimização de performance
 */
export interface PollingMetrics {
  /** Total de ciclos de polling executados */
  pollingCycles: number;
  
  /** Mensagens encontradas como lidas via polling (fallback) */
  readsFoundByPolling: number;
  
  /** Mensagens encontradas como lidas via evento (preferível) */
  readsFoundByEvent: number;
  
  /** Número atual de mensagens pendentes */
  currentPendingCount: number;
  
  /** Intervalo atual de polling em ms */
  currentIntervalMs: number;
  
  /** Última vez que o polling rodou */
  lastPollingTime: Date | null;
}

/**
 * Serviço principal do WhatsApp
 * 
 * RESPONSABILIDADE (após refatoração):
 * - Gerenciar conexão com WhatsApp Web
 * - Enviar mensagens (texto e mídia)
 * - Controle de rate limiting (contagem diária)
 * 
 * NÃO FAZ MAIS:
 * - Operações de banco de dados (delegado para AnalyticsService)
 * - Formatação de mensagens (delegado para MessageFormatter)
 */
export class WhatsAppService {
  private client: Client;
  private qrCode: string | null = null;
  private isAuthenticated: boolean = false;
  private isReady: boolean = false;
  
  /**
   * MUDANÇA: Agora usa enum ConnectionStatus ao invés de string literal
   * ANTES: private status: "DISCONNECTED" | "INITIALIZING" | ... = "DISCONNECTED"
   * DEPOIS: private status: ConnectionStatus = ConnectionStatus.DISCONNECTED
   */
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;

  // Safety Handling
  private dailyCount: number = 0;
  private lastReset: Date = new Date();
  
  // Connection tracking for uptime
  private connectionStartTime: Date | null = null;
  
  // Polling Queue
  private pendingMessages: Map<string, PendingMessageData> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  
  /**
   * MELHORIA #4: Métricas de polling para observabilidade
   */
  private metrics: PollingMetrics = {
    pollingCycles: 0,
    readsFoundByPolling: 0,
    readsFoundByEvent: 0,
    currentPendingCount: 0,
    currentIntervalMs: TIMING.ADAPTIVE_POLLING.IDLE_INTERVAL_MS,
    lastPollingTime: null,
  };

  /**
   * MUDANÇA PRINCIPAL: Injeção de Dependência (DIP)
   * ------------------------------------------------
   * 
   * ANTES (acoplamento forte):
   * ```typescript
   * constructor() {
   *   // Não recebia dependências, usava import dinâmico depois
   * }
   * 
   * async someMethod() {
   *   const { prisma } = await import("@/lib/db"); // RUIM!
   * }
   * ```
   * 
   * DEPOIS (desacoplado):
   * ```typescript
   * constructor(
   *   private analyticsService: IAnalyticsService,
   *   private messageFormatter: IMessageFormatter
   * ) {
   *   // Dependências injetadas, prontas para uso
   * }
   * ```
   * 
   * POR QUE ISSO É MELHOR?
   * 1. Testabilidade: Em testes, passamos mocks ao invés de serviços reais
   * 2. Flexibilidade: Fácil trocar implementação (ex: outro banco de dados)
   * 3. Clareza: Dependências são explícitas no construtor
   * 4. Performance: Não tem overhead de import dinâmico em runtime
   */
  constructor(
    private analyticsService: IAnalyticsService,
    private messageFormatter: IMessageFormatter
  ) {
    console.log("Initializing WhatsApp Service...");
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
      webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      },
    });

    this.initializeEvents();
    this.status = ConnectionStatus.INITIALIZING;
    this.client.initialize().catch((err) => {
      console.error("Initialization error:", err);
      this.status = ConnectionStatus.DISCONNECTED;
    });
    
    this.startPolling();
  }

  private initializeEvents() {
    this.client.on("qr", (qr) => {
      console.log("QR Code received");
      this.qrCode = qr;
      this.status = ConnectionStatus.QR_READY;
    });

    this.client.on("ready", () => {
      console.log("WhatsApp Client is ready!");
      this.isReady = true;
      this.status = ConnectionStatus.READY;
      this.qrCode = null;
      this.connectionStartTime = new Date();
    });

    this.client.on("authenticated", () => {
      console.log("WhatsApp Client authenticated");
      this.isAuthenticated = true;
      this.status = ConnectionStatus.AUTHENTICATED;
      this.qrCode = null;
    });

    this.client.on("auth_failure", (msg) => {
      console.error("AUTHENTICATION FAILURE", msg);
      this.status = ConnectionStatus.DISCONNECTED;
    });

    this.client.on("change_state", (state) => {
      console.log("CONNECTION STATE CHANGED", state);
    });

    this.client.on("message_create", (msg) => {
      if (msg.fromMe) {
        console.log("[DEBUG] Outgoing message created to:", msg.to);
      } else {
        console.log("[DEBUG] Incoming message from:", msg.from);
      }
    });

    this.client.on("disconnected", (reason) => {
      console.log("Client was disconnected", reason);
      this.isAuthenticated = false;
      this.isReady = false;
      this.status = ConnectionStatus.DISCONNECTED;

      /**
       * MUDANÇA: Timeout agora usa constante descritiva
       * ANTES: setTimeout(() => {...}, 5000)
       * DEPOIS: setTimeout(() => {...}, TIMING.RECONNECT_DELAY_MS)
       */
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        this.status = ConnectionStatus.INITIALIZING;
        this.client.initialize().catch((err) => {
          console.error("Reconnection error:", err);
          this.status = ConnectionStatus.DISCONNECTED;
        });
      }, TIMING.RECONNECT_DELAY_MS);
    });

    this.client.on("message_ack", async (msg, ack) => {
      const phone = msg.to.replace("@c.us", "");
      console.log(
        `[ACK DEBUG] Message to ${phone} status update: ${ack} (${MessageAckStatus.READ}=Read, ${MessageAckStatus.DELIVERED}=Delivered, ${MessageAckStatus.SENT}=Sent)`,
      );
      
      // CORREÇÃO: Só processar ACKs de mensagens enviadas pelo nosso sistema
      // Isso evita contabilizar leituras de mensagens manuais do celular
      const isOurMessage = this.pendingMessages.has(msg.id._serialized);
      
      if (!isOurMessage) {
        console.log(`[ACK DEBUG] Ignoring ACK for message not sent by app: ${msg.id._serialized}`);
        return;
      }
      
      // Remove from polling queue if we got an event
      /**
       * MUDANÇA: Comparação usa enum ao invés de magic number
       * ANTES: if (ack >= 3)
       * DEPOIS: if (ack >= MessageAckStatus.READ)
       */
      // Cast ack to number because whatsapp-web.js uses MessageAck enum
      if ((ack as number) >= MessageAckStatus.READ) {
        this.pendingMessages.delete(msg.id._serialized);
      }

      /**
       * MUDANÇA: Usa enum para comparação
       * ANTES: if (ack === 3)
       * DEPOIS: if (ack === MessageAckStatus.READ)
       * 
       * Este código é muito mais legível! Fica claro que estamos
       * verificando se a mensagem foi LIDA, não um número arbitrário.
       */
      // Cast ack to number because whatsapp-web.js uses MessageAck enum
      if ((ack as number) === MessageAckStatus.READ) {
        console.log(`[ACK DEBUG] Marking as READ for ${phone}`);
        
        /**
         * MUDANÇA: Usa AnalyticsService injetado ao invés de import dinâmico
         * ANTES:
         *   const { prisma } = await import("@/lib/db");
         *   await prisma.contactAnalytics.upsert({...});
         * 
         * DEPOIS:
         *   await this.analyticsService.trackMessageRead(phone);
         * 
         * BENEFÍCIOS:
         * - Código mais limpo e conciso
         * - Lógica de banco centralizada no AnalyticsService
         * - Fácil de mockar em testes
         */
        // MELHORIA #4: Atualizar métrica de leituras encontradas por evento
        this.metrics.readsFoundByEvent++;
        
        await this.analyticsService.trackMessageRead(phone);
        console.log(`[ACK DEBUG] Database updated for ${phone}`);
      }
    });
  }
  
  /**
   * MELHORIAS IMPLEMENTADAS NO POLLING:
   * ===================================
   * 
   * #1 - POLLING PARALELO:
   *   Usa Promise.allSettled para verificar múltiplas mensagens simultaneamente.
   * 
   * #2 - INTERVALO ADAPTATIVO:
   *   Usa setTimeout recursivo ao invés de setInterval fixo.
   *   O intervalo varia de 3s (pico) a 30s (ocioso) baseado na carga.
   * 
   * #3 - BATCH DE OPERAÇÕES:
   *   Coleta todos os phones lidos e faz uma única chamada ao banco.
   * 
   * #4 - MÉTRICAS:
   *   Atualiza contadores para observabilidade do sistema.
   */
  private startPolling() {
    if (this.pollingInterval) return;
    
    console.log("[POLLING] Starting adaptive ack check service...");
    
    /**
     * MELHORIA #2: setTimeout recursivo ao invés de setInterval
     * ----------------------------------------------------------
     * 
     * ANTES (setInterval fixo):
     * - Sempre roda a cada 10s, mesmo se ocioso ou sobrecarregado
     * 
     * DEPOIS (setTimeout recursivo com intervalo adaptativo):
     * - Calcula o próximo intervalo baseado na carga atual
     * - Mais rápido quando ocupado, mais lento quando ocioso
     * - Evita problemas de overlapping (novo ciclo antes do anterior terminar)
     */
    const runPollingCycle = async () => {
      // Atualizar métricas de pending count
      this.metrics.currentPendingCount = this.pendingMessages.size;
      
      // Calcular próximo intervalo ANTES de processar (para logging)
      const nextInterval = getAdaptivePollingInterval(this.pendingMessages.size);
      this.metrics.currentIntervalMs = nextInterval;
      
      // Se não está pronto ou sem mensagens, agendar próximo ciclo e retornar
      if (!this.isReady || this.pendingMessages.size === 0) {
        this.pollingInterval = setTimeout(runPollingCycle, nextInterval);
        return;
      }

      // Atualizar métricas
      this.metrics.pollingCycles++;
      this.metrics.lastPollingTime = new Date();
      
      console.log(`[POLLING] Cycle #${this.metrics.pollingCycles}: Checking ${this.pendingMessages.size} messages (next in ${nextInterval}ms)...`);
      
      // Snapshot das entries para evitar modificação durante iteração
      const entries = Array.from(this.pendingMessages.entries());
      
      // Filtrar mensagens expiradas (operação síncrona, rápida)
      const now = Date.now();
      const validEntries = entries.filter(([msgId, data]) => {
        if (now - data.timestamp > TIMING.MESSAGE_EXPIRY_MS) {
          this.pendingMessages.delete(msgId);
          return false;
        }
        return true;
      });
      
      if (validEntries.length === 0) {
        this.pollingInterval = setTimeout(runPollingCycle, nextInterval);
        return;
      }
      
      /**
       * MELHORIA #1: Verificações em paralelo usando Promise.allSettled
       */
      const checkPromises = validEntries.map(async ([msgId, data]) => {
        try {
          // getMessageById may not exist in all whatsapp-web.js versions
          const getMsg = (this.client as unknown as { getMessageById?: (id: string) => Promise<unknown> }).getMessageById;
          if (!getMsg) {
            return { msgId, phone: data.phone, read: false };
          }
          const msg = await getMsg.call(this.client, msgId).catch(() => null) as { ack?: number } | null;
          
          if (msg && typeof msg.ack === 'number' && msg.ack >= MessageAckStatus.READ) {
            return { msgId, phone: data.phone, read: true };
          }
          return { msgId, phone: data.phone, read: false };
        } catch (e) {
          console.warn(`[POLLING] Error checking message ${msgId}`, e);
          return { msgId, phone: data.phone, read: false, error: e };
        }
      });
      
      const results = await Promise.allSettled(checkPromises);
      
      /**
       * MELHORIA #3: Coletar phones lidos e fazer batch update
       * -------------------------------------------------------
       * Em vez de chamar trackMessageRead para cada phone individualmente,
       * coletamos todos e chamamos trackBatchRead uma única vez.
       */
      const readPhones: string[] = [];
      const readMsgIds: string[] = [];
      
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.read) {
          const { msgId, phone } = result.value;
          console.log(`[POLLING] Found READ message ${msgId} for ${phone}`);
          readPhones.push(phone);
          readMsgIds.push(msgId);
        }
      }
      
      // Atualizar métricas
      this.metrics.readsFoundByPolling += readPhones.length;
      
      // Batch update no banco (MELHORIA #3)
      if (readPhones.length > 0) {
        await this.analyticsService.trackBatchRead(readPhones);
        
        // Remover do pending após batch update
        for (const msgId of readMsgIds) {
          this.pendingMessages.delete(msgId);
        }
      }
      
      // Agendar próximo ciclo com intervalo adaptativo
      this.pollingInterval = setTimeout(runPollingCycle, nextInterval);
    };
    
    // Iniciar primeiro ciclo
    const initialInterval = getAdaptivePollingInterval(this.pendingMessages.size);
    this.pollingInterval = setTimeout(runPollingCycle, initialInterval);
  }
  
  /**
   * MELHORIA #4: Método público para acessar métricas de polling
   * =============================================================
   * 
   * Permite que outros componentes (ex: API, dashboard) consultem
   * o estado atual do polling para fins de monitoramento.
   * 
   * @returns Snapshot das métricas atuais
   */
  public getPollingMetrics(): PollingMetrics {
    // Retorna cópia para evitar modificação externa
    return {
      ...this.metrics,
      currentPendingCount: this.pendingMessages.size,
    };
  }

  /**
   * Retorna informações de uptime da conexão
   */
  public getUptime(): { uptimeSeconds: number | null; connectedSince: Date | null } {
    if (!this.connectionStartTime || !this.isReady) {
      return { uptimeSeconds: null, connectedSince: null };
    }
    
    const now = new Date();
    const uptimeMs = now.getTime() - this.connectionStartTime.getTime();
    
    return {
      uptimeSeconds: Math.floor(uptimeMs / 1000),
      connectedSince: this.connectionStartTime,
    };
  }

  private checkReset() {
    const now = new Date();
    if (now.getDate() !== this.lastReset.getDate()) {
      this.dailyCount = 0;
      this.lastReset = now;
    }
  }

  public getDailyCount() {
    this.checkReset();
    return this.dailyCount;
  }

  public incrementDailyCount() {
    this.checkReset();
    this.dailyCount++;
  }

  /**
   * MUDANÇA: Usa função do módulo constants
   * ANTES: Lógica inline com magic numbers
   * DEPOIS: Chamada para getRiskLevel() que encapsula a lógica
   */
  public getRiskLevel(): RiskLevel {
    return getRiskLevel(this.getDailyCount());
  }

  public getQrCode() {
    return this.qrCode;
  }

  public getStatus() {
    return {
      status: this.status,
      isAuthenticated: this.isAuthenticated,
      isReady: this.isReady,
      stats: {
        dailyCount: this.getDailyCount(),
        riskLevel: this.getRiskLevel(),
        /**
         * MUDANÇA: Usa constante ao invés de magic number
         * ANTES: recommendedLimit: 50
         * DEPOIS: recommendedLimit: SAFETY_LIMITS.RECOMMENDED_DAILY_LIMIT
         */
        recommendedLimit: SAFETY_LIMITS.RECOMMENDED_DAILY_LIMIT,
      },
    };
  }

  /**
   * MUDANÇA: Timeout agora usa constante com valor padrão descritivo
   * ANTES: private async waitForReady(timeoutMs: number = 15000)
   * DEPOIS: timeoutMs: number = TIMING.WAIT_READY_TIMEOUT_MS
   */
  private async waitForReady(timeoutMs: number = TIMING.WAIT_READY_TIMEOUT_MS): Promise<boolean> {
    if (this.isReady) return true;

    return new Promise((resolve) => {
      console.log(`Waiting ${timeoutMs}ms for client to become ready...`);

      const timeout = setTimeout(() => {
        console.warn("Timeout waiting for client readiness");
        resolve(false);
      }, timeoutMs);

      this.client.once("ready", () => {
        console.log("Client reached ready state while waiting");
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }

  public async sendMessage(
    to: string,
    message: string,
    mediaData?: { mimetype: string; data: string; filename?: string },
    options?: { fallbackName?: string },
  ) {
    if (!this.isReady) {
      if (this.status === ConnectionStatus.AUTHENTICATED) {
        console.log("Client authenticated but not ready. Waiting for sync...");
        const isNowReady = await this.waitForReady();
        if (!isNowReady) {
          throw new Error(
            `Tempo limite excedido aguardando sincronização do WhatsApp. Tente novamente em alguns segundos.`,
          );
        }
      } else {
        throw new Error(
          `Cliente WhatsApp não está pronto. Status atual: ${this.status}`,
        );
      }
    }

    this.checkReset();
    const number = to.replace(/\D/g, "");
    const candidateId = `${number}@c.us`;

    console.log(
      `Attempting to send message to ${to} (candidate: ${candidateId})`,
    );

    let finalId = candidateId;

    if (to.includes("@g.us")) {
      finalId = to;
    } else {
      try {
        const validContact = await this.client.getNumberId(candidateId);

        if (validContact && validContact._serialized) {
          finalId = validContact._serialized;
        } else {
          console.warn(`Number ${number} not found on WhatsApp.`);
          throw new Error(
            `O número ${number} não está registrado no WhatsApp.`,
          );
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        console.error("Error validating number:", e);
        throw new Error(`Falha ao validar número: ${errorMessage}`);
      }
    }

    /**
     * MUDANÇA PRINCIPAL: Formatação delegada ao MessageFormatter
     * ----------------------------------------------------------
     * 
     * ANTES (código inline no sendMessage):
     * ```typescript
     * let finalMessage = message;
     * finalMessage = finalMessage.replace(/{{phone}}/g, number);
     * if (finalMessage.includes("{{name}}") || finalMessage.includes("{{nome}}")) {
     *   try {
     *     const contact = await this.client.getContactById(finalId);
     *     const bestName = contact.pushname || contact.name || options?.fallbackName || "Cliente";
     *     finalMessage = finalMessage.replace(/{{name}}/g, bestName).replace(/{{nome}}/g, bestName);
     *   } catch (error) {
     *     // ... tratamento de erro duplicado ...
     *   }
     * }
     * ```
     * 
     * DEPOIS (delegado ao MessageFormatter):
     * ```typescript
     * let contactInfo: ContactInfo | undefined;
     * if (this.messageFormatter.hasNamePlaceholder(message)) {
     *   // Busca contato só se necessário
     *   contactInfo = await this.getContactInfo(finalId, options?.fallbackName);
     * }
     * const finalMessage = this.messageFormatter.formatMessage(message, number, contactInfo);
     * ```
     * 
     * BENEFÍCIOS:
     * - Lógica de formatação testável isoladamente
     * - Código do sendMessage mais limpo e focado
     * - Fácil adicionar novos placeholders no futuro
     */
    let contactInfo: ContactInfo | undefined;
    
    // Só busca contato se a mensagem precisar (otimização)
    if (this.messageFormatter.hasNamePlaceholder(message)) {
      try {
        const contact = await this.client.getContactById(finalId);
        contactInfo = {
          pushname: contact.pushname,
          name: contact.name,
          fallbackName: options?.fallbackName,
        };
        console.log(
          `Smart Substitution: Contact info for ${finalId} (Push: ${contact.pushname}, Name: ${contact.name}, Fallback: ${options?.fallbackName})`,
        );
      } catch (error) {
        console.warn(
          "Failed to fetch contact details for substitution, using fallback.",
          error,
        );
        contactInfo = { fallbackName: options?.fallbackName };
      }
    }

    // MUDANÇA: Usa MessageFormatter para formatar a mensagem
    const finalMessage = this.messageFormatter.formatMessage(message, number, contactInfo);

    console.log(`Sending to final ID: ${finalId}`);

    try {
      if (mediaData) {
        const media = new MessageMedia(
          mediaData.mimetype,
          mediaData.data,
          mediaData.filename,
        );
        await this.client.sendMessage(finalId, media, {
          caption: finalMessage,
          sendSeen: false,
        }).then((sentMsg) => {
          if (sentMsg && sentMsg.id) {
            this.pendingMessages.set(sentMsg.id._serialized, {
              phone: finalId.replace("@c.us", ""),
              timestamp: Date.now()
            });
          }
        });
      } else {
        const sendOptions = { linkPreview: false, sendSeen: false };

        try {
          const chat = await this.client.getChatById(finalId);
          await chat.sendMessage(finalMessage, sendOptions);
        } catch (chatError) {
          console.warn(
            "Could not get chat object, falling back to client.sendMessage",
            chatError,
          );
          await this.client.sendMessage(finalId, finalMessage, sendOptions).then((sentMsg) => {
            if (sentMsg && sentMsg.id) {
              this.pendingMessages.set(sentMsg.id._serialized, {
                phone: finalId.replace("@c.us", ""),
                timestamp: Date.now()
              });
            }
          });
        }
      }
    } catch (sendError: unknown) {
      const errorMessage =
        sendError instanceof Error ? sendError.message : "Unknown error";
      console.error("Error in client.sendMessage:", sendError);
      throw new Error(`Falha ao enviar mensagem: ${errorMessage}`);
    }

    this.incrementDailyCount();

    /**
     * MUDANÇA: Analytics delegado ao AnalyticsService
     * ------------------------------------------------
     * 
     * ANTES:
     * ```typescript
     * try {
     *   const phone = finalId.replace("@c.us", "");
     *   const { prisma } = await import("@/lib/db");
     *   await prisma.contactAnalytics.upsert({
     *     where: { phone },
     *     create: { phone, sentCount: 1, lastSentAt: new Date() },
     *     update: { sentCount: { increment: 1 }, lastSentAt: new Date() },
     *   });
     * } catch (e) {
     *   console.error("Failed to update sent analytics", e);
     * }
     * ```
     * 
     * DEPOIS:
     * ```typescript
     * const phone = finalId.replace("@c.us", "");
     * await this.analyticsService.trackMessageSent(phone);
     * ```
     * 
     * BENEFÍCIOS:
     * - Código muito mais limpo
     * - Lógica de banco encapsulada
     * - Tratamento de erro centralizado
     */
    const phone = finalId.replace("@c.us", "");
    await this.analyticsService.trackMessageSent(phone);

    return { success: true };
  }

  public async getProfilePicUrl(number: string): Promise<string | null> {
    if (!this.isReady) return null;

    try {
      const contactId = `${number.replace(/\D/g, "")}@c.us`;
      const profilePicUrl = await this.client.getProfilePicUrl(contactId);
      return profilePicUrl || null;
    } catch (error) {
      console.warn(`Failed to get profile pic for ${number}`, error);
      return null;
    }
  }

  public async logout() {
    await this.client.logout();
    this.isAuthenticated = false;
    this.isReady = false;
    this.qrCode = null;
    this.status = ConnectionStatus.DISCONNECTED;
    this.client.initialize();
  }
}

/**
 * =============================================================================
 * SINGLETON PATTERN - Instância Global
 * =============================================================================
 * 
 * MUDANÇA: Factory function para criar instância com dependências
 * ----------------------------------------------------------------
 * 
 * ANTES:
 * ```typescript
 * if (!global.whatsappClientInstance) {
 *   global.whatsappClientInstance = new WhatsAppService();
 * }
 * ```
 * 
 * DEPOIS:
 * ```typescript
 * if (!global.whatsappClientInstance) {
 *   // Cria dependências
 *   const analyticsService = new AnalyticsService(prisma);
 *   const messageFormatter = new MessageFormatter();
 *   
 *   // Injeta no construtor
 *   global.whatsappClientInstance = new WhatsAppService(
 *     analyticsService,
 *     messageFormatter
 *   );
 * }
 * ```
 * 
 * POR QUE ISSO É MELHOR?
 * 1. Dependências são explícitas e configuráveis
 * 2. Em testes, pode criar instância com mocks
 * 3. Composição raiz (composition root) fica clara
 */
if (!global.whatsappClientInstance) {
  // Criar instâncias das dependências
  const analyticsService = new AnalyticsService(prisma);
  const messageFormatter = new MessageFormatter();
  
  // Injetar dependências no WhatsAppService
  global.whatsappClientInstance = new WhatsAppService(
    analyticsService,
    messageFormatter
  );
}

const service = global.whatsappClientInstance;

/**
 * Retorna a instância do WhatsAppService para uso em outros módulos
 */
export function getWhatsAppInstance(): WhatsAppService | undefined {
  return global.whatsappClientInstance;
}

export default service;
