import { describe, expect, it } from 'vitest';
import { isAuthorizedRequest } from '@/lib/api-handler';

function createRequest(headers: Record<string, string>) {
  return new Request('http://localhost:3000/api/status', { headers });
}

describe('isAuthorizedRequest', () => {
  it('accepts a same-origin browser request', () => {
    const request = createRequest({
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
      referer: 'http://localhost:3000/dashboard',
    });

    expect(isAuthorizedRequest(request)).toBe(true);
  });

  it('accepts a server-to-server request without browser origin headers', () => {
    expect(isAuthorizedRequest(createRequest({ host: 'service.internal' }))).toBe(true);
  });

  it('rejects a request from another origin', () => {
    const request = createRequest({
      host: 'localhost:3000',
      origin: 'https://attacker.example',
    });

    expect(isAuthorizedRequest(request)).toBe(false);
  });

  it('treats a different port as a different origin', () => {
    const request = createRequest({
      host: 'localhost:3000',
      origin: 'http://localhost:4000',
    });

    expect(isAuthorizedRequest(request)).toBe(false);
  });
});
