@echo off
echo Configurando Banco de Dados do WhatsApp Sender...
cd /d "c:\workspace\whatsapp-sender"

echo Instalando dependencias...
call npm install

echo Configurando variaveis de ambiente...
:: Caminho relativo para garantir compatibilidade
set "DATABASE_URL=file:../dev.db"

echo Gerando Cliente Prisma...
call npx prisma generate

echo Atualizando o Banco de Dados (SQLite)...
call npx prisma db push

echo.
echo ===================================================
echo Concluido! 
echo Agora execute "iniciar_projeto.bat" na sua Area de Trabalho.
echo ===================================================
pause
