import { describe, expect, it } from 'vitest';

import { formatPhoneNumber } from '@/lib/utils';
import { formatPhoneInput } from '@/services/contacts/normalizePhone';

describe('Brazilian contact phone formatting', () => {
  it('formats a mobile number while it is typed', () => {
    expect(formatPhoneInput('11999999999')).toBe('(11) 99999-9999');
  });

  it('removes the Brazilian country code before applying the visual mask', () => {
    expect(formatPhoneInput('+55 11 99999-9999')).toBe('(11) 99999-9999');
  });

  it('uses the same compact mask when displaying a stored number', () => {
    expect(formatPhoneNumber('5511999999999')).toBe('(11) 99999-9999');
  });
});
