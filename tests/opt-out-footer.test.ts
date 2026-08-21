import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OPT_OUT_FOOTER_ID,
  OPT_OUT_FOOTER_OPTIONS,
  appendOptOutFooter,
  getOptOutFooterText,
} from '@/domain/opt-out-footer';

describe('mandatory opt-out footer', () => {
  it('provides exactly five selectable footer options', () => {
    expect(OPT_OUT_FOOTER_OPTIONS).toHaveLength(5);
    expect(OPT_OUT_FOOTER_OPTIONS.every((option) => option.text.length > 0)).toBe(true);
  });

  it('falls back to the safe default for an invalid persisted value', () => {
    expect(getOptOutFooterText('disabled')).toBe(getOptOutFooterText(DEFAULT_OPT_OUT_FOOTER_ID));
  });

  it('always appends the footer after the message when enabled', () => {
    const result = appendOptOutFooter('Olá, {{name}}!\n', 'reply_parar');
    expect(result).toBe('Olá, {{name}}!\n\nNão quer mais receber mensagens? Responda PARAR.');
  });

  it('does not append the footer when disabled', () => {
    const result = appendOptOutFooter('Olá, {{name}}!\n', 'reply_parar', false);
    expect(result).toBe('Olá, {{name}}!\n');
  });

  it('does not duplicate the selected footer', () => {
    const footer = getOptOutFooterText('reply_sair');
    expect(appendOptOutFooter(`Mensagem\n\n${footer}`, 'reply_sair')).toBe(`Mensagem\n\n${footer}`);
  });
});
