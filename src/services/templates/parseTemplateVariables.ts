export interface TemplateVariableToken {
  type: 'text' | 'variable';
  value: string;
  isValid: boolean;
}

const ALLOWED_PLACEHOLDERS = ['name', 'nome', 'phone', 'telefone', 'celular'];

/**
 * Analisa o conteúdo de texto de um template e retorna uma lista de tokens divididos
 * entre texto simples e variáveis mapeadas/validadas.
 */
export function parseTemplateVariables(text: string): TemplateVariableToken[] {
  if (!text) return [];

  // Captura tudo o que está dentro de {{ ... }}
  const parts = text.split(/(\{\{.*?\}\})/g);

  return parts.map((part) => {
    const isVariable = part.startsWith('{{') && part.endsWith('}}');
    
    if (isVariable) {
      // Extrai o nome interno da variável
      const varName = part.slice(2, -2).trim().toLowerCase();
      const isValid = ALLOWED_PLACEHOLDERS.includes(varName);

      return {
        type: 'variable',
        value: part,
        isValid,
      };
    }

    return {
      type: 'text',
      value: part,
      isValid: true,
    };
  });
}
export default parseTemplateVariables;
