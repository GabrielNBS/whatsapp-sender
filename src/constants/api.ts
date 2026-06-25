export const API_RATE_LIMITS = {
  // Limite padrão para consultas rápidas
  DEFAULT_LIMIT: 100,
  DEFAULT_WINDOW_MS: 60 * 1000, // 1 minuto

  // Limite mais agressivo para polling
  POLLING_LIMIT: 30,
  POLLING_WINDOW_MS: 30 * 1000, // 30 segundos

  // Limite rígido para disparos e testes de spam
  SPAM_LIMIT: 5,
  SPAM_WINDOW_MS: 10 * 1000, // 10 segundos
} as const;

export const API_MAX_PAGE_SIZE = 100;
export const API_DEFAULT_PAGE_SIZE = 20;
