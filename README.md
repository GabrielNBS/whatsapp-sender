# WhatsApp Sender

Servico web para gerenciar contatos, campanhas, agendamentos e relatorios de envios pelo WhatsApp Web.

## Requisitos

- Node.js 20.9 ou superior
- npm 11
- Chrome/Chromium e dependencias de sistema exigidas pelo Puppeteer
- armazenamento persistente para o banco SQLite e para a sessao do WhatsApp

O processo precisa ser de longa duracao. A integracao com `whatsapp-web.js`, o agendador e a fila rodam no servidor e nao sao adequados a runtimes serverless efemeros.

## Configuracao

Crie um arquivo `.env` local:

```dotenv
DATABASE_URL="file:./dev.db"
# Opcional quando o Chromium empacotado pelo Puppeteer nao puder ser usado.
# PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"
# Opcional. O padrao e ./.wwebjs_auth.
# WWEBJS_AUTH_PATH="/var/lib/whatsapp-sender/session"
```

Em producao, `DATABASE_URL` e `WWEBJS_AUTH_PATH` devem apontar para volumes persistentes. Nunca publique o banco, a pasta de autenticacao ou arquivos `.env`.

## Desenvolvimento

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run dev
```

A aplicacao fica disponivel em [http://localhost:3000](http://localhost:3000).

## Producao

Execute as migracoes antes de iniciar cada nova versao:

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

- A aplicacao opera em um workspace padrao enquanto autenticacao e planos ainda nao existem.
- As APIs aceitam apenas chamadas sem `Origin`/`Referer` ou chamadas de mesma origem. Isso reduz requisicoes indevidas do navegador, mas nao substitui autenticacao.
- Uma instancia do servico deve controlar uma unica sessao do WhatsApp. Escala horizontal exigira coordenacao externa da fila e das sessoes.
