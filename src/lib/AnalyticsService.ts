/**
 * =============================================================================
 * ANALYTICS SERVICE - Serviço de Analytics para WhatsApp
 * =============================================================================
 * 
 * PRINCÍPIO SOLID APLICADO: SRP (Single Responsibility Principle)
 * ----------------------------------------------------------------
 * 
 * O QUE É O SRP?
 * "Uma classe deve ter apenas uma razão para mudar."
 * 
 * PROBLEMA ORIGINAL:
 * A classe WhatsAppService fazia MUITAS coisas:
 * - Gerenciava conexão WhatsApp
 * - Enviava mensagens
 * - Formatava texto
 * - Salvava dados no banco de dados (Prisma)
 * 
 * Isso é chamado de "God Class" - uma classe que faz tudo.
 * 
 * POR QUE ISSO É RUIM?
 * 1. Difícil de testar (muitas dependências)
 * 2. Difícil de entender (muito código em um lugar)
 * 3. Alterações em uma funcionalidade podem quebrar outras
 * 4. Acoplamento alto com o banco de dados
 * 
 * SOLUÇÃO:
 * Extrair a responsabilidade de "analytics" (operações de banco) para esta
 * classe separada. Agora:
 * - WhatsAppService: só gerencia conexão e envio de mensagens
 * - AnalyticsService: só gerencia operações de analytics no banco
 * 
 * BENEFÍCIOS:
 * 1. Fácil de testar (pode mockar o Prisma)
 * 2. Código mais organizado e focado
 * 3. Pode trocar o banco de dados sem afetar o WhatsAppService
 * 4. Cada classe tem uma única responsabilidade
 */

import { PrismaClient } from "@prisma/client";

/**
 * Interface que define as operações de analytics
 * 
 * POR QUE USAR UMA INTERFACE?
 * ---------------------------
 * Isso facilita:
 * 1. Criar mocks para testes
 * 2. Trocar a implementação (ex: usar outro banco)
 * 3. Documentar o contrato público da classe
 * 
 * PRINCÍPIO: "Programe para interfaces, não para implementações"
 */
export interface IAnalyticsService {
  /**
   * Registra que uma mensagem foi enviada para um contato
   * @param phone - Número de telefone (sem @c.us)
   */
  trackMessageSent(phone: string): Promise<void>;
  
  /**
   * Registra que uma mensagem foi lida pelo contato
   * @param phone - Número de telefone (sem @c.us)
   */
  trackMessageRead(phone: string): Promise<void>;
  
  /**
   * MELHORIA #3: Registra múltiplas leituras em batch
   * @param phones - Array de números de telefone que tiveram leitura confirmada
   */
  trackBatchRead(phones: string[]): Promise<void>;
}

/**
 * Implementação do serviço de analytics usando Prisma
 * 
 * INJEÇÃO DE DEPENDÊNCIA (DIP):
 * ----------------------------
 * O PrismaClient é recebido pelo construtor, não criado internamente.
 * 
 * ANTES (acoplamento forte):
 * ```typescript
 * class AnalyticsService {
 *   private prisma = new PrismaClient(); // Cria internamente - RUIM!
 * }
 * ```
 * 
 * DEPOIS (desacoplado):
 * ```typescript
 * class AnalyticsService {
 *   constructor(private prisma: PrismaClient) {} // Recebe externamente - BOM!
 * }
 * ```
 * 
 * POR QUE ISSO É MELHOR?
 * 1. Em testes, podemos passar um mock do Prisma
 * 2. Se precisar mudar o cliente, só muda onde instancia
 * 3. A classe não "sabe" como o Prisma foi configurado
 */
export class AnalyticsService implements IAnalyticsService {
  /**
   * @param prisma - Instância do PrismaClient injetada externamente
   * 
   * NOTA SOBRE "private" NO PARÂMETRO:
   * Quando usamos `private` no parâmetro do construtor, o TypeScript
   * automaticamente cria uma propriedade privada com esse valor.
   * É um atalho para:
   * ```typescript
   * private prisma: PrismaClient;
   * constructor(prisma: PrismaClient) {
   *   this.prisma = prisma;
   * }
   * ```
   */
  constructor(private prisma: PrismaClient) {}

  /**
   * Registra uma mensagem enviada no banco de dados
   * 
   * LÓGICA:
   * - Se o contato já existe: incrementa sentCount e atualiza lastSentAt
   * - Se não existe: cria novo registro com sentCount = 1
   * 
   * UPSERT:
   * O método `upsert` do Prisma faz UPDATE ou INSERT automaticamente.
   * É mais eficiente que fazer SELECT + IF + INSERT/UPDATE separados.
   * 
   * @param phone - Número de telefone normalizado (apenas dígitos)
   */
  async trackMessageSent(phone: string): Promise<void> {
    try {
      await this.prisma.contactAnalytics.upsert({
        // WHERE: busca pelo telefone (campo único)
        where: { phone },
        
        // CREATE: se não encontrar, cria com esses dados
        create: {
          phone,
          sentCount: 1,
          lastSentAt: new Date(),
        },
        
        // UPDATE: se encontrar, atualiza esses campos
        update: {
          // { increment: 1 } é uma operação atômica do Prisma
          // É mais seguro que fazer: sentCount = sentCount + 1
          // porque evita race conditions
          sentCount: { increment: 1 },
          lastSentAt: new Date(),
        },
      });
      
      console.log(`[ANALYTICS] Tracked sent message to ${phone}`);
    } catch (error) {
      // TRATAMENTO DE ERROS:
      // Logamos o erro mas não propagamos (throw).
      // Analytics falhando não deve impedir o envio de mensagens.
      // Isso é uma decisão de design: analytics é "best effort".
      console.error("[ANALYTICS] Failed to track sent message:", error);
    }
  }

