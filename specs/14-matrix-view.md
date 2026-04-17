# Spec 14 — Matrix View: Heisenberg Picture Visualization

## Goal

Add a "Matrix" sub-panel within stationary mode that visualizes the
Hamiltonian, position, and momentum operators as matrices in the energy
eigenbasis, and animates the time evolution of their real parts.  This
makes the connection between the Schrödinger wavefunction picture and the
Heisenberg matrix picture explicit and visual.

This is a **pure visualization layer**.  All computation is frontend-only,
reusing the `eigenResult` already returned by the existing `/solve/eigenstates`
endpoint.  No new backend code is needed.

---

## Scope

### In scope
- Compute H, X, P matrices in the energy eigenbasis from `eigenResult`
  entirely in the browser
- Display each matrix as a color-coded heatmap with hover tooltips
- Animate Re[O_mn(t)] for X and P using the Heisenberg phase factors
- Show the Bohr frequency matrix ω_mn = E_m − E_n as a reference table

### Out of scope
- New backend endpoints (none required)
- Time-evolution mode integration (matrix view is stationary-only)
- Density matrix / mixed states
- Operator algebra (commutators, uncertainty product from matrices)
- Export of matrix data (can be added later)

---

## Issues and Clarifications in the Proposal

### 1. Magnitude is time-invariant — animation must show Re[O_mn(t)], not |O_mn(t)|

The proposal states "animate the time evolution of matrix elements."
This needs to be precise:

```
O_mn(t) = O_mn(0) · exp(i(Em − En)t)
|O_mn(t)| = |O_mn(0)|   — constant, does not change with time
```

Animating a magnitude heatmap would show nothing moving.  The animation
must display **Re[O_mn(t)]** (or Im[O_mn(t)]), which oscillates as:

```
Re[X_mn(t)] = X_mn · cos((Em − En)t)          (X_mn is real)
Re[P_mn(t)] = -Im[P_mn] · sin((Em − En)t)     (P_mn is purely imaginary)
```

The static view (t = 0) should show |O_mn| to reveal selection-rule
structure.  The animated view shows Re[O_mn(t)].  Both views are needed.

### 2. UI placement: sub-panel, not a third top-level tab

The proposal says "new Matrix View tab."  Adding a third top-level mode
tab would imply a mode with its own solve button and independent state,
paralleling Stationary and Time Evolution.  That is wrong here:

- Matrix view requires `eigenResult` — it has no meaning without first
  solving in stationary mode.
- The user should not need to switch mode to see the matrix view; it is
  a different lens on the same stationary result.

**Decision:** render the Matrix panel below `ExactSolutionPanel` in
stationary mode, visible only after `eigenResult` is available.
A collapsible `<details>` element keeps it out of the way by default.

### 3. Momentum matrix is purely imaginary, not real

The proposal correctly states P_mn is purely imaginary and antisymmetric.
The static heatmap for P must therefore show Im[P_mn] (not Re[P_mn],
which is numerically zero for real eigenfunctions).  At t = 0:
```
P_mn(0) = i · Im[P_mn]   →   display Im[P_mn]
```
The animation then shows Re[P_mn(t)] = −Im[P_mn] · sin((Em − En)t).

### 4. Numerical zeros and selection rules

For potentials with definite parity (harmonic oscillator, ISW, double
well), selection rules make many matrix elements exactly zero:
- X_mn = 0 unless m and n have opposite parity
- P_mn = 0 unless m and n have opposite parity

In practice, floating-point arithmetic gives ~1e-14 instead of 0.  The
heatmap color scale must be symmetric and the display should note the
threshold (e.g. elements with |O_mn| < 1e-10 are treated as zero for
the color scale floor, but the tooltip still shows the raw value).

### 5. H matrix display is trivial but pedagogically important

H_mn = E_n δ_mn is a diagonal matrix read directly from `eigenResult.energies`.
No numerical integration is needed.  It should still be shown — seeing
that H is diagonal in its own eigenbasis is the central point of the
Heisenberg picture.

