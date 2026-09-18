import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Acesso nao autorizado") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "A requisicao foi bloqueada por seguranca") {
    super(403, "FORBIDDEN", message);
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message: string = "Servico indisponivel") {
    super(503, "SERVICE_UNAVAILABLE", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Recurso nao encontrado") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = "Muitas requisicoes. Tente novamente mais tarde.") {
    super(429, "RATE_LIMIT_EXCEEDED", message);
  }
}

export function mapPrismaError(error: unknown): ApiError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = (error.meta?.target as string[])?.join(", ") || "campo";
        return new ConflictError(`Ja existe um registro com este ${target} cadastrado.`);
      }
      case "P2025": {
        return new NotFoundError("O registro solicitado nao foi encontrado no sistema.");
      }
      case "P2003": {
        return new ConflictError("A operacao falhou porque este registro esta associado a outros dados.");
      }
      case "P1008":
      case "P1000":
      case "P1001":
      case "P1002":
      case "P1003":
      case "P1017":
      case "P2024": {
        return new ServiceUnavailableError(
          "O banco de dados demorou para responder ou esta temporariamente ocupado. Tente novamente."
        );
      }
      case "P2034":
      case "P2028": {
        return new ApiError(
          503,
          "TRANSACTION_CONFLICT",
          "Conflito de concorrencia no banco de dados. Tente novamente."
        );
      }
      case "P2000": {
        return new ValidationError("O valor informado para um dos campos excede o tamanho maximo permitido.");
      }
      case "P2005":
      case "P2006":
      case "P2007": {
        return new ValidationError("O valor fornecido para um dos campos e invalido.");
      }
      default:
        if (error.code.startsWith("P1")) {
          return new ServiceUnavailableError("Falha de conexao com o banco de dados. Tente novamente.");
        }
        return new ApiError(
          400,
          `DATABASE_ERROR_${error.code}`,
          "A operacao nao pode ser concluida devido a uma falha no banco de dados."
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError("Os dados enviados sao incompativeis com o banco de dados.");
  }

  return new ApiError(500, "INTERNAL_SERVER_ERROR", "Falha inesperada no banco de dados.");
}

export function isPrismaError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError
  );
}
