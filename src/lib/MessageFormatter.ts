/**
 * =============================================================================
 * MESSAGE FORMATTER - Serviço de Formatação de Mensagens
 * =============================================================================
 * 
 * PRINCÍPIO SOLID APLICADO: SRP (Single Responsibility Principle)
 * ----------------------------------------------------------------
 * 
 * PROBLEMA ORIGINAL:
 * A classe WhatsAppService tinha código de formatação de mensagens misturado
 * com lógica de envio. O método sendMessage fazia:
 * 1. Validar número
 * 2. Substituir variáveis ({{name}}, {{phone}}) <- FORMATAÇÃO
 * 3. Enviar mensagem
 * 4. Salvar analytics
 * 
 * PROBLEMA COM ISSO:
 * - Se precisar mudar como variáveis são substituídas, mexe no sendMessage
 * - Difícil testar formatação isoladamente
 * - Código do sendMessage fica muito longo e confuso
 * 
 * SOLUÇÃO:
 * Extrair toda lógica de formatação para esta classe dedicada.
 * Agora a formatação pode:
 * - Ser testada de forma isolada
 * - Ser reutilizada em outros contextos
 * - Evoluir independentemente do envio
 */

import { MESSAGE_PATTERNS, DEFAULT_CONTACT_NAME } from "./constants";

/**
 * Interface que representa informações de um contato
 * 
 * POR QUE UMA INTERFACE SEPARADA?
 * -------------------------------
 * O WhatsApp retorna um objeto Contact com muitas propriedades.
 * Esta interface define APENAS o que precisamos para formatação.
 * 
 * Isso é o princípio ISP (Interface Segregation Principle):
 * "Clientes não devem depender de interfaces que não usam"
 * 
 * Se usássemos o tipo Contact completo do WhatsApp, estaríamos
 * acoplados a uma estrutura externa que pode mudar.
 */
export interface ContactInfo {
  /** Nome que o próprio contato definiu no WhatsApp */
  pushname?: string;
  
  /** Nome salvo na agenda do usuário (se sincronizado) */
  name?: string;
  
  /** Nome que temos no nosso banco de dados como fallback */
  fallbackName?: string;
}

/**
 * Interface do serviço de formatação
 * 
 * Usar interface permite criar mocks facilmente em testes
 */
export interface IMessageFormatter {
  /**
   * Formata uma mensagem substituindo variáveis pelos valores reais
   * 
   * @param template - Mensagem com placeholders (ex: "Olá {{name}}!")
   * @param phone - Número do telefone para substituir {{phone}}
   * @param contact - Informações do contato para substituir {{name}}
   * @returns Mensagem formatada com valores substituídos
   */
  formatMessage(template: string, phone: string, contact?: ContactInfo): string;
  
  /**
   * Verifica se uma mensagem contém placeholders de nome
   * 
   * @param template - Mensagem a verificar
   * @returns true se contém {{name}} ou {{nome}}
   */
  hasNamePlaceholder(template: string): boolean;
  
  /**
   * Obtém o melhor nome disponível para um contato
   * 
   * @param contact - Informações do contato
   * @returns Nome mais apropriado ou fallback padrão
   */
  getBestName(contact?: ContactInfo): string;
}

/**
 * Implementação do serviço de formatação de mensagens
 * 
 * STATELESS (sem estado):
 * -----------------------
 * Esta classe não armazena nenhum dado entre chamadas.
 * Cada método recebe tudo que precisa como parâmetro.
 * 
 * Isso é bom porque:
 * 1. Não há efeitos colaterais
 * 2. Fácil de testar (entrada -> saída)
 * 3. Thread-safe (múltiplas chamadas não interferem)
 * 4. Pode ser reutilizada sem preocupação
 */
export class MessageFormatter implements IMessageFormatter {
  /**
   * Formata uma mensagem substituindo placeholders por valores reais
   * 
   * VARIÁVEIS SUPORTADAS:
   * - {{phone}} -> número de telefone do destinatário
   * - {{name}}  -> nome do contato (inglês)
   * - {{nome}}  -> nome do contato (português)
   * 
   * PRIORIDADE DO NOME:
   * 1. pushname: nome que o contato definiu no próprio WhatsApp
   * 2. name: nome salvo na agenda (se sincronizado)
   * 3. fallbackName: nome do nosso banco de dados
   * 4. "Cliente": fallback genérico
   * 
   * @example
   * ```typescript
   * const formatter = new MessageFormatter();
   * 
   * // Substituição de telefone
   * formatter.formatMessage("Seu número é {{phone}}", "5511999999999");
   * // Resultado: "Seu número é 5511999999999"
   * 
   * // Substituição de nome
   * formatter.formatMessage("Olá {{name}}!", "123", { pushname: "João" });
   * // Resultado: "Olá João!"
   * ```
   */
  formatMessage(template: string, phone: string, contact?: ContactInfo): string {
    // Começamos com o template original
    let result = template;
    
    // PASSO 1: Substituir {{phone}} pelo número
    // -----------------------------------------
    // Usamos a constante MESSAGE_PATTERNS.PHONE ao invés de /{{phone}}/g
    // Isso centraliza o padrão e facilita mudanças futuras
    result = result.replace(MESSAGE_PATTERNS.PHONE, phone);
    
    // PASSO 2: Substituir {{name}} e {{nome}} pelo nome do contato
    // ------------------------------------------------------------
    // getBestName() encapsula a lógica de escolher o melhor nome
    // Isso evita duplicar a lógica de prioridade aqui
    const name = this.getBestName(contact);
    
    result = result.replace(MESSAGE_PATTERNS.NAME, name);
    result = result.replace(MESSAGE_PATTERNS.NAME_PT, name);
    
    return result;
  }
  
