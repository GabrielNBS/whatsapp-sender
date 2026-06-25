/**
 * Remove todos os caracteres não numéricos de uma string de telefone,
 * mantendo apenas os dígitos.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
