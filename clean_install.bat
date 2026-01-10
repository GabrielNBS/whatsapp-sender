@echo off
echo ===================================================
echo   LIMPEZA PROFUNDA E REINSTALACAO DO PROJETO
echo ===================================================
echo.
echo Isso pode levar alguns minutos. Por favor, aguarde.
echo.

cd /d "c:\workspace\whatsapp-sender"

echo 1. Removendo pasta node_modules (pode demorar)...
if exist node_modules rmdir /s /q node_modules

echo 2. Removendo arquivos de cache e lock...
if exist package-lock.json del package-lock.json
if exist .next rmdir /s /q .next

echo 3. Limpando cache do NPM...
call npm cache clean --force

echo 4. Instalando dependencias (versao estavel)...
call npm install

echo 5. Gerando cliente do banco de dados...
call npx prisma generate

echo.
echo ===================================================
echo   CONCLUIDO!
echo ===================================================
echo Agora tente rodar o projeto novamente.
pause
