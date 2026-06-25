import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";

const storage = new AsyncLocalStorage<{ requestId: string }>();

export const correlationStore = storage;

export function generateRequestId(): string {
  return `req-${randomUUID()}`;
}

export function runWithRequestId<T>(requestId: string, callback: () => T): T {
  return storage.run({ requestId }, callback);
}

export function getRequestId(): string {
  return storage.getStore()?.requestId ?? "standalone";
}
