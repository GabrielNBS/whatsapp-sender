# WhatsApp Sender

Servico web para gerenciar contatos, campanhas, agendamentos e relatorios de envios pelo WhatsApp Web.

## Requisitos

- Node.js 20.9 ou superior
- npm 11
- Chrome/Chromium e dependencias de sistema exigidas pelo Puppeteer
- armazenamento persistente para o banco SQLite e para a sessao do WhatsApp

O processo precisa ser de longa duracao. A integracao com `whatsapp-web.js`, o agendador e a fila rodam no servidor e nao sao adequados a runtimes serverless efemeros.

## Configuracao

Copie `.env.example` para `.env` e preencha uma chave pessoal aleatoria de ao menos 32 caracteres:

```dotenv
DATABASE_URL="file:./dev.db"
APP_ACCESS_TOKEN="gere-uma-chave-aleatoria-longa-e-secreta"
# Opcional quando o Chromium empacotado pelo Puppeteer nao puder ser usado.
# PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"
# Opcional. O padrao e ./.wwebjs_auth.
# WWEBJS_AUTH_PATH="/var/lib/whatsapp-sender/session"
```

Ao abrir a aplicacao, informe essa chave na tela de acesso. Ela e mantida apenas em um cookie `HttpOnly`, `SameSite=Strict` e `Secure` em producao. Integracoes nao-interativas podem enviar a mesma chave no cabecalho `Authorization: Bearer`.

Em producao, use HTTPS e configure `DATABASE_URL` e `WWEBJS_AUTH_PATH` em volumes persistentes privados. Nunca publique o banco, a pasta de autenticacao, chaves ou arquivos `.env`.

## Desenvolvimento

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run dev
```

A aplicacao fica disponivel em [http://localhost:3000](http://localhost:3000).

## Producao

Para configurar uma maquina nova, execute o bootstrap. Ele completa o `.env`, gera uma chave pessoal se faltar, instala dependencias, aplica migracoes, valida o Chromium e so executa o build se todas as etapas anteriores passarem. Ao concluir, ele inicia a aplicacao e abre o navegador padrao em `http://localhost:3000`:

```bash
npm run setup:production
```

Para auditar o que seria feito sem escrever no disco ou executar comandos, use:

```bash
node scripts/setup-production.mjs --dry-run
```

Para apenas preparar a maquina e fazer o build, sem manter o servidor aberto nem abrir o navegador:

```bash
npm run setup:production -- --build-only
```

O fluxo manual equivalente e:

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run build
npm start
```

## Verificacao

```bash
npm run check
npm run db:status
npm audit
```

`npm run check` executa lint, verificacao de tipos, testes e build de producao.

## Arquitetura

A aplicacao separa transporte, casos de uso, infraestrutura e apresentacao para que as regras possam evoluir sem depender do Next.js ou dos componentes React:

- `src/app/api`: adaptadores HTTP. Validam a requisicao, resolvem o workspace e delegam aos servicos de aplicacao.
- `src/domain`: contratos e regras independentes de HTTP e de componentes visuais.
- `src/server/services` e `src/server/ports`: casos de uso e interfaces para recursos externos.
- `src/server/composition`: composicao das implementacoes concretas e suas dependencias.
- `src/infrastructure`: integracoes concretas, incluindo o gateway do WhatsApp Web.
- `src/services`: clientes HTTP e operacoes do frontend, todos baseados no cliente compartilhado.
- `src/stores`: estado de interface separado por responsabilidade. Contatos e campanhas permanecem no servidor como fonte de verdade; os stores mantêm somente snapshots de sessao e preferencias locais versionadas.
- `src/presentation`: adaptadores visuais, como notificacoes e confirmacoes, injetados nos hooks por interfaces.

Os testes de fronteira em `tests/architecture-boundaries.test.ts` impedem dependencias diretas das rotas com Prisma/WhatsApp, dos hooks com a biblioteca de notificacao e dos servicos de frontend com `fetch` fora do cliente HTTP central.

## Limites atuais

- A aplicacao opera propositalmente em um unico workspace local, pois esta instancia e de uso pessoal. O resolvedor esta centralizado para uma futura migracao multi-tenant.
- Todas as APIs exigem a chave pessoal; para requisicoes autenticadas por cookie, operacoes que alteram dados tambem exigem mesma origem.
- Uma instancia do servico deve controlar uma unica sessao do WhatsApp. Escala horizontal exigira coordenacao externa da fila e das sessoes.
- Opt-outs recebidos pelo WhatsApp sao capturados enquanto o processo esta ativo. Ainda nao existe uma varredura do historico recebido durante o periodo em que o app esteve fechado.
- Todo envio da aplicacao recebe obrigatoriamente um rodape de cancelamento no gateway central do WhatsApp. Em Configuracoes > Geral, e possivel escolher uma entre cinco mensagens; nao existe opcao de desativar esse rodape.
- Agendamentos vencidos sao retomados quando o processo volta, mas permanecem pausados quando estao vencidos ha mais de 15 minutos, como medida de seguranca.

## Implementacoes futuras

- Ao reconectar o WhatsApp, consultar mensagens recentes recebidas enquanto o app estava fechado e aplicar automaticamente as regras de opt-out.
- Persistir um cursor ou identificador de mensagem processado para evitar duplicidades na sincronizacao e manter a auditoria idempotente.
- Exibir no historico/auditoria quando uma alteracao foi capturada durante a sincronizacao de reconexao, incluindo falhas e tentativas de reprocessamento.
