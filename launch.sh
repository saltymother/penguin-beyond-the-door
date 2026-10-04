#!/usr/bin/env bash
# Quick launcher for THE PENGUIN: BEYOND THE DOOR
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo " 🐧 Launching THE PENGUIN: BEYOND THE DOOR"
echo "=========================================================="

# Check if python3 is available
if command -v python3 &>/dev/null; then
  echo "Opening browser at http://localhost:8080 ..."
  # Try to open default browser on macOS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    (sleep 1 && open "http://localhost:8080") &
  fi
  python3 server.py
else
  # Direct file opening fallback
  echo "Opening index.html directly in browser..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open index.html
  else
    xdg-open index.html 2>/dev/null || sensible-browser index.html
  fi
fi
