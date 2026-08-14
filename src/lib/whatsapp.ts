import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";

import { prisma } from "./db";
import { AnalyticsService, IAnalyticsService } from "./AnalyticsService";
import { MessageFormatter, IMessageFormatter, ContactInfo } from "./MessageFormatter";
import { resolveWhatsAppAuthPath } from "./service-paths";
import { logger } from "./logger";
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

interface PendingMessageData {
  phone: string;
  timestamp: number;
}

export interface PollingMetrics {
  pollingCycles: number;
  readsFoundByPolling: number;
  readsFoundByEvent: number;
  currentPendingCount: number;
  currentIntervalMs: number;
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
  
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  
  // Safety Handling
  private dailyCount: number = 0;
  private lastReset: Date = new Date();
  
  // Connection tracking for uptime
  private connectionStartTime: Date | null = null;
  
  // Polling Queue
  private pendingMessages: Map<string, PendingMessageData> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private waitReadyPromise: Promise<boolean> | null = null;
  
  private metrics: PollingMetrics = {
    pollingCycles: 0,
    readsFoundByPolling: 0,
    readsFoundByEvent: 0,
    currentPendingCount: 0,
    currentIntervalMs: TIMING.ADAPTIVE_POLLING.IDLE_INTERVAL_MS,
    lastPollingTime: null,
  };

  private debugLog(message: string, ...args: unknown[]) {
    if (args.length > 0) {
      logger.debug({ extra: args }, message);
    } else {
      logger.debug(message);
    }
  }

