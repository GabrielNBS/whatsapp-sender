import { AsyncLocalStorage } from "async_hooks"; // nativo do Node.js, sem instalar nada

const storage = new AsyncLocalStorage<{ requestId: string }>();

export const correlationStore = storage;

// Gera um ID simples e único por request
export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Retorna o ID da requisição atual (ou "standalone" se chamado fora de um request)
export function getRequestId(): string {
  return storage.getStore()?.requestId ?? "standalone";
}