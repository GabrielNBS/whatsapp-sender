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

Para configurar uma maquina nova, execute o bootstrap. Ele completa o `.env`, gera uma chave pessoal se faltar, instala dependencias, aplica migracoes, valida o Chromium e so executa o build se todas as etapas anteriores passarem:

```bash
npm run setup:production
```

Para auditar o que seria feito sem escrever no disco ou executar comandos, use:

```bash
node scripts/setup-production.mjs --dry-run
```

Depois, inicie a aplicacao:

```bash
npm start
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

## Limites atuais

- A aplicacao opera propositalmente em um unico workspace local, pois esta instancia e de uso pessoal. O resolvedor esta centralizado para uma futura migracao multi-tenant.
- Todas as APIs exigem a chave pessoal; para requisicoes autenticadas por cookie, operacoes que alteram dados tambem exigem mesma origem.
- Uma instancia do servico deve controlar uma unica sessao do WhatsApp. Escala horizontal exigira coordenacao externa da fila e das sessoes.
