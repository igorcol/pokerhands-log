@echo off
title PokerHands
cd /d "%~dp0"

rem ===== Como abrir o app: app | kiosk | browser =====
set "MODE=browser"
rem ==================================================

where npm >nul 2>nul
if errorlevel 1 (
  echo ERRO: npm nao encontrado no PATH.
  echo.
  pause
  exit /b 1
)

if not exist ".next\BUILD_ID" (
  echo Build de producao nao encontrado. Gerando, isso leva um minuto...
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

set "URL=http://localhost:3737"
set "PROFILE=%LOCALAPPDATA%\PokerHands\browser"

if /i "%MODE%"=="browser" (
  start "" "%URL%"
  exit /b
)

if /i "%MODE%"=="kiosk" (
  set "FLAGS=--kiosk --user-data-dir=%PROFILE% %URL%"
) else (
  set "FLAGS=--app=%URL% --user-data-dir=%PROFILE%"
)

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