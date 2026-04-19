# Spec 15 — URL State: Full Parameter Persistence and Sharing

## Goal

Produce a URL that fully describes a solver configuration so that reloading
it (or sharing it with a colleague) restores every control to the same state
and re-runs the solve automatically.

---

## Current State (gap analysis)

`urlState.ts` already exists and `App.tsx` already calls `pushUrlParams` after
each solve.  But the implementation is incomplete:

| Parameter group | Written to URL | Read back into controls |
|---|---|---|
| Mode | ✅ | ✅ (App.tsx initialState) |
| Potential name | ✅ | ❌ ControlPanel ignores it |
| Grid (xmin, xmax, n) | ✅ | ❌ ControlPanel ignores it |
| n_states | ❌ | ❌ |
| Potential slider values (λ, a, …) | ❌ | ❌ |
| Time-evolution params (x₀, σ, k₀, dt, n_steps) | ❌ | ❌ |
| Custom potential expression | ❌ | ❌ |

Additionally:
- There is no "Copy link" button — users must manually copy the address bar.
- The URL is only updated after a solve, not while editing controls.

---

## Scope

### In scope
- Extend `UrlParams` to cover all solver parameters
- Make `ControlPanel` accept initial values from URL and pre-populate all fields
- Re-run the solve automatically on page load when URL params are present
- Add a "Copy link" button that copies the current URL to the clipboard
- Validate and clamp URL params on parse to avoid feeding garbage to the solver

### Out of scope
- Server-side short URLs or redirects
- Sharing via QR code
- Saving named presets to localStorage
- Browser history navigation (back/forward) — URL is written on solve only

---

## URL Schema

All parameters are plain query string key-value pairs.  No encoding scheme
beyond standard `URLSearchParams`.

### Stationary mode

```
?mode=stationary
&potential=harmonic_oscillator
&xmin=-8&xmax=8&n=500
&n_states=5
```

Parameterized potential (double well):
```
?mode=stationary
&potential=double_well
&xmin=-6&xmax=6&n=500
&n_states=5
&p_lambda=2.0&p_a=1.5
```

Custom expression:
```
?mode=stationary
&potential=custom
&expr=0.5*x**2+0.1*x**4
&xmin=-5&xmax=5&n=500
&n_states=5
```

### Time-evolution mode

```
?mode=time-evolution
&potential=gaussian_barrier
&xmin=-10&xmax=10&n=500
&x0=-5&sigma=1.0&k0=3.0
&dt=0.005&n_steps=1000&save_every=10
```

### Parameter reference

| Key | Type | Maps to | Default |
|---|---|---|---|
| `mode` | `stationary` \| `time-evolution` | App mode | `stationary` |
| `potential` | string | preset name or `custom` | `infinite_square_well` |
| `expr` | string | custom potential expression | — |
| `xmin` | float | grid x_min | `-10` |
| `xmax` | float | grid x_max | `10` |
| `n` | int | grid n_points | `500` |
| `n_states` | int | n_states (stationary) | `5` |
| `p_<name>` | float | potential slider value | slider default |
| `x0` | float | gaussian_x0 | `0` |
| `sigma` | float | gaussian_sigma | `1.0` |
| `k0` | float | gaussian_k0 | `2.0` |
| `dt` | float | dt | `0.005` |
| `n_steps` | int | n_steps | `1000` |
| `save_every` | int | save_every | `10` |

Potential slider parameters use the `p_` prefix to avoid collisions with
other keys.  E.g. the double well `lambda` slider → `p_lambda=2.0`.

---

## Changes to Existing Files

### `frontend/src/utils/urlState.ts`

Extend `UrlParams` to include all parameters:

```typescript
export interface UrlParams {
  mode: AppMode
  potential: string
  expr: string | null               // custom expression, null if preset
  xmin: number
  xmax: number
  n: number
  nStates: number
  potentialParams: Record<string, number>  // p_* entries
  x0: number
  sigma: number
  k0: number
  dt: number
  nSteps: number
  saveEvery: number
}
```

Update `serializeUrlParams` to write all fields.
Update `parseUrlParams` to read all fields, **clamping** each to its valid range:
- `n`: clamp to [50, 2000]
- `nStates`: clamp to [1, 20]
- `xmin < xmax`: if violated, swap them
- `dt`: clamp to (0, 0.1]
- `nSteps`: clamp to [10, 10000]
- `sigma`: clamp to (0, ∞)