  /**
   * Verifica se a mensagem contém placeholders de nome
   * 
   * UTILIDADE:
   * ----------
   * No WhatsAppService original, havia código que buscava informações
   * do contato APENAS se a mensagem tivesse {{name}} ou {{nome}}.
   * 
   * Este método permite fazer essa verificação de forma limpa:
   * 
   * ```typescript
   * if (formatter.hasNamePlaceholder(message)) {
   *   // Só busca contato se realmente precisar
   *   const contact = await client.getContactById(id);
   * }
   * ```
   * 
   * OTIMIZAÇÃO:
   * Evita chamadas desnecessárias à API do WhatsApp quando
   * a mensagem não usa variáveis de nome.
   */
  hasNamePlaceholder(template: string): boolean {
    // Usamos .test() que é mais eficiente que .match() quando
    // só queremos saber se existe match (não precisamos do resultado)
    return (
      MESSAGE_PATTERNS.NAME.test(template) || 
      MESSAGE_PATTERNS.NAME_PT.test(template)
    );
  }
  
  /**
   * Obtém o melhor nome disponível para um contato
   * 
   * LÓGICA DE PRIORIDADE:
   * ---------------------
   * 1. pushname: Preferimos porque é o nome que o próprio usuário escolheu
   *    para aparecer no WhatsApp. É o mais "pessoal".
   * 
   * 2. name: Nome da agenda. Pode ser útil se pushname não existir.
   * 
   * 3. fallbackName: Nome que temos no nosso sistema (importado de CSV, etc).
   *    Usado quando WhatsApp não tem informações.
   * 
   * 4. DEFAULT_CONTACT_NAME ("Cliente"): Fallback final genérico.
   *    Evita mostrar "undefined" ou campos vazios.
   * 
   * OPERADOR NULLISH COALESCING (??):
   * ---------------------------------
   * Usamos ?? ao invés de || porque:
   * - || considera "" (string vazia) como falsy
   * - ?? só considera null/undefined como "sem valor"
   * 
   * Se o pushname for "", queremos usar o próximo valor, então || está ok aqui.
   * Mas poderíamos usar ?? se quiséssemos aceitar strings vazias.
   */
  getBestName(contact?: ContactInfo): string {
    if (!contact) {
      return DEFAULT_CONTACT_NAME;
    }
    
    // Encadeamento com || para primeiro valor "truthy"
    // Uma string vazia ("") é falsy, então pula para o próximo
    return (
      contact.pushname || 
      contact.name || 
      contact.fallbackName || 
      DEFAULT_CONTACT_NAME
    );
  }
}

/**
 * =============================================================================
 * EXEMPLOS DE USO E TESTES
 * =============================================================================
 * 
 * USO BÁSICO:
 * ```typescript
 * import { MessageFormatter } from "@/lib/MessageFormatter";
 * 
 * const formatter = new MessageFormatter();
 * 
 * const message = formatter.formatMessage(
 *   "Olá {{name}}, seu número é {{phone}}!",
 *   "5511999999999",
 *   { pushname: "Maria" }
 * );
 * // Resultado: "Olá Maria, seu número é 5511999999999!"
 * ```
 * 
 * TESTE UNITÁRIO:
 * ```typescript
 * describe("MessageFormatter", () => {
 *   const formatter = new MessageFormatter();
 *   
 *   it("should replace phone placeholder", () => {
 *     const result = formatter.formatMessage("Tel: {{phone}}", "123");
 *     expect(result).toBe("Tel: 123");
 *   });
 *   
 *   it("should use pushname as priority", () => {
 *     const result = formatter.formatMessage("Oi {{name}}", "123", {
 *       pushname: "João",
 *       name: "João Silva",
 *       fallbackName: "Cliente João"
 *     });
 *     expect(result).toBe("Oi João");
 *   });
 *   
 *   it("should use fallback when no contact info", () => {
 *     const result = formatter.formatMessage("Oi {{name}}", "123");
 *     expect(result).toBe("Oi Cliente");
 *   });
 * });
 * ```
 */
