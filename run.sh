#!/usr/bin/env bash
set -e

# ── Backend ──────────────────────────────────────────────────────────────────
cd backend
[ -d .venv ] || python -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -r requirements.txt -q
uvicorn app:app --port 8000 &
BACKEND_PID=$!
cd ..

# ── Frontend ─────────────────────────────────────────────────────────────────
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

# ── Cleanup ───────────────────────────────────────────────────────────────────
cleanup() {
    echo ""
    echo "Shutting down..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173  ← open this"
echo ""
echo "  Press Ctrl+C to stop both servers."
wait "$FRONTEND_PID"
