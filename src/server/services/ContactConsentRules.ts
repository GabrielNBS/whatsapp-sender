const OPT_OUT_RULES: Array<{ keyword: string; matches: (text: string) => boolean }> = [
  { keyword: 'SAIR', matches: (text) => text === 'sair' },
  { keyword: 'PARAR', matches: (text) => text === 'parar' || /\bparem?\b.*\bmensagens?\b/.test(text) },
  { keyword: 'STOP', matches: (text) => text === 'stop' },
  { keyword: 'CANCELAR', matches: (text) => text === 'cancelar' },
  { keyword: 'DESCADASTRAR', matches: (text) => /\bdes?cadastr(?:ar|e|a)\b/.test(text) },
  { keyword: 'NAO_QUERO', matches: (text) => text === 'nao quero' || text === 'nao quero receber' },
  { keyword: 'REMOVER', matches: (text) => text === 'remover' || text === 'remova meu numero' },
];

function normalizeOptOutText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectOptOutKeyword(message: string): string | null {
  const normalized = normalizeOptOutText(message);
  return OPT_OUT_RULES.find((rule) => rule.matches(normalized))?.keyword ?? null;
}
