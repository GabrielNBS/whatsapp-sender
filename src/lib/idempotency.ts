import { ConflictError } from "./api-errors";

interface IdempotencyTracker {
  timestamp: number;
  state: "in_progress" | "completed";
}

const cache = new Map<string, IdempotencyTracker>();
const DEFAULT_TTL_MS = 5 * 60 * 1000;

export interface IdempotencyReservation {
  complete(): void;
  abort(): void;
}

export function checkIdempotency(key?: string | null, ttlMs: number = DEFAULT_TTL_MS): void {
  const reservation = beginIdempotentOperation(key, ttlMs);
  reservation.complete();
}

export function beginIdempotentOperation(
  key?: string | null,
  ttlMs: number = DEFAULT_TTL_MS
): IdempotencyReservation {
  if (!key) {
    return {
      complete() {},
      abort() {},
    };
  }

  const now = Date.now();
  const tracker = cache.get(key);

  if (tracker && now - tracker.timestamp < ttlMs) {
    throw new ConflictError("Esta requisicao ja foi processada recentemente.");
  }

  const entry: IdempotencyTracker = {
    timestamp: now,
    state: "in_progress",
  };

  cache.set(key, entry);

  return {
    complete() {
      const current = cache.get(key);
      if (current !== entry) {
        return;
      }

      cache.set(key, {
        timestamp: Date.now(),
        state: "completed",
      });
    },
    abort() {
      const current = cache.get(key);
      if (current === entry) {
        cache.delete(key);
      }
    },
  };
}

if (typeof setInterval !== "undefined") {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, tracker] of cache.entries()) {
      if (now - tracker.timestamp > DEFAULT_TTL_MS) {
        cache.delete(key);
      }
    }
  }, 60000);

  cleanupInterval.unref?.();
}
export default checkIdempotency;
