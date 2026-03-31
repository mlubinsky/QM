# Spec 11 — Momentum-Space View: Frontend

## Goal

Display an animated |φ(k,t)|² plot alongside the existing |ψ(x,t)|² plot
during time evolution, using the `momentum_frames` and `momentum_k` fields
now returned by the `/solve/evolve` API (spec 10).

## What the user sees

A new `MomentumPlot` component appears below the main wavepacket plot during
time-evolution mode.  It shows a single Plotly line trace of |φ(k,t)|² vs k
for the current animation frame, updating in sync with the wavepacket
animation.  The x-axis is k (rad/a.u.) and the y-axis is |φ(k,t)|².

## New component: `frontend/src/components/MomentumPlot.tsx`

```tsx
interface MomentumPlotProps {
  evolveResult: EvolveResponse | null
  currentFrame: number
}

export function MomentumPlot({ evolveResult, currentFrame }: MomentumPlotProps)
```

Behaviour:
- Returns `null` when `evolveResult` is null.
- Reads `evolveResult.momentum_k` for the k-axis (same for all frames).
- Reads `evolveResult.momentum_frames[currentFrame]` for the current density.
- Renders a Plotly scatter trace named `|φ(k,t)|²`.
- x-axis label: `k (rad/a.u.)`
- y-axis label: `|φ(k,t)|²`
- Plot title: `Momentum Distribution`
- `data-testid="momentum-plot"` on the Plot element.

## Changes to `frontend/src/types/api.ts`

`EvolveResponse` gains two new fields:
```typescript
momentum_frames: number[][]  // shape (n_frames, n_points)
momentum_k: number[]         // shape (n_points,)
```

## Changes to `frontend/src/mock/mockData.ts`

`mockEvolveResult` gains matching mock fields:
- `momentum_k`: N evenly-spaced values centred on 0.
- `momentum_frames`: nFrames identical Gaussian-shaped arrays (mock density).

## Changes to `frontend/src/components/PlotArea.tsx`

- Import `MomentumPlot`.
- Render `<MomentumPlot evolveResult={evolveResult} currentFrame={currentFrame} />`
  in time-evolution mode, below `<MainPlot>`.

## Validation requirements (must be covered by tests)

1. `MomentumPlot` renders the plot (`data-testid="momentum-plot"`) when given
   valid `evolveResult`.
2. `MomentumPlot` renders nothing when `evolveResult` is null.
3. `MomentumPlot` does not throw when `momentum_frames` is an empty array.
4. `PlotArea` renders `MomentumPlot` in time-evolution mode.
5. `PlotArea` does not render `MomentumPlot` in stationary mode.
