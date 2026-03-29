# Wire Frontend to Backend

## Goal
Replace mock data with real API calls. The app becomes fully functional
end-to-end: user sets parameters, clicks solve, sees real results.

## API client (src/api/client.ts)
```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function fetchPresets(): Promise<string[]>

export async function solveEigenstates(
  req: EigensolveRequest
): Promise<EigensolveResponse>

export async function solveEvolve(
  req: EvolveRequest
): Promise<EvolveResponse>
```

- Use fetch() — no axios
- All functions throw a typed ApiError on non-2xx response:
```typescript
  class ApiError extends Error {
    constructor(public status: number, public detail: string) {
      super(detail)
    }
  }
```
- Parse error body from FastAPI's {"detail": "..."} format

## State updates on solve
```
user clicks "Solve" →
  status = 'loading', clear previous result →
  call API →
  on success: status = 'success', store result, reset frame to 0 →
  on error: status = 'error', store error message →
  LoadingSpinner shown during loading
  ErrorBanner shown on error (dismissable)
```

## Environment config
Two files — do not commit .env.local:
```
# .env (committed, safe defaults)
VITE_API_URL=http://localhost:8000

# .env.local (gitignored, local overrides)
VITE_API_URL=http://localhost:8000
```

## CORS verification
The FastAPI backend must accept requests from http://localhost:5173.
Verify this is configured in main.py (already specified in spec 05).

## Dev workflow (document in README)
```bash
# Terminal 1 — backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend  
cd frontend
npm run dev           # starts on localhost:5173
```

## Export functionality (implement here)
Now that real data is available, add export buttons to PlotArea:

- "Export PNG" — use Plotly's built-in toImage()
- "Export CSV" — build CSV string from result arrays, trigger download
- "Export JSON" — JSON.stringify the full response, trigger download
```typescript
function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  // create <a>, click, revoke
}
```

## URL state (implement here)
Serialize grid config + potential selection to URL query params so
simulations are shareable by copying the URL.
```typescript
// On solve: push params to URL
// ?potential=harmonic_oscillator&xmin=-8&xmax=8&n=500&mode=stationary

// On load: read URL params and populate ControlPanel
```
Use URLSearchParams — no routing library needed.

## End-to-end tests required
Run backend and frontend together (or mock fetch in Vitest):

- Solve harmonic oscillator eigenstates: PlotArea shows 5 wavefunction traces
- Displayed E_0 value within 1% of 0.5 (atomic units, shown in UI)
- Run time evolution: animation plays, norm display stays near 1.000
- Invalid custom potential expr: ErrorBanner appears with message from API
- Export CSV: downloaded file has correct column headers
  (x, psi_real, psi_imag, potential)
- URL params round-trip: set params, reload page, same params restored

## Do not implement
- WebSocket / SSE streaming
- User accounts or saved simulations
- Deployment configuration (separate concern)

