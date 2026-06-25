# Relatório de Alterações - Modelos de Mensagem

Este documento lista todas as modificações realizadas no módulo de gerenciamento de templates (modelos de mensagem) do aplicativo **WhatsApp Sender** para cumprir os requisitos de arquitetura, validação, performance, tipagem, acessibilidade, API e layout descritos em `prompts/templates-sheet.json`.

---

## 1. Arquitetura Modular (Hooks & Services)

Para resolver o problema de componente inflado (`ARCH-001`) e acoplamento com lógica de fetch HTTP e estado na própria UI (`ARCH-002`), dividimos a lógica de negócios da UI em hooks, tipos, constantes e serviços especializados:

*   **`src/constants/templates.ts`** (`[NEW]`): Contém constantes compartilhadas como as opções de filtros, limites de categoria (`MAX_CATEGORY_LENGTH = 20`), chave de query e paginação (`TEMPLATES_PER_PAGE = 9`).
*   **`src/types/templates.ts`** (`[NEW]`): Definição de interfaces compartilhadas do domínio, incluindo `Template`, `TemplateMedia` e tipos de filtros (`TYPE-001`).
*   **`src/services/templates/parseTemplateMedia.ts`** (`[NEW]`): Tenta converter a string JSON de mídia em um objeto estruturado, com tratamento de erros controlado (`MEDIA-001` e `MEDIA-002`).
*   **`src/services/templates/parseTemplateVariables.ts`** (`[NEW]`): Analisador de variáveis/placeholders que suporta validação de variáveis válidas e separa o texto em tokens para renderização segura (`TEMPLATE-001`).
*   **`src/services/templates/validateTemplate.ts`** (`[NEW]`): Validador de dados estruturais de templates antes de realizar a requisição.
*   **`src/services/templates/normalizeTemplate.ts`** (`[NEW]`): Normalizador de dados de templates vindo do banco. Normaliza categorias, datas (com fallback correto) e pré-parseia mídias para evitar custos de renderização repetitiva (`DATE-001`, `FILTER-001`, `PERF-003`).
*   **`src/services/templates/templatesApi.ts`** (`[NEW]`): Encapsula as requisições HTTP GET e DELETE sem usar cache-busting com Date.now() e cancelando requisições se um AbortSignal for emitido (`API-001`, `API-002`, `API-003`, `API-004`, `API-005`).
*   **`src/hooks/useTemplates.ts`** (`[NEW]`): Hook reativo para manipulação e ciclo de vida de templates com AbortController e estados robustos de loading e erro.
*   **`src/hooks/useTemplateFilters.ts`** (`[NEW]`): Gerencia busca textual, filtragem de tipo e categorias com persistência de estado local (`STATE-004`, `FILTER-002`).
*   **`src/hooks/useTemplateClipboard.ts`** (`[NEW]`): Cópia assíncrona de conteúdo de forma segura (`CLIPBOARD-001`).

---

## 2. Consistência de Estado e UI

*   **`STATE-001` & `STATE-002` (Estados de Carregamento/Erro)**: Implementados skeletons de grid de templates (`TemplatesLoadingSkeleton.tsx`) e tratamento de erros visuais com fallbacks adequados.
*   **`STATE-003` & `STATE-004` (Filtros Persistidos)**: Removido o reset automático de filtros na atualização e adicionada persistência dos filtros ativos no `localStorage` do navegador.
*   **`STATE-005` (Duplicação Explícita)**: Criado o estado `duplicateSourceTemplate` no componente principal para diferenciar a duplicação da edição de forma totalmente explícita e consistente.
*   **`EVENT-001` & `ASYNC-001` (Sincronização e Eventos)**: As atualizações recarregam os dados imediatamente através de awaits diretos da API (sem timeouts redundantes), e o envio do evento `'templates-updated'` foi encapsulado nos hooks do domínio de templates.
*   **`DELETE-001` & `DELETE-002` (Exclusão Acessível e Carregamento)**: Substituído o confirm() nativo por um `ConfirmDeleteTemplateDialog.tsx` acessível (`AlertDialog`). O botão de exclusão do card fica desabilitado e exibe spinner de carregamento enquanto a requisição está pendente na API.
*   **`CLEAN-001` (Limpeza)**: Removidos comentários e trechos de códigos mortos.

---

## 3. Melhorias de Performance

*   **`PERF-001` & `PERF-002` (Filtros Memoizados)**: O hook de filtros memoiza a lista de categorias disponíveis e a lista filtrada de templates com `useMemo`.
*   **`PERF-003` (Mídia Pré-parseada)**: O parse de mídia de string JSON para objeto ocorre apenas no recebimento e normalização na camada do service, e não dentro do render.
*   **`PERF-004` & `PERF-005` (Data Memoizada e Handlers)**: A data é formatada na normalização e os handlers no grid foram memoizados ou encapsulados com `memo` nos componentes filhos.
*   **`PERF-006` (Paginação de Grid)**: O grid agora suporta paginação cliente de 9 templates por página (`TemplateGrid.tsx`).

---

## 4. Mídia e Acessibilidade (A11Y)

*   **`MEDIA-004` (Renderização de Mídia)**: Substituída a tag `Image` do Next.js pela tag `img` nativa no caso de data URL base64, impedindo warnings do compilador sobre carregamento unoptimized de imagens base64 volumosas.
*   **`A11Y-001` (Alt de Imagens)**: As imagens de mídia de template agora possuem o atributo `alt` enriquecido com o próprio título do template correspondente.
*   **`A11Y-002` (Aria Labels)**: Botões de copiar, duplicar, editar e excluir de todos os templates agora possuem a propriedade `aria-label` descritiva.
*   **`A11Y-003` (Filtros Semânticos)**: Adicionado o atributo `aria-pressed` nos botões de filtro.

---

## 5. Arquivos de Componentes Isolados

Para manter `templates-sheet-content.tsx` com responsabilidades organizadas, isolamos a UI nos seguintes subcomponentes na pasta `src/components/dashboard/sheets/components/templates/`:

1.  `TemplatesHeader.tsx`: Cabeçalho com ação responsiva de criar modelos (resolvendo a sobreposição em telas menores `LAYOUT-001` e removendo `pb-20` `LAYOUT-002`).
2.  `TemplateFilters.tsx`: Barra de pesquisa e abas acessíveis de filtragem.
3.  `TemplateGrid.tsx`: Exibição do grid com controles de paginação local.
4.  `TemplateCard.tsx`: Card individual memoizado com ações rápidas de cópia, edição, duplicação e remoção.
5.  `TemplatePreview.tsx`: Visualizador e destacador das variáveis.
6.  `TemplateMediaPreview.tsx`: Visualizador de mídias com tratamento e fallback em caso de arquivos corrompidos.
7.  `EmptyTemplatesState.tsx`: Exibição de estado vazio e botão de limpeza de filtros.
8.  `TemplatesLoadingSkeleton.tsx`: Skeletons animados durante a consulta inicial.
9.  `ConfirmDeleteTemplateDialog.tsx`: Modal acessível para confirmação de remoção de modelos.
