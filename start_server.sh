#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8000}"
HOST="${HOST:-127.0.0.1}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $PORT is already in use. Trying to reuse the existing server..."
    exit 0
  fi
fi

cd "$DIR"
echo "Starting local server at http://$HOST:$PORT/"
exec python3 -m http.server "$PORT" --bind "$HOST"
