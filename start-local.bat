@echo off
REM Double-click to run the site and admin on this computer (Windows).
cd /d "%~dp0"
where node >nul 2>nul || (
  echo Node.js is not installed. Get the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo First run: installing... this takes a minute or two.
  call npm install || (pause & exit /b 1)
)
start "" http://localhost:4321
call npm run local
pause
