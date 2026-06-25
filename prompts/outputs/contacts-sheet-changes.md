# Relatório de Alterações - Contatos & Grupos

Este documento lista todas as modificações realizadas no módulo de gerenciamento de contatos e grupos do aplicativo **WhatsApp Sender** para cumprir os requisitos de arquitetura, validação, performance, tipagem, acessibilidade e consistência levantados em `prompts/contacts-sheet.json`.

---

## 1. Arquitetura Centralizada (Hooks & Services)

Para resolver o problema de componente inflado (`ARCH-001`) e acoplamento com a store global (`ARCH-002`), dividimos a lógica de negócios da UI em hooks e serviços especializados:

*   **`src/constants/contacts.ts`** (`[NEW]`): Centralização de constantes como `DEFAULT_GROUP_ID`, `DEFAULT_GROUP_NAME` e configurações de polling/paginação.
*   **`src/services/contacts/normalizePhone.ts`** (`[NEW]`): Normaliza o número de telefone removendo formatação.
*   **`src/services/contacts/validateContact.ts`** (`[NEW]`): Validação de contatos (nome, número de telefone de 10-15 dígitos, verificação se o grupo existe e bloqueio de duplicidade por telefone).
*   **`src/services/contacts/validateGroup.ts`** (`[NEW]`): Validação de grupos (nome não vazio, tamanho máximo de 30 caracteres, nomes reservados bloqueados e duplicidade case-insensitive).
*   **`src/services/contacts/dedupeContacts.ts`** (`[NEW]`): Deduplica novos contatos (evitando cadastros idênticos tanto internos quanto do próprio arquivo CSV).
*   **`src/services/contacts/parseContactsCsv.ts`** (`[NEW]`): Processa o arquivo CSV delegando ao PapaParse com validações de cabeçalhos de "Nome" e "Telefone/WhatsApp", tratamento de erros do parser e rejeição de registros inválidos.
*   **`src/hooks/useContacts.ts`** (`[NEW]`): Orquestra o CRUD de contatos na store com validações de entrada e notificações integradas.
*   **`src/hooks/useGroups.ts`** (`[NEW]`): Gerencia ações de grupos com validações e a lógica de migração explícita de contatos ao excluir um grupo.
*   **`src/hooks/useContactImport.ts`** (`[NEW]`): Controla o ciclo de vida do modal e lógica de importação de contatos de forma isolada.
*   **`src/hooks/useContactAnalytics.ts`** (`[NEW]`): Polling de analytics otimizado.

---

## 2. Validações e Consistência de Dados

*   **`DATA-001` (Telefone Normalizado)**: O número de telefone agora é salvo e armazenado apenas com dígitos. A formatação para exibição é feita no render usando `formatPhoneNumber`.
*   **`VALID-001` & `VALID-002` (Validação de Contatos/Grupos)**: Implementado nos serviços específicos descritos acima.
*   **`DATA-002` (Múltiplos Grupos na Edição)**: O modal de edição agora exibe a lista de todos os grupos com caixas de seleção (checkboxes), permitindo associar um contato a vários grupos ao mesmo tempo, respeitando a assinatura original de `groupIds: string[]` da store.
*   **`GROUP-001` (Migração de Grupo ao Excluir)**: Implementamos explicitamente em `useGroups` a migração de todos os contatos associados ao grupo excluído para o grupo Geral antes de remover o grupo da store.
*   **`MODAL-001` (Consistência do Modal de Confirmação)**: O estado de confirmação de salvar alterações no contato é zerado e fechado em conjunto com o modal principal de edição caso o usuário desista.
*   **`TS-001` (Type Guard no RadioGroup)**: Criado o type guard `isImportTargetType` em `useContactImport.ts` para verificar e fazer o cast seguro antes de alterar o estado de destino da importação.

---

## 3. Melhorias de Performance e Polling

*   **`PERF-001` & `PERF-002` (Busca e Paginação Memoizadas)**:
    *   Criados os hooks `useContactSearch.ts` e `useContactPagination.ts` que memoizam com `useMemo` a lista de contatos pesquisados, paginação e quantidade total de páginas.
    *   Como a paginação local renderiza apenas 10 contatos por vez na tela, o custo no DOM é mínimo, garantindo ótima performance de renderização.
*   **`STATE-001` (Página Atual Órfã)**: O hook `useContactPagination` ajusta automaticamente a `currentPage` para a última página disponível caso exclusões de contatos causem a redução do número de páginas disponíveis.
*   **`API-001`, `API-002` & `API-003` (Polling e Fetch de Analytics)**:
    *   O hook `useContactAnalytics.ts` implementa polling a cada 5 segundos de forma segura.
    *   Usa `AbortController` para abortar requisições ativas no unmount do componente.
    *   Verifica `res.ok` no fetch antes de parsear para JSON.
    *   Detecta `document.visibilityState` e suspende o polling enquanto o usuário estiver em outra aba do navegador ou minimizado.

---

## 4. Acessibilidade (A11Y) e Estilo

*   **`A11Y-001` (Aria Labels)**:
    *   Todos os botões de ícone (excluir contato, editar contato, paginação e fechar busca) agora possuem a propriedade `aria-label` descritiva.
*   **`A11Y-002` (Upload de Arquivo Acessível)**:
    *   O input do CSV de upload foi escondido visualmente de forma acessível (`sr-only`) e associado a um label clicável estilizado como botão com `htmlFor` direcionado ao ID do input.
*   **`STYLE-001` & `STYLE-002` (Estilo Tailwind e Cores)**:
    *   Corrigida a classe inválida `justify-center!` para a variante prioritária correta.
    *   Removidas cores estáticas hardcoded que quebravam o modo escuro, trocando-as por tokens do design system (`zinc` e `muted-foreground`).

---

## 5. Arquivos de Componentes Modularizados

Para manter `ContactsSheetContent.tsx` com poucas responsabilidades (`STATE-002`), isolamos a UI nos seguintes subcomponentes na pasta `src/components/dashboard/sheets/components/contacts/`:

1.  `ContactSearch.tsx`: Input de busca com botão de limpar.
2.  `ContactPagination.tsx`: Controles de paginação acessíveis.
3.  `ContactRow.tsx`: Linha da tabela de contatos com badges de grupos e engajamento.
4.  `ContactTable.tsx`: Integra busca, listagem e paginação em um módulo coeso.
5.  `AddContactDialog.tsx`: Dialog de criação de contato.
6.  `ImportContactsDialog.tsx`: Dialog para importação de CSV (desabilitado se a lista de importados for igual a 0, cobrindo a regra `CSV-005`).
7.  `GroupCard.tsx`: Card de exibição do grupo.
8.  `GroupsTab.tsx`: Aba completa de grupos.
9.  `EditContactGroupIdDialog.tsx`: Dialog de edição de múltiplos grupos.
10. `ConfirmDeleteContactDialog.tsx`: Dialog de confirmação de exclusão do contato.
