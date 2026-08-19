import { useEffect, useState } from 'react';
import { avatarApi } from '@/services/contacts/avatarApi';
import { normalizePhone } from '@/services/contacts/normalizePhone';

const AVATAR_CACHE_TTL_MS = 5 * 60 * 1000;
const avatarCache = new Map<string, { value: string | null; fetchedAt: number }>();
const pendingRequests = new Map<string, Promise<string | null>>();

async function loadAvatar(phone: string) {
  const cached = avatarCache.get(phone);
  if (cached && Date.now() - cached.fetchedAt < AVATAR_CACHE_TTL_MS) return cached.value;

  const pending = pendingRequests.get(phone);
  if (pending) return pending;

  const request = avatarApi.get(phone)
    .then(({ url }) => url || null)
    .catch(() => null)
    .then((value) => {
      avatarCache.set(phone, { value, fetchedAt: Date.now() });
      pendingRequests.delete(phone);
      return value;
    });

  pendingRequests.set(phone, request);
  return request;
}

export function useAvatar(phone: string | undefined, enabled: boolean) {
  const normalizedPhone = normalizePhone(phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => avatarCache.get(normalizedPhone)?.value ?? null);

  useEffect(() => {
    if (!enabled || normalizedPhone.length < 10) return;
    let active = true;
    void loadAvatar(normalizedPhone).then((value) => {
      if (active) setAvatarUrl(value);
    });
    return () => { active = false; };
  }, [enabled, normalizedPhone]);

  return avatarUrl;
}
