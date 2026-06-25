import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  base: {
    env: process.env.NODE_ENV,
    service: "whatsapp-sender-api",
  },
  redact: {
    paths: [
      "authorization",
      "headers.authorization",
      "headers.x-app-token",
      "x-app-token",
      "appToken",
      "token",
      "phone",
      "phones",
      "contactPhone",
      "details.phone",
      "details.contactPhone",
      "req.headers.authorization",
      "req.headers.x-app-token",
    ],
    censor: "[REDACTED]",
  },
});

/**
 * Mascara um número de telefone para evitar exposição nos logs (API-004).
 * Ex: "5511988887777" -> "55119****7777"
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) return '***';
  return `${clean.slice(0, 5)}****${clean.slice(-4)}`;
}

/**
 * Mascara nomes nos logs para preservar privacidade.
 * Ex: "Gabriel NBS" -> "G***l N**"
 */
export function maskName(name?: string | null): string {
  if (!name) return '';
  const trimmed = name.trim();
  const parts = trimmed.split(' ');
  return parts
    .map((part) => {
      if (part.length <= 2) return part;
      return `${part[0]}***${part[part.length - 1]}`;
    })
    .join(' ');
}