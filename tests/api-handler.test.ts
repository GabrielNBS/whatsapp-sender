import { beforeEach, describe, expect, it } from 'vitest';
import { isAuthorizedRequest, isSameOriginRequest } from '@/lib/personal-auth';

const accessToken = 'a-very-long-personal-access-token-for-tests';

function createRequest(headers: Record<string, string>) {
  return new Request('http://localhost:3000/api/status', { headers });
}

describe('personal API authorization', () => {
  beforeEach(() => {
    process.env.APP_ACCESS_TOKEN = accessToken;
  });

  it('accepts a valid bearer token regardless of forgeable host headers', () => {
    const request = createRequest({
      host: 'localhost:3000',
      authorization: `Bearer ${accessToken}`,
    });

    expect(isAuthorizedRequest(request)).toBe(true);
  });

  it('accepts the HttpOnly-cookie value only when it matches the configured token', () => {
    const request = createRequest({ cookie: `whatsapp-sender-session=${accessToken}` });
    expect(isAuthorizedRequest(request)).toBe(true);
  });

  it('rejects a forged same-origin request without a credential', () => {
    const request = createRequest({
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
      referer: 'http://localhost:3000/dashboard',
    });

    expect(isAuthorizedRequest(request)).toBe(false);
  });

  it('rejects a forged credential and cross-origin cookie mutations', () => {
    const request = createRequest({
      cookie: 'whatsapp-sender-session=not-the-token',
      origin: 'https://attacker.example',
    });

    expect(isAuthorizedRequest(request)).toBe(false);
    expect(isSameOriginRequest(request)).toBe(false);
  });
});