---

## Physics Reference (implementation detail)

All quantities in atomic units (ħ = m_e = 1).

### Matrix elements

```
H_mn = E_n · δ_mn

X_mn = Σ_j ψ_m[j] · x[j] · ψ_n[j] · Δx        (real, symmetric)

P_mn = Σ_j ψ_m[j] · (−i) · (dψ_n/dx)[j] · Δx   (purely imaginary, antisymmetric)
     where dψ_n/dx is the central finite difference of ψ_n
```

### Heisenberg time evolution

```
O_mn(t) = O_mn(0) · exp(i · ω_mn · t)
ω_mn = E_m − E_n                   (Bohr frequencies, atomic units)
```

The diagonal (m = n) is always time-independent since ω_nn = 0.

### Animation formula (what to render)

```
Re[X_mn(t)] = X_mn · cos(ω_mn · t)
Im[P_mn(t)] = Im[P_mn(0)] · cos(ω_mn · t)    (since P_mn is imaginary)
```

Both reduce to element-wise multiplication of the static matrix by a
cosine factor that changes with t.  No matrix exponentiation is needed.

---

## UI Design

### Layout

Matrix panel appears inside the stationary-mode plot area, below
`ExactSolutionPanel`, wrapped in a `<details>` element:

```
<details>
  <summary>Matrix representation (Heisenberg picture)</summary>
  [matrix panel content]
</details>
```

Closed by default; user opens it explicitly.

### Content (inside the panel)

**Header row:** three buttons to switch between operators: `H`, `X`, `P`.
Active button is highlighted.

**Static heatmap tab ("Structure at t = 0"):**
- Color-coded N×N grid (N = number of eigenstates)
- Color scale: symmetric diverging (blue = negative, white = 0, red = positive)
  - For H: show diagonal values (all positive, so use sequential scale)
  - For X: show X_mn (real)
  - For P: show Im[P_mn] (real, antisymmetric)
- Row/column axes labeled ψ₁ … ψ_N
- Hover tooltip: "X₂₃ = 0.7071 a.u."
- Title: "⟨ψ_m|X|ψ_n⟩" (rendered with KaTeX or plain text)

**Animated view tab ("Time evolution Re[O(t)]"):**
- Same N×N heatmap but values update each animation frame
- Play/pause button and time display "t = 3.14 a.u."
- Speed slider (same pattern as AnimationControls)
- The diagonal row does not change (ω_nn = 0 — label it "(static)")
- Note below: "Colour shows Re[O_mn(t)]. Magnitude |O_mn| is time-invariant."

**Bohr frequency table (collapsible sub-section):**
- N×N table of ω_mn = E_m − E_n values
- Helps user understand which matrix elements oscillate fast vs. slow

---

## New Files

### `frontend/src/utils/matrixElements.ts`

Pure computation module — no React.

```typescript
// Returns H_mn diagonal (length N array = energies)
export function buildH(energies: number[]): number[]

// Returns X_mn as N×N flat array (row-major)
export function buildX(
  wavefunctions: number[][],
  grid_x: number[],
  dx: number,
): number[][]

// Returns Im[P_mn] as N×N flat array (P_mn is purely imaginary, antisymmetric)
export function buildP(
  wavefunctions: number[][],
  dx: number,
): number[][]

// Returns Re[O_mn(t)] given the static matrix, energies, and time t
export function heisenbergRe(
  O: number[][],
  energies: number[],
  t: number,
): number[][]
```

### `frontend/src/components/MatrixPanel.tsx`

```tsx
interface MatrixPanelProps {
  eigenResult: EigensolveResponse
}
export function MatrixPanel({ eigenResult }: MatrixPanelProps)
```

Internal state:
- `operator: 'H' | 'X' | 'P'`
- `view: 'static' | 'animated'`
- `playing: boolean`
- `t: number` (current animation time)

Animation loop: `useEffect` with `requestAnimationFrame`, increments `t`
by `dt_anim * speed` each frame.  `dt_anim` defaults to 0.05 a.u.

