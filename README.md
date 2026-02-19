This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Executando Localmente

Para rodar o projeto localmente, você pode usar os scripts facilitadores na raiz do projeto:

1. **`setup_database.bat`**: Instala dependências, gera o cliente do banco de dados e configura o SQLite. Execute isso na primeira vez.
2. **`iniciar_projeto.bat`**: Constrói o projeto (build) e inicia o servidor. Use este script no dia a dia.
3. **`clean_install.bat`**: Remove `node_modules` e reinstala tudo do zero. Use caso tenha problemas estranhos.

### Requisitos

- Node.js 18+ instalado
- Google Chrome instalado (para o WhatsApp Web)

### Comandos Manuais

Se preferir usar o terminal:

```bash
# Instalar dependências
npm install

# Configurar banco de dados
npx prisma generate
npx prisma db push

# Rodar em modo de desenvolvimento
npm run dev

# Rodar em modo de produção (mais rápido)
npm run build
npm start
```
