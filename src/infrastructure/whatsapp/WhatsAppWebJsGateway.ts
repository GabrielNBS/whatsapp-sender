import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";

import type { IAnalyticsService } from "@/lib/AnalyticsService";
import type { IMessageFormatter, ContactInfo } from "@/lib/MessageFormatter";
import { resolveWhatsAppAuthPath } from "@/lib/service-paths";
import { logger } from "@/lib/logger";
import type { WhatsAppGateway } from '@/server/ports/WhatsAppGateway';
import type { IncomingWhatsAppMessageHandler } from '@/server/services/IncomingWhatsAppMessageHandler';
import { WhatsAppConnectionManager } from './WhatsAppConnectionManager';
import {
  MessageAckStatus,
  ConnectionStatus,
  RiskLevel,
  TIMING,
  getAdaptivePollingInterval,
} from "@/lib/constants";

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
export class WhatsAppService implements WhatsAppGateway {
  private client: Client;
  private readonly connection = new WhatsAppConnectionManager();
  
  // Polling Queue
  private pendingMessages: Map<string, PendingMessageData> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private initializationPromise: Promise<void> | null = null;
  private reconnectEnabled = true;
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
    private messageFormatter: IMessageFormatter,
    private incomingMessageHandler: IncomingWhatsAppMessageHandler,
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
    });

    this.initializeEvents();
    void this.initializeClient("inicializacao inicial");
    
    this.startPolling();
  }

  /**
   * Todas as entradas do ciclo de conexao passam por aqui. A biblioteca nao
   * aceita duas chamadas de `initialize` para o mesmo perfil Chromium; por
   * isso chamadas simultaneas compartilham a mesma promise.
   */
  private initializeClient(reason: string): Promise<void> {
    if (this.initializationPromise) {
      this.debugLog(`[WhatsApp] Inicializacao ja em andamento; reutilizando (${reason}).`);
      return this.initializationPromise;
    }

    this.connection.markInitializing();
    logger.info({ reason }, "[WhatsApp] Iniciando cliente WhatsApp");

    this.initializationPromise = this.client.initialize()
      .catch((err: unknown) => {
        logger.error({ err, reason }, "[WhatsApp] Erro na inicializacao do cliente");
        this.connection.markDisconnected(this.getConnectionError(err));
      })
      .finally(() => {
        this.initializationPromise = null;
      });

    return this.initializationPromise;
  }

  private clearReconnectTimer() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectEnabled || this.reconnectTimeout || this.initializationPromise) {
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;

      if (!this.reconnectEnabled) {
        return;
      }

      logger.info("[WhatsApp] Tentando reconectar...");
      void this.initializeClient("reconexao");
    }, TIMING.RECONNECT_DELAY_MS);
  }

  private initializeEvents() {
    this.client.on("qr", (qr) => {
      logger.info("[WhatsApp] Novo QR Code gerado para autenticacao");
      this.connection.markQrReady(qr);
    });

    this.client.on("ready", () => {
      logger.info("[WhatsApp] Cliente WhatsApp conectado e pronto!");
      this.connection.markReady();
    });

    this.client.on("authenticated", () => {
      logger.info("[WhatsApp] Sessao autenticada com sucesso. Sincronizando dados...");
      this.connection.markAuthenticated();
    });

    this.client.on("auth_failure", (msg) => {
      logger.error({ msg }, "[WhatsApp] Falha na autenticacao do cliente");
      this.connection.markAuthenticationFailure("A autenticacao falhou. Aguarde a geracao de um novo QR Code.");
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

    this.client.on("message", (msg) => {
      void this.incomingMessageHandler.handle(msg);
    });

    this.client.on("disconnected", (reason) => {
      logger.warn({ reason }, "[WhatsApp] Cliente foi desconectado");
      this.connection.markDisconnected();
      this.pendingMessages.clear();
      this.metrics.currentPendingCount = 0;

      if (!this.reconnectEnabled) {
        logger.info("[WhatsApp] Reconexao automatica ignorada durante logout intencional.");
        return;
      }

      this.scheduleReconnect();
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
      if (!this.connection.isReady() || this.pendingMessages.size === 0) {
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
    return this.connection.getUptime();
  }

  public getDailyCount() {
    return this.connection.getDailyCount();
  }

  public incrementDailyCount() {
    this.connection.incrementDailyCount();
  }

  public getRiskLevel(): RiskLevel {
    return this.connection.getRiskLevel();
  }

  public getQrCode() {
    return this.connection.getQrCode();
  }

  private getConnectionError(error: unknown): string {
    if (error instanceof Error && error.message.includes("browser is already running")) {
      return "A sessao do WhatsApp ja esta sendo usada por outra instancia da aplicacao. Encerre a outra instancia e recarregue esta pagina.";
    }

    return "Nao foi possivel iniciar o WhatsApp Web. Verifique o Chromium e tente novamente.";
  }

  public getStatus() {
    return this.connection.getSnapshot();
  }

  private async waitForReady(timeoutMs: number = TIMING.WAIT_READY_TIMEOUT_MS): Promise<boolean> {
    if (this.connection.isReady()) return true;
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
    if (!this.connection.isReady()) {
      if (this.connection.getConnectionStatus() === ConnectionStatus.AUTHENTICATED) {
        this.debugLog("Client authenticated but not ready. Waiting for sync...");
        const isNowReady = await this.waitForReady();
        if (!isNowReady) {
          throw new Error(
            `Tempo limite excedido aguardando sincronização do WhatsApp. Tente novamente em alguns segundos.`,
          );
        }
      } else {
        throw new Error(
          `Cliente WhatsApp não está pronto. Status atual: ${this.connection.getConnectionStatus()}`,
        );
      }
    }

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
    if (!this.connection.isReady()) return null;

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
    this.reconnectEnabled = false;
    this.clearReconnectTimer();

    try {
      await this.client.logout();
    } finally {
      this.connection.markDisconnected();
      this.reconnectEnabled = true;

      // O evento `disconnected` gerado pelo logout nao agenda outro cliente.
      // Esta e a unica reinicializacao que abre o QR de uma nova sessao.
      await this.initializeClient("logout intencional");
    }
  }
}
