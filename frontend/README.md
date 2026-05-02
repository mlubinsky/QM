# Frontend — Schrödinger Solver

React + TypeScript + Vite frontend for the Schrödinger Solver.
Full project documentation is in the [root README](../README.md).

## Development

```bash
cp .env.example .env          # first time only — set VITE_API_URL if needed
npm install
npm run dev                   # http://localhost:5173
```

The backend must be running at the URL in `.env` (default `http://localhost:8000`).
See the root README for backend setup.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |

## Environment

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL |

Copy `.env.example` to `.env` and edit if your backend runs on a different port or host.
