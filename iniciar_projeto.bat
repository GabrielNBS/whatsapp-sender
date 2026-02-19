@echo off
echo Iniciando WhatsApp Sender...
cd /d "%~dp0"

REM Limpeza de cache preventiva (mantida pois resolveu o erro)
IF EXIST ".next" (
    rmdir /s /q ".next"
)

echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

echo Construindo projeto...
call npm run build

echo Abrindo navegador...
start "" "http://localhost:3000"

echo Iniciando servidor...
call npm start
pause
