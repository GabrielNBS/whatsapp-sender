import { describe, expect, it } from 'vitest';
import { maskName, maskPhone } from '@/lib/logger';

describe('PII log masking', () => {
  it('masks phone numbers while preserving only the minimum diagnostic suffix', () => {
    expect(maskPhone('5511988887777')).toBe('55119****7777');
    expect(maskPhone('123')).toBe('***');
  });

  it('masks every name segment used in server logs', () => {
    expect(maskName('Maria Silva')).toBe('M***a S***a');
  });
});
