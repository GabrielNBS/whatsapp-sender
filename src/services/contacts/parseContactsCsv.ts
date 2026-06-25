import Papa from 'papaparse';
import { Contact } from '@/lib/types';
import { normalizePhone } from './normalizePhone';

const NAME_SYNONYMS = ['name', 'nome', 'nome do cliente', 'cliente', 'contato', 'nome completo'];
const NUMBER_SYNONYMS = ['number', 'numero', 'celular', 'telefone', 'whatsapp', 'número whatsapp', 'número telefone', 'fone', 'tel'];

export interface ParseCsvResult {
  contacts: Omit<Contact, 'id'>[];
  errors: string[];
}

/**
 * Faz o parsing de um arquivo CSV e extrai os contatos com validação de headers e dados básicos.
 */
export function parseContactsCsv(file: File): Promise<ParseCsvResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      error: (error) => {
        reject(new Error(`Erro ao ler o arquivo CSV: ${error.message}`));
      },
      complete: (results) => {
        const errors: string[] = [];
        const data = results.data as Array<Record<string, string>>;

        if (data.length === 0) {
          resolve({ contacts: [], errors: ['O arquivo CSV está vazio ou não pôde ser lido.'] });
          return;
        }

        // Verifica se existem headers válidos identificando nome e número
        const firstRow = data[0];
        const keys = Object.keys(firstRow).map((k) => k.toLowerCase().trim());
        
        const hasNameHeader = keys.some((k) => NAME_SYNONYMS.includes(k));
        const hasNumberHeader = keys.some((k) => NUMBER_SYNONYMS.includes(k) || k.includes('whatsapp'));

        if (!hasNameHeader || !hasNumberHeader) {
          resolve({
            contacts: [],
            errors: ['Cabeçalhos do CSV inválidos. O arquivo deve conter pelo menos uma coluna para "Nome" e uma para "Telefone" ou "WhatsApp".']
          });
          return;
        }

        const parsed = data.map((row, idx) => {
          const rowEntries = Object.entries(row);
          const normalizedRow: Record<string, string> = {};
          
          rowEntries.forEach(([k, v]) => {
            normalizedRow[k.toLowerCase().trim()] = v;
          });

          // 1. Busca Nome
          let name = '';
          for (const synonym of NAME_SYNONYMS) {
            if (normalizedRow[synonym]) {
              name = normalizedRow[synonym].trim();
              break;
            }
          }

          // Rejeita contatos sem nome útil
          if (!name || name.toLowerCase() === 'unknown' || name.toLowerCase() === 'desconhecido') {
            errors.push(`Linha ${idx + 2}: Nome inválido ou ausente.`);
            return null;
          }

          // 2. Busca Número (priorizando WhatsApp)
          let rawNumber = '';
          const rowKeys = Object.keys(normalizedRow);
          const whatsappKey = rowKeys.find((key) => key.includes('whatsapp'));

          if (whatsappKey && normalizedRow[whatsappKey]) {
            rawNumber = normalizedRow[whatsappKey];
          } else {
            for (const synonym of NUMBER_SYNONYMS) {
              if (normalizedRow[synonym]) {
                rawNumber = normalizedRow[synonym];
                break;
              }
            }
          }

          const cleanNumber = normalizePhone(rawNumber);

          // Valida tamanho mínimo de número
          if (cleanNumber.length < 10 || cleanNumber.length > 15) {
            errors.push(`Linha ${idx + 2} (${name}): Número de telefone inválido.`);
            return null;
          }

          return {
            name,
            number: cleanNumber,
            groupIds: [] as string[]
          };
        }).filter((c): c is Omit<Contact, 'id'> => c !== null);

        resolve({
          contacts: parsed,
          errors,
        });
      }
    });
  });
}
