#!/bin/bash
# Double-click to run the site and admin on this computer (macOS). Also works on Linux: ./start-local.command
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Get the LTS version from https://nodejs.org and run this again."
  read -r -p "Press Enter to close."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "First run: installing... this takes a minute or two."
  npm install || { read -r -p "Install failed. Press Enter to close."; exit 1; }
fi
( sleep 4; (open http://localhost:4321 || xdg-open http://localhost:4321) >/dev/null 2>&1 ) &
npm run local
