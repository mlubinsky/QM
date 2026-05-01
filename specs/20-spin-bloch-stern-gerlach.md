# Spec 20 — Spin-½ / Bloch Sphere / Stern-Gerlach

## Decisions

| Question | Decision |
|---|---|
| 3D library | Three.js |
| Navigation | New `<optgroup label="Spin">` in existing dropdown |
| Trajectory computation | Client-side only — no `/api/spin/evolve` endpoint |
| "Measure once" | Collapses displayed state to post-measurement eigenstate |
| Units | Atomic units throughout (ħ = m_e = 1), consistent with rest of app |

---

## Mathematics

### State representation

```
|ψ⟩ = α|↑⟩ + β|↓⟩,   α,β ∈ ℂ,   |α|² + |β|² = 1
```

Bloch parameterization (eliminates global phase):

```
|ψ⟩ = cos(θ/2)|↑⟩ + e^(iφ) sin(θ/2)|↓⟩,   θ ∈ [0,π],   φ ∈ [0,2π)
```

Bloch vector:

```
r = (sin θ cos φ,  sin θ sin φ,  cos θ)   with |r| = 1
```

### Pauli matrices

```
σ_x = [[0, 1], [1, 0]]
σ_y = [[0, -i], [i, 0]]
σ_z = [[1, 0], [0, -1]]
```

Expectation values directly from Bloch vector:

```
⟨σ_x⟩ = r_x,   ⟨σ_y⟩ = r_y,   ⟨σ_z⟩ = r_z
```

### Precession (client-side, analytic)

Hamiltonian: `H = (ω₀/2)(B̂ · σ)` where B̂ is the unit field direction and ω₀ is the
Larmor frequency (dimensionless, rad / atomic time unit).

Bloch vector rotates rigidly around B̂ via Rodrigues' formula — no numerical integration needed:

```
r(t) = r cos(ω₀ t)
     + (B̂ × r) sin(ω₀ t)
     + B̂ (B̂ · r)(1 − cos(ω₀ t))
```

`|r(t)| = 1` exactly for all t by construction.

### Stern-Gerlach measurement along axis n̂

```
P(+n̂) = (1 + n̂ · r) / 2
P(−n̂) = 1 − P(+n̂)
```

Post-measurement state after outcome +n̂:

```
|ψ'⟩ = |+n̂⟩   →   θ' = arccos(n̂_z),   φ' = atan2(n̂_y, n̂_x)
```

Post-measurement state after outcome −n̂:

```
|ψ'⟩ = |−n̂⟩   →   θ' = π − arccos(n̂_z),   φ' = atan2(n̂_y, n̂_x) + π
```

---

## Backend changes

Two endpoints only (trajectory is client-side).

### `POST /api/spin/measure`

Request:
```json
{
  "theta": 1.5707963,
  "phi": 0.0,
  "axis": [0, 0, 1],
  "n_shots": 1000
}
```

Response:
```json
{
  "p_plus": 0.5,
  "p_minus": 0.5,
  "shots_plus": 503,
  "shots_minus": 497,
  "axis_label": "z"
}
```

`axis` is a unit 3-vector `[n_x, n_y, n_z]`. Backend normalizes it and returns an
`axis_label` ("x", "y", "z", or "custom").

### `GET /api/spin/pauli`

Response:
```json
{
  "sigma_x": [[0,1],[1,0]],
  "sigma_y": [[0,[0,-1]],[[0,1],0]],
  "sigma_z": [[1,0],[0,-1]],
  "eigenvalues": [-1, 1],
  "eigenvectors": {
    "sigma_x": { "plus": [0.707, 0.707], "minus": [0.707, -0.707] },
    "sigma_y": { "plus": [0.707, [0,0.707]], "minus": [0.707, [0,-0.707]] },
    "sigma_z": { "plus": [1, 0], "minus": [0, 1] }
  }
}
```

### Backend validation tests

