@echo off
title PokerHands
cd /d "%~dp0"


where npm >nul 2>nul
if errorlevel 1 (
    echo ERRO: npm não encontrado no PATH.
    echo.
    pause
    exit /b 1
)

if not exist ".next\BUILD_ID" (
    echo Build de produção nao encontrado.
    echo Gerando. Isso pode levar um minuto...
    call npm run Build
    if errorlevel 1 (
        echo.
        echo ERRO: O Build falhou. Rode "npm run build" manualmente no terminal para ver o motivo.
        echo.
        pause
        exit /b 1
    )
)

start "PokerHands server" /min cmd /k "npm run start:app"

echo Carregando servidor...
ping -n 5 127.0.0.1 >nul

set "URL=http://localhost:3737"
set "PROFILE=%LOCALAPPDATA%\PokerHands\browser"
set "FLAGS=--app=%URL% --user-data-dir=%PROFILE%"

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" %FLAGS%
  exit /b
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" %FLAGS%
  exit /b
)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" %FLAGS%
  exit /b
)

echo Chrome/Edge nao encontrado, abrindo no navegador padrao.
start "" "%URL%"