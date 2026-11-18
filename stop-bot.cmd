@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist bot.pid (
  echo Бот сейчас не запущен ^(нет bot.pid^).
  exit /b 0
)
set /p PID=<bot.pid
taskkill /PID %PID% /T /F >nul 2>&1
del /f /q bot.pid >nul 2>&1
echo Бот остановлен ^(PID %PID%^).
