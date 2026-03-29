# Third-Party Dependencies

All packages installed during development of this project, with the version
present at install time and the reason each was added.

---

## Python (backend)

Installed into the system/conda Python environment via `pip install`.

| Package | Version | Why |
|---|---|---|
| `fastapi` | 0.115.14 | REST API framework (spec 05) |
| `uvicorn` | 0.34.3 | ASGI server to run FastAPI |
| `pydantic` | 2.11.7 | Request/response model validation (FastAPI dependency, v2 required) |
| `starlette` | 0.46.2 | FastAPI's underlying ASGI toolkit (transitive) |
| `scipy` | 1.10.0 | `eigsh` sparse eigenvalue solver; `splu` LU factorisation; `sparse.diags` |
| `numpy` | 1.23.5 | All numerical arrays, `linspace`, `diag`, etc. |
| `asteval` | 1.0.8 | Safe math expression evaluator for user-supplied potentials (spec 05) |
| `httpx` | 0.28.1 | FastAPI `TestClient` transport layer (used in `test_api.py`) |
| `anyio` | 4.9.0 | Async I/O abstraction (transitive dependency of FastAPI/httpx) |
| `sniffio` | 1.2.0 | Async library detection (transitive) |

### Python install commands

```bash
pip install fastapi uvicorn scipy numpy asteval httpx
```

---

## JavaScript / TypeScript (frontend)

Scaffolded with `npm create vite@latest frontend -- --template react-ts`, then
additional packages added via `npm install`.

### Runtime dependencies (`dependencies`)

| Package | Version | Why |
|---|---|---|
| `react` | ^19.2.4 | UI framework |
| `react-dom` | ^19.2.4 | React DOM renderer |
| `plotly.js` | ^3.4.0 | Scientific plotting library |
| `react-plotly.js` | ^2.6.0 | React wrapper for Plotly |

### Development / tooling dependencies (`devDependencies`)

| Package | Version | Why |
|---|---|---|
| `vite` | ^8.0.1 | Build tool and dev server (scaffolded) |
| `@vitejs/plugin-react` | ^6.0.1 | Vite plugin for React JSX transform |
| `typescript` | ~5.9.3 | TypeScript compiler (scaffolded) |
| `vitest` | ^3.2.4 | Unit test runner (Vite-native) |
| `@vitest/coverage-v8` | ^4.1.2 | Code coverage for Vitest |
| `jsdom` | ^27.0.1 | DOM environment for Vitest tests |
| `@testing-library/react` | ^16.3.2 | React component test utilities |
| `@testing-library/user-event` | ^14.6.1 | Simulated user interactions in tests |
| `@testing-library/jest-dom` | ^6.9.1 | Extra DOM matchers (`toBeInTheDocument`, etc.) |
| `@types/react` | ^19.2.14 | TypeScript types for React |
| `@types/react-dom` | ^19.2.3 | TypeScript types for React DOM |
| `@types/react-plotly.js` | ^2.6.4 | TypeScript types for react-plotly.js |
| `@types/node` | ^24.12.0 | TypeScript types for Node.js APIs |
| `eslint` | ^9.39.4 | Linter (scaffolded) |
| `@eslint/js` | ^9.39.4 | ESLint core rules |
| `typescript-eslint` | ^8.57.0 | TypeScript-aware ESLint rules |
| `eslint-plugin-react-hooks` | ^7.0.1 | Lint React hooks rules |
| `eslint-plugin-react-refresh` | ^0.5.2 | Lint React fast-refresh compatibility |
| `globals` | ^17.4.0 | Global variable definitions for ESLint |

### JavaScript install commands

```bash
# Scaffold (run once in project root)
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Additional runtime deps
npm install react-plotly.js plotly.js

# Additional dev/test deps
npm install --save-dev vitest @vitest/coverage-v8 \
  @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom @types/react-plotly.js jsdom
```
