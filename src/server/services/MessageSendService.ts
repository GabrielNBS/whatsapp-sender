import whatsappService from "@/lib/whatsapp";
import { SendMessageInput } from "../validators/messages";
import { normalizePhone } from "@/services/contacts/normalizePhone";
import { ValidationError, ApiError } from "@/lib/api-errors";
import { beginIdempotentOperation } from "@/lib/idempotency";
import { checkRateLimit } from "@/lib/rate-limit";
import { API_RATE_LIMITS } from "@/constants/api";

export const MessageSendService = {
  async sendMessage(data: SendMessageInput, clientIp: string) {
    const normalized = normalizePhone(data.phone);
    if (normalized.length < 10 || normalized.length > 15) {
      throw new ValidationError("O numero de telefone deve conter entre 10 e 15 digitos numericos.");
    }

    const reservation = beginIdempotentOperation(data.idempotencyKey);

    try {
      checkRateLimit(
        `msg-limit-${clientIp}`,
        API_RATE_LIMITS.SPAM_LIMIT,
        API_RATE_LIMITS.SPAM_WINDOW_MS
      );

      const response = await whatsappService.sendMessage(
        normalized,
        data.message || "",
        data.media || undefined
      );

      if (!response.success) {
        throw new ApiError(422, "WHATSAPP_SEND_FAILED", "Falha ao enviar mensagem pelo WhatsApp. Verifique a conexao do dispositivo.");
      }

      reservation.complete();

      return {
        success: true,
        response,
        stats: whatsappService.getStatus().stats,
      };
    } catch (error) {
      reservation.abort();
      throw error;
    }
  },
};
export default MessageSendService;
