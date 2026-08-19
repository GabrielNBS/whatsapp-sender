import { describe, expect, it } from 'vitest';
import { detectOptOutKeyword } from '@/server/services/ContactConsentRules';

describe('automatic opt-out rules', () => {
  it.each([
    ['SAIR', 'SAIR'],
    ['pare de me mandar mensagens', 'PARAR'],
    ['STOP!!!', 'STOP'],
    ['descadastre meu número', 'DESCADASTRAR'],
    ['não quero receber', 'NAO_QUERO'],
  ])('detects %s as %s', (message, keyword) => {
    expect(detectOptOutKeyword(message)).toBe(keyword);
  });

  it('does not treat ordinary messages as opt-out', () => {
    expect(detectOptOutKeyword('Quero cancelar o pedido')).toBeNull();
    expect(detectOptOutKeyword('Olá, tudo bem?')).toBeNull();
  });
});
