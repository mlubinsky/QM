# Spec 13 — Probability Current: Frontend

## Goal

Display an animated J(x,t) plot alongside |ψ(x,t)|² and |φ(k,t)|² during
time evolution, using the `current_frames` field now returned by the API
(spec 12).

## What the user sees

A new `CurrentPlot` component appears below `MomentumPlot` in time-evolution
mode.  It shows J(x,t) vs x for the current animation frame, updating in
sync with the wavepacket.  A horizontal dashed line at J = 0 serves as a
reference.  The plot title is "Probability Current".

Key observations students can make:
- J = 0 for a stationary packet (k₀ = 0).
- J is positive (rightward flow) for k₀ > 0, negative for k₀ < 0.
- J reverses sign where the packet reflects off a barrier.

## New component: `frontend/src/components/CurrentPlot.tsx`

```tsx
interface CurrentPlotProps {
  evolveResult: EvolveResponse | null
  currentFrame: number
}

export function CurrentPlot({ evolveResult, currentFrame }: CurrentPlotProps)
```

Behaviour:
- Returns `null` when `evolveResult` is null.
- Reads `evolveResult.grid_x` for the x-axis.
- Reads `evolveResult.current_frames[currentFrame]` for J(x,t).
- Renders two Plotly traces:
  1. Scatter line: J(x,t) named `J(x,t)`
  2. Dashed reference line at J = 0 across the full x range (no legend entry)
- x-axis label: `x (a.u.)`
- y-axis label: `J(x,t)`
- Plot title: `Probability Current`
- `data-testid="current-plot"` on the Plot element.

## Changes to `frontend/src/types/api.ts`

`EvolveResponse` gains one new field:
```typescript
current_frames: number[][]  // shape (n_frames, n_points)
```

## Changes to `frontend/src/mock/mockData.ts`

`mockEvolveResult` gains:
- `current_frames`: nFrames identical arrays where J ≈ k₀ · |ψ|² (use the
  existing psi_frames density multiplied by a constant as a mock).

## Changes to `frontend/src/components/PlotArea.tsx`

- Import `CurrentPlot`.
- Render `<CurrentPlot evolveResult={evolveResult} currentFrame={currentFrame} />`
  in time-evolution mode, below `MomentumPlot`.

## Validation requirements (must be covered by tests)

1. `CurrentPlot` renders the plot (`data-testid="current-plot"`) when given
   valid `evolveResult`.
2. `CurrentPlot` renders nothing when `evolveResult` is null.
3. `CurrentPlot` does not throw when `current_frames` is an empty array.
4. `PlotArea` renders `CurrentPlot` in time-evolution mode.
5. `PlotArea` does not render `CurrentPlot` in stationary mode.
