@echo off
title PokerHands
cd /d "%~dp0"

if not exists ".next\BUILD_ID" (
    echo Build de producao nao encontrada. 
    echo Gerando... Isso pode levar um minuto...
    call npm run build
)

start "PokerHands server" /min cmd /c "npm run start:app"

echo Subindo o servidor...
timeout /t 4 /nobreak >nul
start "" http://localhost:3737

exit