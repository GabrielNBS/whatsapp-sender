@echo off
echo Iniciando WhatsApp Sender...
cd /d "c:\workspace\whatsapp-sender"

REM Limpeza de cache preventiva (mantida pois resolveu o erro)
IF EXIST ".next" (
    rmdir /s /q ".next"
)

echo Abrindo navegador...
start "" "http://localhost:3000"

echo Iniciando servidor...
call npm run dev
pause
