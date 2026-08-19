export const OPT_OUT_FOOTER_OPTIONS = [
  {
    id: 'reply_sair',
    label: 'Responder SAIR',
    text: 'Para não receber mais mensagens, responda SAIR.',
  },
  {
    id: 'reply_parar',
    label: 'Responder PARAR',
    text: 'Não quer mais receber mensagens? Responda PARAR.',
  },
  {
    id: 'reply_cancelar',
    label: 'Responder CANCELAR',
    text: 'Para cancelar o recebimento, responda CANCELAR.',
  },
  {
    id: 'reply_stop',
    label: 'Responder STOP',
    text: 'Se preferir não receber novas mensagens, responda STOP.',
  },
  {
    id: 'reply_remover',
    label: 'Responder REMOVER',
    text: 'Quer sair da lista? Responda REMOVER.',
  },
] as const;

export type OptOutFooterId = typeof OPT_OUT_FOOTER_OPTIONS[number]['id'];

export const DEFAULT_OPT_OUT_FOOTER_ID: OptOutFooterId = 'reply_sair';

export function isOptOutFooterId(value: unknown): value is OptOutFooterId {
  return OPT_OUT_FOOTER_OPTIONS.some((option) => option.id === value);
}

export function getOptOutFooterText(footerId: unknown): string {
  const option = OPT_OUT_FOOTER_OPTIONS.find((item) => item.id === footerId)
    ?? OPT_OUT_FOOTER_OPTIONS.find((item) => item.id === DEFAULT_OPT_OUT_FOOTER_ID)!;
  return option.text;
}

export function appendOptOutFooter(message: string, footerId: unknown): string {
  const footer = getOptOutFooterText(footerId);
  const trimmedMessage = message.trimEnd();

  if (trimmedMessage.endsWith(footer)) return trimmedMessage;
  return `${trimmedMessage}\n\n${footer}`;
}
