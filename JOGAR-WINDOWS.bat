@echo off
setlocal
cd /d "%~dp0"
title Asas de Brumaria 1.3.9 - Windows sem Python
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_windows.ps1"
if errorlevel 1 (
  echo.
  echo Nao foi possivel abrir o servidor local. Verifique o PowerShell e firewall.
  pause
)
