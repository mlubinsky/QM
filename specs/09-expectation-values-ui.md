# Spec 09 — Expectation Values UI

## Goal

Display the expectation values computed by the backend (spec 08) in the
browser during time-evolution mode. The user should be able to see the
Ehrenfest trajectory and the Heisenberg uncertainty product as functions
of time without leaving the UI.

## What to show

| Quantity | Description |
|---|---|
| ⟨x(t)⟩ | Position expectation value — traces the classical trajectory |
| ⟨p(t)⟩ | Momentum expectation value |
| Δx(t)·Δp(t) | Uncertainty product — should stay ≥ ½ |

`⟨x²⟩`, `⟨p²⟩`, and `⟨H⟩` are returned by the API but not plotted
in this spec (available for future work).

## Layout

A new third plot — `ExpectationValuesPlot` — is rendered below the
Norm History plot in time-evolution mode only.

Single Plotly figure with two y-axes:
- **Left y-axis**: ⟨x(t)⟩ and ⟨p(t)⟩ traces, label `⟨x⟩, ⟨p⟩ (a.u.)`
- **Right y-axis**: Δx·Δp trace + dashed reference line at 0.5
  (Heisenberg bound), label `Δx·Δp`
- **X-axis**: `t (a.u.)`
- **Title**: `Expectation Values`

Δx·Δp is computed on the frontend from the returned `expect_x`,
`expect_x2`, `expect_p`, `expect_p2` arrays:

    Δx(t) = √( max(⟨x²⟩ − ⟨x⟩², 0) )
    Δp(t) = √( max(⟨p²⟩ − ⟨p⟩², 0) )
    Δx·Δp = Δx × Δp

## Changes required

### `frontend/src/types/api.ts`
Add five fields to `EvolveResponse`:
```typescript
expect_x: number[]
expect_p: number[]
expect_x2: number[]
expect_p2: number[]
expect_H: number[]
```

### `frontend/src/mock/mockData.ts`
Add realistic mock values for the five new fields in `mockEvolveResult`.

### `frontend/src/components/ExpectationValuesPlot.tsx` (new)
Props: `evolveResult: EvolveResponse | null`
- Returns `null` when `evolveResult` is null.
- Renders a Plotly figure with the three quantities described above.
- `data-testid="expectation-values-plot"` on the Plot element.

### `frontend/src/components/PlotArea.tsx`
Render `<ExpectationValuesPlot>` below `<SecondaryPlot>` in
time-evolution mode when `evolveResult` is non-null.

## Tests (`frontend/src/test/ExpectationValuesPlot.test.tsx`)

1. Renders the plot element when given valid mock data.
2. Renders nothing when `evolveResult` is null.
3. Does not throw for zero-length expectation value arrays.
