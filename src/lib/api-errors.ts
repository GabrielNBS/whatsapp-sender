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
      default:
        return new ApiError(
          400,
          `DATABASE_ERROR_${error.code}`,
          "A operacao nao pode ser concluida por uma restricao de dados."
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
