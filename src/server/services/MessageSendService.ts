import whatsappService from "@/lib/whatsapp";
import { SendMessageInput } from "../validators/messages";
import { normalizePhone } from "@/services/contacts/normalizePhone";
import { ValidationError, ApiError } from "@/lib/api-errors";
import { beginIdempotentOperation } from "@/lib/idempotency";
import { checkRateLimit } from "@/lib/rate-limit";
import { API_RATE_LIMITS } from "@/constants/api";
import { getCurrentWorkspaceId } from "@/server/workspace";

export const MessageSendService = {
  async sendMessage(data: SendMessageInput, clientIp: string) {
    const workspaceId = getCurrentWorkspaceId();
    const normalized = normalizePhone(data.phone);
    if (normalized.length < 10 || normalized.length > 15) {
      throw new ValidationError("O numero de telefone deve conter entre 10 e 15 digitos numericos.");
    }

    const reservation = await beginIdempotentOperation(workspaceId, data.idempotencyKey);
    let messageSent = false;

    try {
      checkRateLimit(
        `msg-limit-${workspaceId}-${clientIp}`,
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

      messageSent = true;
      await reservation.complete();

      return {
        success: true,
        response,
        stats: whatsappService.getStatus().stats,
      };
    } catch (error) {
      if (!messageSent) {
        await reservation.abort();
      }
      throw error;
    }
  },
};
export default MessageSendService;
