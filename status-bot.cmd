@echo off
chcp 65001 >nul
cd /d "%~dp0"
if exist bot.pid (
  set /p PID=<bot.pid
  tasklist /FI "PID eq %PID%" 2>nul | find "%PID%" >nul
  if errorlevel 1 (
    echo Бот не активен ^(устаревший PID %PID%^).
  ) else (
    echo Бот работает, PID: %PID%
  )
) else (
  echo Бот остановлен.
)
if exist bot.log (
  echo --- Последние строки bot.log ---
  powershell -NoProfile -Command "Get-Content -Tail 12 -Encoding UTF8 'bot.log'"
)
