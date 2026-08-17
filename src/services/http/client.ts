export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const payload = await response.json().catch(() => null) as {
    error?: string;
    message?: string;
  } | null;

  return payload?.message || payload?.error || `Falha na requisição (${response.status}).`;
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new ApiRequestError(await readErrorMessage(response), response.status);
  }

  return response.json() as Promise<T>;
}

