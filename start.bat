@echo off
setlocal
echo ===================================================
echo   WhatsApp Sender - Inicializador Universal
echo ===================================================
echo.
cd /d "%~dp0"

echo [1/6] Verificando dependencias do sistema...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO FATAL] Node.js nao encontrado.
    echo Por favor, acesse https://nodejs.org e instale o Node.js v18 ou superior.
    pause
    exit /b 1
)

call pnpm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Pnpm nao encontrado. Instalando pnpm globalmente via npm...
    call npm install -g pnpm
)

echo.
echo [2/6] Verificando arquivo de ambiente (.env)...
if not exist ".env" (
    echo Criando arquivo .env padrao...
    echo DATABASE_URL="file:./dev.db" > .env
    echo NEXT_PUBLIC_APP_URL="http://localhost:3000" >> .env
)

echo.
echo [3/6] Instalando pacotes e dependencias...
call pnpm install

echo.
echo [4/6] Gerando cliente Prisma e sincronizando Banco de Dados...
:: DATABASE_URL precisa estar compatível localmente
call pnpm exec prisma generate
call pnpm exec prisma db push --accept-data-loss

echo.
echo [5/6] Instalando dependencias do motor do WhatsApp (Chrome)...
:: Isso garante que o puppeteer tenha o binário do Chrome baixado na máquina local
call pnpm exec puppeteer browsers install chrome

echo.
echo ===================================================
echo [6/6] INICIANDO O SISTEMA
echo ===================================================
echo O servidor esta sendo iniciado. Seu navegador vai abrir automaticamente.
echo Para desligar, pressione CTRL + C nesta janela.
echo.

:: Abre o navegador local
start "" "http://localhost:3000"

:: Inicia o processo em modo desenvolvimento (ou start se fosse build)
call pnpm run dev

pause