  constructor(
    private analyticsService: IAnalyticsService,
    private messageFormatter: IMessageFormatter
  ) {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    logger.info("[WhatsApp] Inicializando servico WhatsApp...");
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: resolveWhatsAppAuthPath(),
      }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        ...(executablePath ? { executablePath } : {}),
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
      logger.error({ err }, "[WhatsApp] Erro na inicializacao do cliente");
      this.status = ConnectionStatus.DISCONNECTED;
    });
    
    this.startPolling();
  }

  private initializeEvents() {
    this.client.on("qr", (qr) => {
      logger.info("[WhatsApp] Novo QR Code gerado para autenticacao");
      this.qrCode = qr;
      this.status = ConnectionStatus.QR_READY;
    });

    this.client.on("ready", () => {
      logger.info("[WhatsApp] Cliente WhatsApp conectado e pronto!");
      this.isReady = true;
      this.status = ConnectionStatus.READY;
      this.qrCode = null;
      this.connectionStartTime = new Date();
    });

    this.client.on("authenticated", () => {
      logger.info("[WhatsApp] Sessao autenticada com sucesso. Sincronizando dados...");
      this.isAuthenticated = true;
      this.status = ConnectionStatus.AUTHENTICATED;
      this.qrCode = null;
    });

    this.client.on("auth_failure", (msg) => {
      logger.error({ msg }, "[WhatsApp] Falha na autenticacao do cliente");
      this.status = ConnectionStatus.DISCONNECTED;
    });

    this.client.on("change_state", (state) => {
      logger.info({ state }, `[WhatsApp] Estado da conexao alterado: ${state}`);
    });

    this.client.on("message_create", (msg) => {
      if (msg.fromMe) {
        this.debugLog("[WhatsApp] Mensagem enviada para:", msg.to);
      } else {
        this.debugLog("[WhatsApp] Mensagem recebida de:", msg.from);
      }
    });

    this.client.on("disconnected", (reason) => {
      logger.warn({ reason }, "[WhatsApp] Cliente foi desconectado");
      this.isAuthenticated = false;
      this.isReady = false;
      this.status = ConnectionStatus.DISCONNECTED;
      this.pendingMessages.clear();
      this.metrics.currentPendingCount = 0;

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.reconnectTimeout = setTimeout(() => {
        logger.info("[WhatsApp] Tentando reconectar...");
        this.status = ConnectionStatus.INITIALIZING;
        this.client.initialize().catch((err) => {
          logger.error({ err }, "[WhatsApp] Erro na tentativa de reconexao");
          this.status = ConnectionStatus.DISCONNECTED;
        });
      }, TIMING.RECONNECT_DELAY_MS);
    });

    this.client.on("message_ack", async (msg, ack) => {
      const phone = msg.to.replace("@c.us", "");
      this.debugLog(
        `[ACK DEBUG] Message to ${phone} status update: ${ack} (${MessageAckStatus.READ}=Read, ${MessageAckStatus.DELIVERED}=Delivered, ${MessageAckStatus.SENT}=Sent)`,
      );
      
      const isOurMessage = this.pendingMessages.has(msg.id._serialized);
      
      if (!isOurMessage) {
        this.debugLog(`[ACK DEBUG] Ignoring ACK for message not sent by app: ${msg.id._serialized}`);
        return;
      }
      
      if ((ack as number) >= MessageAckStatus.READ) {
        this.pendingMessages.delete(msg.id._serialized);
      }

      if ((ack as number) === MessageAckStatus.READ) {
        this.debugLog(`[ACK DEBUG] Marking as READ for ${phone}`);
        this.metrics.readsFoundByEvent++;
        await this.analyticsService.trackMessageRead(phone);
        this.debugLog(`[ACK DEBUG] Database updated for ${phone}`);
      }
    });
  }
  
  // Recursive polling prevents overlapping cycles and adapts to queue load.
  private startPolling() {
    if (this.pollingInterval) return;
    
    this.debugLog("[POLLING] Starting adaptive ack check service...");
    
    const runPollingCycle = async () => {
      // Atualizar métricas de pending count
      this.metrics.currentPendingCount = this.pendingMessages.size;
      
      // Calculate first so the same interval is used for logging and scheduling.
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
      
      this.debugLog(`[POLLING] Cycle #${this.metrics.pollingCycles}: Checking ${this.pendingMessages.size} messages (next in ${nextInterval}ms)...`);
      
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
          this.debugLog(`[POLLING] Error checking message ${msgId}`, e);
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
          this.debugLog(`[POLLING] Found READ message ${msgId} for ${phone}`);
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

  private trackPendingMessage(sentMsg: unknown, finalId: string): void {
    const msg = sentMsg as { id?: { _serialized?: string } } | null;
    const msgId = msg?.id?._serialized;
    if (!msgId) {
      return;
    }

    this.pendingMessages.set(msgId, {
      phone: finalId.replace("@c.us", ""),
      timestamp: Date.now(),
    });
    this.metrics.currentPendingCount = this.pendingMessages.size;
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
        recommendedLimit: SAFETY_LIMITS.RECOMMENDED_DAILY_LIMIT,
      },
    };
  }

  private async waitForReady(timeoutMs: number = TIMING.WAIT_READY_TIMEOUT_MS): Promise<boolean> {
    if (this.isReady) return true;
    if (this.waitReadyPromise) return this.waitReadyPromise;

    this.waitReadyPromise = new Promise((resolve) => {
      this.debugLog(`Waiting ${timeoutMs}ms for client to become ready...`);

      const onReady = () => {
        this.debugLog("Client reached ready state while waiting");
        clearTimeout(timeout);
        resolve(true);
      };

      const timeout = setTimeout(() => {
        this.client.off("ready", onReady);
        logger.warn("Timeout waiting for client readiness");
        resolve(false);
      }, timeoutMs);

      this.client.once("ready", onReady);
    });

    try {
      return await this.waitReadyPromise;
    } finally {
      this.waitReadyPromise = null;
    }
  }

  public async sendMessage(
    to: string,
    message: string,
    mediaData?: { mimetype: string; data: string; filename?: string },
    options?: { fallbackName?: string },
  ) {
    if (!this.isReady) {
      if (this.status === ConnectionStatus.AUTHENTICATED) {
        this.debugLog("Client authenticated but not ready. Waiting for sync...");
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

    this.debugLog(
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
          logger.warn({ phone: number }, "Number not found on WhatsApp");
          throw new Error(
            `O número ${number} não está registrado no WhatsApp.`,
          );
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        logger.error({ err: e }, "Error validating number");
        throw new Error(`Falha ao validar número: ${errorMessage}`);
      }
    }

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
        this.debugLog(
          `Smart Substitution: Contact info for ${finalId} (Push: ${contact.pushname}, Name: ${contact.name}, Fallback: ${options?.fallbackName})`,
        );
      } catch (error) {
        logger.warn(
          { err: error },
          "Failed to fetch contact details for substitution, using fallback.",
        );
        contactInfo = { fallbackName: options?.fallbackName };
      }
    }

    const finalMessage = this.messageFormatter.formatMessage(message, number, contactInfo);

    this.debugLog(`Sending to final ID: ${finalId}`);

    try {
      if (mediaData) {
        const media = new MessageMedia(
          mediaData.mimetype,
          mediaData.data,
          mediaData.filename,
        );
        const sentMsg = await this.client.sendMessage(finalId, media, {
          caption: finalMessage,
          sendSeen: false,
        });
        this.trackPendingMessage(sentMsg, finalId);
      } else {
        const sendOptions = { linkPreview: false, sendSeen: false };

        try {
          const chat = await this.client.getChatById(finalId);
          const sentMsg = await chat.sendMessage(finalMessage, sendOptions);
          this.trackPendingMessage(sentMsg, finalId);
        } catch (chatError) {
          logger.warn(
            { err: chatError },
            "Could not get chat object, falling back to client.sendMessage",
          );
          const sentMsg = await this.client.sendMessage(finalId, finalMessage, sendOptions);
          this.trackPendingMessage(sentMsg, finalId);
        }
      }
    } catch (sendError: unknown) {
      const errorMessage =
        sendError instanceof Error ? sendError.message : "Unknown error";
      logger.error({ err: sendError }, "Error in client.sendMessage");
      throw new Error(`Falha ao enviar mensagem: ${errorMessage}`);
    }

    this.incrementDailyCount();

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
      logger.warn({ phone: number, err: error }, "Failed to get profile pic");
      return null;
    }
  }

  public async logout() {
    this.pendingMessages.clear();
    this.metrics.currentPendingCount = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    await this.client.logout();
    this.isAuthenticated = false;
    this.isReady = false;
    this.qrCode = null;
    this.status = ConnectionStatus.DISCONNECTED;
    this.client.initialize();
  }
}

function createWhatsAppService(): WhatsAppService {
  const analyticsService = new AnalyticsService(prisma);
  const messageFormatter = new MessageFormatter();

  return new WhatsAppService(analyticsService, messageFormatter);
}

const service = new Proxy({} as WhatsAppService, {
  get(_target, property, receiver) {
    const instance = getWhatsAppInstance();
    const value = Reflect.get(instance, property, receiver);

    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export function getWhatsAppInstance(): WhatsAppService {
  if (!global.whatsappClientInstance) {
    global.whatsappClientInstance = createWhatsAppService();
  }

  return global.whatsappClientInstance;
}

export function peekWhatsAppInstance(): WhatsAppService | undefined {
  return global.whatsappClientInstance;
}

export default service;
