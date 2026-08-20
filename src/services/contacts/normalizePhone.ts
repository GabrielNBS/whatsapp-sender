/**
 * Remove todos os caracteres não numéricos de uma string de telefone,
 * mantendo apenas os dígitos.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formats a Brazilian phone number while it is being typed.
 * It deliberately keeps partial values so the field can validate incrementally.
 */
export function formatPhoneInput(phone: string): string {
  let digits = normalizePhone(phone);

  if (digits.startsWith('55') && digits.length > 11) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;

  const areaCode = digits.slice(0, 2);
  const subscriber = digits.slice(2);
  const isMobile = subscriber.length > 8 || (subscriber.length === 9 && subscriber.startsWith('9'));

  if (isMobile) {
    const firstBlock = subscriber.slice(0, 5);
    const secondBlock = subscriber.slice(5, 9);
    return `(${areaCode}) ${firstBlock}${secondBlock ? `-${secondBlock}` : ''}`;
  }

  const firstBlock = subscriber.slice(0, 4);
  const secondBlock = subscriber.slice(4, 8);
  return `(${areaCode}) ${firstBlock}${secondBlock ? `-${secondBlock}` : ''}`;
}