  /**
   * Registra uma mensagem lida no banco de dados
   * 
   * Este método é chamado quando recebemos um ACK de leitura (ack === 3)
   * do WhatsApp, indicando que o destinatário visualizou a mensagem.
   * 
   * CORREÇÃO DE BUG:
   * ----------------
   * Antes: usava upsert que CRIAVA registro se não existisse
   * Problema: criava registros com readCount mas sem sentCount
   * 
   * Depois: usa updateMany que SÓ atualiza se existir
   * Lógica: uma leitura só pode acontecer após um envio
   * 
   * @param phone - Número de telefone normalizado (apenas dígitos)
   */
  async trackMessageRead(phone: string): Promise<void> {
    try {
      // Usar updateMany ao invés de upsert
      // Isso garante que só atualizamos registros existentes
      // Uma leitura sem envio prévio não faz sentido
      const result = await this.prisma.contactAnalytics.updateMany({
        where: { phone },
        data: {
          readCount: { increment: 1 },
          lastReadAt: new Date(),
        },
      });
      
      if (result.count > 0) {
        console.log(`[ANALYTICS] Tracked read message for ${phone}`);
      } else {
        console.log(`[ANALYTICS] No record found for ${phone}, skipping read count`);
      }
    } catch (error) {
      console.error("[ANALYTICS] Failed to track read message:", error);
    }
  }

  /**
   * MELHORIA #3: Batch de operações de leitura
   * ==========================================
   * 
   * PROBLEMA ORIGINAL:
   * Quando o polling encontra N mensagens lidas, faz N chamadas ao banco:
   * ```typescript
   * for (msg of messages) {
   *   await this.trackMessageRead(phone); // N queries!
   * }
   * ```
   * 
   * SOLUÇÃO:
   * Agrupar todas as operações em uma única transação:
   * ```typescript
   * await this.trackBatchRead(phones); // 1 transaction com N operações
   * ```
   * 
   * BENEFÍCIOS:
   * - Menos roundtrips para o banco
   * - Atomicidade: ou todas funcionam ou nenhuma
   * - Melhor performance sob alta carga
   * 
   * @param phones - Array de números que tiveram leitura confirmada
   */
  async trackBatchRead(phones: string[]): Promise<void> {
    if (phones.length === 0) return;
    
    // Se só tem um, usa o método normal (mais simples)
    if (phones.length === 1) {
      return this.trackMessageRead(phones[0]);
    }
    
    try {
      /**
       * CORREÇÃO: Usar updateMany ao invés de upsert
       * 
       * Mesmo problema que trackMessageRead:
       * - upsert criava registros com readCount mas sem sentCount
       * - updateMany só atualiza registros existentes
       */
      const operations = phones.map((phone) =>
        this.prisma.contactAnalytics.updateMany({
          where: { phone },
          data: {
            readCount: { increment: 1 },
            lastReadAt: new Date(),
          },
        })
      );
      
      const results = await this.prisma.$transaction(operations);
      const updated = results.reduce((sum, r) => sum + r.count, 0);
      
      console.log(`[ANALYTICS] Batch tracked ${updated}/${phones.length} read messages`);
    } catch (error) {
      // Em caso de erro no batch, tenta individualmente como fallback
      console.error("[ANALYTICS] Batch failed, falling back to individual:", error);
      for (const phone of phones) {
        await this.trackMessageRead(phone);
      }
    }
  }
}

/**
 * =============================================================================
 * EXEMPLO DE USO
 * =============================================================================
 * 
 * ```typescript
 * import { prisma } from "@/lib/db";
 * import { AnalyticsService } from "@/lib/AnalyticsService";
 * 
 * // Criar instância com injeção de dependência
 * const analyticsService = new AnalyticsService(prisma);
 * 
 * // Usar
 * await analyticsService.trackMessageSent("5511999999999");
 * await analyticsService.trackMessageRead("5511999999999");
 * ```
 * 
 * PARA TESTES:
 * ```typescript
 * // Criar mock do Prisma
 * const mockPrisma = {
 *   contactAnalytics: {
 *     upsert: jest.fn(),
 *   },
 * };
 * 
 * // Injetar mock
 * const analyticsService = new AnalyticsService(mockPrisma as any);
 * 
 * // Testar
 * await analyticsService.trackMessageSent("123");
 * expect(mockPrisma.contactAnalytics.upsert).toHaveBeenCalled();
 * ```
 */
