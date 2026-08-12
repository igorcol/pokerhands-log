@echo off
title PokerHands
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo ERRO: npm nao encontrado no PATH.
  echo.
  pause
  exit /b 1
)

if not exist ".next\BUILD_ID" (
  echo Build de producao nao encontrado. 
  echo Gerando, isso leva um minuto...
  call npm run build
  if errorlevel 1 (
    echo.
    echo ERRO: o build falhou. Rode "npm run build" no terminal para ver o motivo.
    echo.
    pause
    exit /b 1
  )
)

start "PokerHands server" /min cmd /k "npm run start:app"

echo Subindo o servidor...
ping -n 5 127.0.0.1 >nul
start "" http://localhost:3737