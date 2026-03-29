# React Frontend Scaffold

## Goal
A working React + TypeScript app that renders the UI shell with
all panels and controls present, wired to mock/static data.
No real API calls yet — that is spec 07.

## Setup
- Vite + React + TypeScript (npm create vite@latest)
- Plotly.js via react-plotly.js for static plots
- No UI component library — plain CSS modules
- State management: React useState + useReducer only (no Redux/Zustand for MVP)

## Layout
```
┌─────────────────────────────────────────────────┐
│  Schrödinger Solver                    [mode toggle: Stationary | Time Evolution]
├──────────────┬──────────────────────────────────┤
│              │                                  │
│  Controls    │       Main Plot                  │
│  Panel       │       (wavefunction / animation) │
│              │                                  │
├──────────────┤──────────────────────────────────┤
│              │       Secondary Plot              │
│              │       (potential / energy levels) │
└──────────────┴──────────────────────────────────┘
```

## Components to implement

### App.tsx
- Mode toggle between "stationary" and "time-evolution"
- Renders ControlPanel + PlotArea side by side

### ControlPanel.tsx
Props: mode, onSolve (callback)
Contains:
- GridControls: x_min, x_max (number inputs), n_points (slider 50–2000)
- PotentialSelector: dropdown of presets + optional text input for custom expr
- If mode === "stationary":
    - n_states slider (1–20)
    - "Solve Eigenstates" button
- If mode === "time-evolution":
    - GaussianControls: x0, sigma, k0 (number inputs)
    - dt input, n_steps slider
    - "Run Evolution" button
- LoadingSpinner shown while solving

### PlotArea.tsx
Props: mode, result (EigensolveResult | EvolveResult | null)
Contains:
- MainPlot: shows mock wavefunction(s) or |ψ(x,t)|² frame
- SecondaryPlot: shows mock potential V(x) and energy levels (stationary)
  or norm_history over time (time-evolution)

### MainPlot.tsx
- Stationary mode: overlay plot of first k eigenfunctions, 
  each offset by its energy (standard physics convention)
- Time evolution mode: single |ψ(x,t)|² curve, with frame slider below
- Use Plotly react component
- Show potential V(x) as a faded background line on the main plot

### SecondaryPlot.tsx  
- Stationary: horizontal lines at each E_n with label
- Time evolution: line chart of norm_history vs time

### AnimationControls.tsx (time-evolution mode only)
- Frame slider (0 to n_frames-1)
- Play / Pause button
- Speed selector: 0.5x, 1x, 2x, 4x
- Animation driven by setInterval updating frame index
- Current time display: t = {time} atomic units

## Mock data (src/mock/mockData.ts)
Provide static arrays that match the real API response shapes exactly.
Use harmonic oscillator analytic values for mock eigenstates.
This lets the UI be developed and tested without a running backend.

## State shape
```typescript
type AppState = {
  mode: 'stationary' | 'time-evolution'
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  eigenResult: EigensolveResponse | null
  evolveResult: EvolveResponse | null
  currentFrame: number   // for animation
  playing: boolean
}
```

## Types (src/types/api.ts)
Define TypeScript interfaces matching every Pydantic model in spec 05.
These are the single source of truth for request/response shapes on the frontend.

## Tests required
- Vitest + React Testing Library
- ControlPanel renders all controls in stationary mode
- ControlPanel renders GaussianControls in time-evolution mode
- Mode toggle switches rendered controls
- AnimationControls play/pause updates playing state
- MainPlot renders without crashing given mock eigenstate data
- All inputs have accessible labels (aria-label or <label>)

## Do not implement
- Real API calls (spec 07)
- URL state serialization (future)
- Export buttons (future)
- Responsive / mobile layout (future)