- `|↑⟩` measured along z: `p_plus = 1.0`, `p_minus = 0.0`
- `|↓⟩` measured along z: `p_plus = 0.0`, `p_minus = 1.0`
- `|+x⟩` (θ=π/2, φ=0) measured along x: `p_plus = 1.0`
- `|+x⟩` measured along z: `p_plus ≈ 0.5` (within shot noise for large N)
- Axis normalization: `[0, 0, 2]` treated same as `[0, 0, 1]`

---

## Frontend changes

### 1. Type updates — `types/api.ts`

```typescript
export type AppMode = 'stationary' | 'time-evolution' | 'hydrogenic' | 'spin'

export interface SpinMeasureRequest {
  theta: number
  phi: number
  axis: [number, number, number]
  n_shots: number
}

export interface SpinMeasureResponse {
  p_plus: number
  p_minus: number
  shots_plus: number
  shots_minus: number
  axis_label: string
}

export interface SpinPauliResponse {
  sigma_x: number[][]
  sigma_y: number[][]   // complex entries encoded as [re, im] pairs
  sigma_z: number[][]
  eigenvalues: number[]
  eigenvectors: Record<string, { plus: number[], minus: number[] }>
}
```

### 2. API client — `api/client.ts`

Add `spinMeasure(req: SpinMeasureRequest): Promise<SpinMeasureResponse>` and
`spinPauli(): Promise<SpinPauliResponse>`.

### 3. Navigation — `App.tsx`

```tsx
<optgroup label="Spin">
  <option value="spin">Spin ½ / Bloch Sphere</option>
</optgroup>
```

Reducer: `SET_MODE` with `mode: 'spin'` clears all existing results (same pattern as
other modes). No URL persistence for spin state in MVP — page refresh returns to
default `|↑⟩`.

Mode equation display:
```tsx
state.mode === 'spin' ? <span>H = ½ω₀(B̂·σ)</span> : ...
```

### 4. Client-side spin math — `utils/spinMath.ts`

```typescript
// Bloch vector from (θ, φ)
export function blochVector(theta: number, phi: number): [number, number, number]

// Rodrigues rotation for one time step
export function rodriguezRotate(
  r: [number, number, number],
  axis: [number, number, number],  // unit vector B̂
  angle: number                    // ω₀ · dt
): [number, number, number]

// Precompute full trajectory
export function computeTrajectory(
  theta: number, phi: number,
  Bhat: [number, number, number],
  omega0: number,
  tMax: number,
  nFrames: number
): [number, number, number][]

// (θ, φ) of post-measurement eigenstate
export function collapseState(
  axis: [number, number, number],
  outcome: '+' | '-'
): { theta: number; phi: number }
```

All pure functions, no side effects. Unit-tested independently.

### 5. New components

#### `SpinPanel.tsx`
Top-level container for spin mode. Holds all local state:
- `theta`, `phi` — current Bloch angles
- `Bhat`, `omega0` — precession field
- `playing`, `currentFrame`, `trajectory`
- `measureResult` — last Stern-Gerlach outcome

Layout: left column (StateComposer + PrecessionControls + SternGerlachPanel +
PauliMatrixDisplay) beside right column (BlochSphere).

#### `BlochSphere.tsx`
Three.js canvas component.

Elements:
- Semi-transparent unit sphere (`MeshStandardMaterial`, opacity 0.15)
- Three axis lines with `ArrowHelper` (x=red, y=green, z=blue)
- Pole labels: `+z` → |↑⟩, `−z` → |↓⟩, `+x` → |+x⟩, `+y` → |+y⟩ (HTML overlay or
  `TextGeometry`)
- State vector: `ArrowHelper` from origin to r, colored white
- Trajectory arc: `Line` through last N points of trajectory, fading opacity
- Measurement axis indicator: dashed line when Stern-Gerlach panel is active
- `OrbitControls` for mouse rotation/zoom