Unknown `p_*` keys are passed through (handled by ControlPanel's parameter
definitions — an unknown key is simply ignored).

### `frontend/src/components/ControlPanel.tsx`

Add `initialParams?: UrlParams` prop.  When provided:
- Set initial `preset` state from `initialParams.potential`
- Set initial `xMin`, `xMax`, `nPoints` from grid fields
- Set initial `nStates` from `initialParams.nStates`
- Set initial `paramValues` from `initialParams.potentialParams` (merge with
  slider defaults so unrecognised keys are dropped)
- Set initial `customExpr` from `initialParams.expr`
- Set initial `x0`, `sigma`, `k0`, `dt`, `nSteps` from time-evolution fields

### `frontend/src/App.tsx`

- Pass `initialParams` to `ControlPanel`
- After `readUrlParams()`, if `initialParams.potential !== DEFAULTS.potential`
  (i.e. the URL was non-default), trigger an automatic solve on mount using
  `useEffect` with an empty dependency array

```typescript
useEffect(() => {
  if (hasNonDefaultUrl(initialParams)) {
    handleSolve(buildRequest(initialParams))
  }
}, [])
```

`hasNonDefaultUrl` returns true if any param differs from its default,
indicating a shared URL rather than a fresh page load.

- `pushUrlParams` continues to be called after every successful solve with
  the full parameter set.

### `frontend/src/components/PlotArea.tsx` (or a new toolbar component)

Add a **"Copy link"** button in the export-buttons row:

```tsx
<button onClick={handleCopyLink}>Copy link</button>
```

`handleCopyLink` calls `navigator.clipboard.writeText(window.location.href)`.
On success, show a brief "Copied!" confirmation (replace button text for 2 s,
then restore — no new state needed beyond a local `useState`).

---

## New Files

None — all changes are to existing files.

---

## Validation Requirements

### `urlState.ts` unit tests (extend existing `urlState.test.ts`)

1. Round-trip: serialize then parse recovers all fields exactly.
2. `p_*` keys: `p_lambda=2.0&p_a=1.5` → `potentialParams: { lambda: 2.0, a: 1.5 }`.
3. Clamping: `n=99999` → clamped to `2000`; `xmin=5&xmax=-5` → swapped to `xmin=-5, xmax=5`.
4. Defaults: empty URLSearchParams returns the full default `UrlParams` object.
5. `expr` round-trip: expressions with special chars (`+`, spaces) survive `URLSearchParams` encoding.
6. `hasNonDefaultUrl`: returns false for empty params, true when any param differs.

### `ControlPanel` integration tests (extend existing test file)

7. When `initialParams` has `potential: 'harmonic_oscillator'`, the harmonic
   oscillator option is selected on render.
8. When `initialParams` has `xmin: -5`, the xMin input shows `-5`.
9. When `initialParams` has `p_lambda: 2.0` for a double-well potential,
   the lambda slider shows `2.0`.

### `App.tsx` / wiring tests

10. When URL contains non-default params, `handleSolve` is called once on
    mount without any user interaction.

### "Copy link" button

11. Clicking "Copy link" calls `navigator.clipboard.writeText` with the
    current `window.location.href`.
12. Button text changes to "Copied!" immediately after click and reverts
    after 2 s.

---

## Open Questions

1. **Auto-solve on load:** should the page auto-solve when any URL param is
   present, or only when the URL was explicitly shared (i.e. not the browser's
   own "last visited" state)?  The simplest heuristic is: auto-solve if any
   param differs from its default.  A visited page that is reloaded will
   re-solve, which is the desired behaviour for sharing.

2. **URL length:** a custom expression could be long.  `URLSearchParams`
   handles encoding; modern browsers support URLs up to ~2000 characters
   for sharing, which is sufficient for all reasonable expressions.

3. **`pushUrlParams` on control change vs. on solve:** updating the URL on
   every slider drag would create excessive history entries.  Updating only
   on solve (current behaviour) is cleaner.  `replaceState` instead of
   `pushState` could be used to avoid polluting history, but this is a
   secondary concern.

4. **`save_every` and `n_steps` in the URL:** these are advanced parameters.
   Including them enables exact reproduction of time-evolution runs.
   Excluding them would simplify the URL at the cost of reproducibility.
   **Proposed:** include all parameters for full reproducibility.
