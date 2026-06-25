import { RateLimitError } from "./api-errors";

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitTracker>();

/**
 * Verifica e aplica limite de requisicoes em memoria (para ambiente local/desktop).
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const tracker = cache.get(key);

  if (!tracker) {
    cache.set(key, { count: 1, resetTime: now + windowMs });
    return;
  }

  if (now > tracker.resetTime) {
    tracker.count = 1;
    tracker.resetTime = now + windowMs;
    return;
  }

  tracker.count++;
  if (tracker.count > limit) {
    throw new RateLimitError();
  }
}

if (typeof setInterval !== "undefined") {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, tracker] of cache.entries()) {
      if (now > tracker.resetTime) {
        cache.delete(key);
      }
    }
  }, 60000);

  cleanupInterval.unref?.();
}