Props: `theta`, `phi`, `trajectory`, `playing`, `measureAxis?`

#### `SpinStateComposer.tsx`
Two input modes toggled by a radio:

**Angles mode** (default):
- θ slider: 0 → π, step 0.01, label "θ (polar)"
- φ slider: 0 → 2π, step 0.01, label "φ (azimuthal)"

**Components mode**:
- Re(α), Im(α), Re(β), Im(β) number inputs
- Normalize on change; update θ/φ from result

Preset buttons: |↑⟩ · |↓⟩ · |+x⟩ · |−x⟩ · |+y⟩ · |−y⟩

Readout below inputs:
```
⟨σ_x⟩ = 0.000   ⟨σ_y⟩ = 0.000   ⟨σ_z⟩ = 1.000
```

#### `PrecessionControls.tsx`
- B̂ direction: θ_B and φ_B sliders (or preset buttons: along x / y / z)
- ω₀ slider: 0.1 → 10, default 1.0, label "ω₀ (rad / a.u.)"
- t_max slider: 1 → 100, default 2π/ω₀ (one period)
- n_frames: fixed 120
- Play / Pause button
- "Reset to t=0" button

On play: `requestAnimationFrame` loop advances frame index, reads precomputed
trajectory, updates θ/φ passed to BlochSphere.

#### `PauliMatrixDisplay.tsx`
Collapsible `<details>` element. Shows 3 matrices in a clean grid with complex
entries rendered as `a + bi`. Eigenvalues (±1) and eigenvectors listed below each
matrix. Static data from `/api/spin/pauli` fetched once on mount.

#### `SternGerlachPanel.tsx`
- Axis selector: radio buttons x / y / z / custom
- Custom: θ_n and φ_n sliders
- N_shots input: 1 → 10000, default 1000
- Two action buttons:
  - **"Measure once"** — single Bernoulli draw; shows result (+½ or −½) in bold;
    updates `theta`/`phi` in SpinPanel to the collapsed eigenstate; flashes the
    outcome on the Bloch sphere (arrow jumps to pole)
  - **"Run N shots"** — calls `/api/spin/measure`; renders histogram

Histogram: two bars (+ and −) with exact probability overlaid as a line.

---

## Implementation order

1. `utils/spinMath.ts` + unit tests
2. Backend: `/api/spin/measure` + `/api/spin/pauli` + pytest tests
3. `types/api.ts` — add `AppMode` value and request/response types
4. `api/client.ts` — add `spinMeasure`, `spinPauli`
5. `App.tsx` — add `'spin'` to reducer and dropdown; render `<SpinPanel />` when active
6. `BlochSphere.tsx` — Three.js sphere, axes, state arrow (no trajectory yet)
7. `SpinStateComposer.tsx` — sliders + presets wired to BlochSphere
8. `PrecessionControls.tsx` + trajectory animation
9. `PauliMatrixDisplay.tsx`
10. `SternGerlachPanel.tsx` — "Measure once" (collapse) + "Run N shots" (histogram)
11. `SpinPanel.tsx` — assemble all components
12. Integration tests for spin mode

---

## Validation checklist (must pass before done)

- [ ] `|↑⟩`: Bloch arrow points to north pole; ⟨σ_z⟩ = 1
- [ ] `|↓⟩`: Bloch arrow points to south pole; ⟨σ_z⟩ = −1
- [ ] `|+x⟩`: arrow points to +x; P(+z) = 0.5 in histogram
- [ ] Precession under B̂=ẑ: arrow traces horizontal circle, |r| = 1 at all frames
- [ ] Precession period = 2π/ω₀ (one full rotation matches slider setting)
- [ ] "Measure once" |+x⟩ along z: result is |↑⟩ or |↓⟩, sphere updates accordingly
- [ ] "Measure once" |↑⟩ along z: always +½, sphere stays at north pole
- [ ] N_shots histogram converges to exact probabilities for large N