### `frontend/src/components/MatrixHeatmap.tsx`

Renders a single N×N matrix as an HTML `<table>` with inline background-color
styles (CSS `hsl` interpolation from the value range).

Why not Plotly? For a ≤20×20 matrix, a styled `<table>` is lighter,
avoids the Plotly heatmap trace overhead, and allows per-cell tooltips
via `title=` attributes without custom hover logic.  Plotly can be
revisited if N becomes large.

```tsx
interface MatrixHeatmapProps {
  data: number[][]       // N×N matrix of real values to display
  rowLabels: string[]    // ["ψ₁", "ψ₂", …]
  colLabels: string[]
  title: string          // shown above the heatmap
  threshold?: number     // values with |v| < threshold shown as 0 (default 1e-10)
}
```

---

## Changes to Existing Files

### `frontend/src/components/PlotArea.tsx`

- Import `MatrixPanel`.
- In stationary mode, after `ExactSolutionPanel`, render:
  ```tsx
  {mode === 'stationary' && eigenResult && (
    <MatrixPanel eigenResult={eigenResult} />
  )}
  ```

No other existing files change.

---

## Validation Requirements

### `matrixElements.ts` (unit tests, no React)

1. `buildH`: returns array equal to `energies`.
2. `buildX`: result is symmetric — `X[m][n] === X[n][m]` within 1e-10.
3. `buildX`: for harmonic oscillator ground + first excited state, `X₀₁`
   matches the analytic value `1/√2 ≈ 0.7071` within 0.01.
4. `buildP`: result is antisymmetric — `P[m][n] === −P[n][m]` within 1e-10.
5. `buildP`: for a real eigenfunction, `Re[P_mn] = 0` (verify Im[P] is stored,
   not Re[P]).
6. `heisenbergRe`: diagonal elements unchanged at any t.
7. `heisenbergRe`: at t = 0, `Re[O(0)] == O` (for X, which is real).
8. `heisenbergRe`: at t = π/ω₁₂, the (1,2) element has flipped sign
   (cos(π) = −1).

### `MatrixPanel.tsx` (React component tests)

9. Renders without error when given a valid `eigenResult`.
10. Operator selector buttons H, X, P are all present.
11. Clicking X shows the X heatmap (check title text).
12. Clicking "animated" tab shows the play/pause button.
13. Does not render when `eigenResult` is null (tested via `PlotArea`).

### `MatrixHeatmap.tsx`

14. Renders an N×N table for N=3 input.
15. Cell tooltip (title attribute) contains the numeric value.
16. Values below `threshold` are displayed as "0".

---

## Open Questions

1. **Color scale for P:** Im[P_mn] is antisymmetric so the diverging
   blue-white-red scale is natural.  Should the scale be fixed to the
   global max of the displayed operator, or auto-scaled per operator?
   Auto-scale is simpler but makes H and X appear equally "strong."
   **Proposed default:** auto-scale per operator, with the range shown
   in the legend.

2. **Animation time range:** the Heisenberg oscillation period for element
   (m,n) is T_mn = 2π / |E_m − E_n|.  The animation has no natural
   endpoint.  Should it loop after the longest period (slowest oscillation)
   or run indefinitely?  **Proposed:** run indefinitely; user pauses manually.

3. **MatrixHeatmap implementation — HTML table vs. Plotly heatmap:**
   Rationale for HTML table is given above (simpler for ≤20×20).
   Revisit if n_states > 20 is ever supported.

4. **N_states limit:** should the Matrix panel be hidden or show a warning
   if `eigenResult.energies.length === 1` (only one eigenstate computed)?
   A 1×1 matrix is technically correct but not interesting.
   **Proposed:** show a message "Compute at least 2 eigenstates to see
   off-diagonal structure" when N < 2.

5. **`<details>` vs. always-visible:** the `<details>` wrapper keeps the
   panel collapsed by default.  An alternative is a checkbox "Show matrix
   view."  Both are acceptable; `<details>` requires no new state.
