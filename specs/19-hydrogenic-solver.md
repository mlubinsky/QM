# Spec 19 — Hydrogenic Solver (Phase 2)

Single-electron atoms and ions with nuclear charge Z: H, He⁺, Li²⁺, Be³⁺, …
All are analytically exact; we solve numerically and validate against the closed form.

---

## Physics summary

### Radial equation

Separation of variables gives `ψ_nlm(r,θ,φ) = R_nl(r) · Y_l^m(θ,φ)`.
Substituting `u_nl(r) = r · R_nl(r)` reduces the radial part to a 1-D eigenvalue problem:

```
-½ d²u/dr² + V_eff(r) · u = E · u

V_eff(r) = -Z/r  +  l(l+1) / (2r²)
```

This is identical in form to the existing 1-D Schrödinger solver.
The only differences are:
- radial coordinate r ∈ (0, ∞), so r_min > 0 is required
- V_eff depends on both Z and l (centrifugal barrier)

### Exact eigenvalues (atomic units, ħ = m_e = e = 1)

```
E_n = -Z² / (2n²)       n = 1, 2, 3, …
```

In eV: `E_n = -Z² · 13.6057 eV / n²` (use `HARTREE_TO_EV` from `shared/units.py`).

### Orbital size scaling

Mean radius `⟨r⟩_nl = a_Z/(2Z) · (3n² - l(l+1))` where `a_Z = 1/Z` (in a.u.).
Grid r_max must scale accordingly; see §Backend.

### Quantum numbers

| Symbol | Name      | Range        |
|--------|-----------|--------------|
| n      | principal | 1 … 5        |
| l      | angular   | 0 … n-1      |
| m      | magnetic  | -l … l       |
| Z      | nuclear   | 1 … 10       |

Orbital notation: l = 0,1,2,3 → s,p,d,f. Example: n=3,l=2 → "3d".

### 2-D cross-section (xz-plane, y=0)

For a point (x, z):
```
r = sqrt(x² + z²)
θ = arccos(z / r)
φ = 0   (xz-plane convention)

|ψ(x,0,z)|² = |R_nl(r)|² · |Y_l^m(θ, 0)|²
```

`R_nl(r) = u_nl(r) / r` from the numerical solution.
`Y_l^m` from `scipy.special.sph_harm`.

---

## Ion name table

| Z  | Symbol | Name       |
|----|--------|------------|
| 1  | H      | hydrogen   |
| 2  | He⁺    | helium     |
| 3  | Li²⁺   | lithium    |
| 4  | Be³⁺   | beryllium  |
| 5  | B⁴⁺    | boron      |
| 6  | C⁵⁺    | carbon     |
| 7  | N⁶⁺    | nitrogen   |
| 8  | O⁷⁺    | oxygen     |
| 9  | F⁸⁺    | fluorine   |
| 10 | Ne⁹⁺   | neon       |

---

## Backend

### New namespace: `solvers/hydrogenic/`

```
backend/solvers/hydrogenic/
├── __init__.py
├── radial_solver.py   # grid setup + effective potential + eigensolver call
├── orbitals.py        # 2-D xz cross-section using sph_harm
└── router.py          # FastAPI APIRouter, mounted at /hydrogenic
```

### `radial_solver.py`

```python
def solve(Z: int, l: int, n_states: int = 5, n_points: int = 600
) -> RadialResult:
    ...
```

**Grid**: `r_min = 1e-5`, `r_max = max(20.0, 4.0 * n_max**2 / Z)` where
`n_max` is inferred as `l + n_states` (a safe upper bound).
Use `np.linspace(r_min, r_max, n_points)` — uniform is fine.

**Effective potential**:
```python
V_eff = -Z / r  +  0.5 * l * (l + 1) / r**2
```
Pass to the existing `build_hamiltonian` from `solvers.schrodinger_1d.hamiltonian`.

**Eigensolver**: call existing `solve_eigenstates`; take the `n_states` lowest eigenvalues.

**Result dataclass**:
```python
@dataclass
class RadialResult:
    r: np.ndarray              # shape (n_points,)
    u_frames: np.ndarray       # shape (n_states, n_points), u = r·R
    radial_density: np.ndarray # shape (n_states, n_points), r²|R|² = u²
    energies: np.ndarray       # shape (n_states,), in Hartree
```

`radial_density[i] = u_frames[i]**2`  (u is already real and normalised as ∫u² dr = 1,
so ∫r²|R|² dr = ∫u² dr = 1 follows automatically).

### `orbitals.py`

```python
def xz_cross_section(
    r: np.ndarray,
    u: np.ndarray,       # u_nl for the chosen state
    l: int,
    m: int,
    grid_points: int = 120,
) -> OrbitalResult:
    ...
```

Build a square (x, z) grid of size `grid_points × grid_points`.
Extent: `±1.5 * r.max()`.
Avoid r=0 by clamping to `r_min = r[0]`.
Interpolate R_nl via `np.interp(r_vals, r, u / r)` (with `u/r` clipped at boundaries).
Multiply by `|Y_l^m(θ, 0)|²` from `scipy.special.sph_harm(m, l, 0.0, theta)`.

**Result dataclass**:
```python
@dataclass
class OrbitalResult:
    x_axis: np.ndarray       # shape (grid_points,)
    z_axis: np.ndarray       # shape (grid_points,)
    density: np.ndarray      # shape (grid_points, grid_points), |ψ(x,0,z)|²
```

### `router.py`

Single endpoint:

```
POST /hydrogenic/solve
```

**Request**:
```json
{
  "Z": 1,
  "n": 1,
  "l": 0,
  "m": 0,
  "n_points": 600,
  "grid_2d_points": 120
}
```

Validation:
- `1 ≤ Z ≤ 10`
- `1 ≤ n ≤ 5`
- `0 ≤ l ≤ n-1`
- `-l ≤ m ≤ l`

**Response**:
```json
{
  "r":               [float, ...],          // radial grid
  "radial_density":  [float, ...],          // r²|R_nl|² for chosen (n,l) state
  "energy_hartree":  float,                 // E_n numerical
  "energy_exact_hartree": float,            // -Z²/(2n²)
  "energy_ev":       float,                 // energy_hartree * HARTREE_TO_EV
  "x_axis":          [float, ...],          // 2-D grid x-axis
  "z_axis":          [float, ...],          // 2-D grid z-axis
  "orbital_density": [[float, ...], ...],   // shape (grid_2d_points, grid_2d_points)
  "ion_symbol":      "He⁺",
  "ion_name":        "helium",
  "orbital_label":   "2p"
}
```

### Mount in `app.py`

```python
from solvers.hydrogenic.router import router as hydrogenic_router
app.include_router(hydrogenic_router, prefix="/hydrogenic")
```

---

## Frontend

### New mode: `"hydrogenic"`

Add to the mode selector alongside `"stationary"` and `"time-evolution"`.

### URL state parameters

| Key        | Type    | Default | Notes                     |
|------------|---------|---------|---------------------------|
| `mode`     | string  | —       | `"hydrogenic"`            |
| `Z`        | int     | 1       | nuclear charge            |
| `n`        | int     | 1       | principal quantum number  |
| `l`        | int     | 0       | angular quantum number    |
| `m`        | int     | 0       | magnetic quantum number   |

Add these keys to `DEFAULTS` and `urlState` round-trip in `frontend/src/utils/urlState.ts`.

### `ControlPanel` additions (hydrogenic mode)

- **Z slider** — integer 1–10, label shows `Z=2 He⁺ (helium)`
- **n selector** — integer 1–5
- **l selector** — integer 0…n-1; resets to 0 when n decreases
- **m selector** — integer -l…l; resets to 0 when l decreases
- **Solve button** — "Solve orbital"
- **Energy display** — `E = -0.5000 Eh = -13.606 eV` (numerical + exact side by side)
- **Orbital label** — e.g., "3d (m=−1)"

Quantum number constraints are enforced in the UI; the API also validates them (422 on violation).

### Plots

Two panels side by side (or stacked on narrow screens):

**Left — Radial probability density**
- x-axis: r (bohr), range 0 to r_max
- y-axis: r²|R_nl(r)|²
- Vertical dashed line at ⟨r⟩ = (3n²−l(l+1))/(2Z) (exact formula)
- Title: e.g., "Radial density — He⁺ 2p"

**Right — Orbital cross-section (xz plane)**
- Plotly heatmap, square, symmetric axes
- Colour scale: viridis or RdBu_r (density magnitude)
- Dashed circle at r = ⟨r⟩
- Title: e.g., "He⁺ 2p (m=0)  |ψ(x,0,z)|²"

### Help modal (`?` button)

Follow the exact same pattern as `ControlPanel`'s grid `?` and potential `?` buttons:

- A single `?` button (`className="physics-info-btn"`) lives in the `HydrogenicPanel` header,
  next to the panel title or the Z slider legend.
- Clicking it sets local state `showHelp = true`, which renders a
  `physics-modal-backdrop → physics-modal` overlay (same CSS classes as the 1D solver).
- Clicking the backdrop or the `✕` button closes the modal.
- The modal body is a dedicated component `HydrogenicInfoPanel` (analogous to `SolverInfoPanel`)
  rendered using `react-katex` (`BlockMath` / `InlineMath`).

**`HydrogenicInfoPanel` sections** (content for the modal):

1. **Hamiltonian** — the hydrogen-like atom Hamiltonian in atomic units:

   `H = -½∇² - Z/r`

2. **Radial reduction** — substitution `u(r) = r·R(r)` turns the 3D problem into a 1D one:

   `-½ d²u/dr² + [-Z/r + l(l+1)/(2r²)] u = E·u`

   Note the centrifugal barrier term `l(l+1)/(2r²)` that vanishes for s-states (l=0).

3. **Exact energy levels** — with both Hartree and eV forms:

   `E_n = -Z²/(2n²)  Hartree  =  -Z² × 13.606 eV / n²`

   Table of first few levels for Z=1: E₁ = −0.5 Eh, E₂ = −0.125 Eh, E₃ = −0.0556 Eh.

4. **Orbital size** — Bohr radius scales as `a_Z = a₀/Z`:

   `⟨r⟩_nl = (a₀/2Z)(3n² − l(l+1))`

   Consequence: He⁺ orbitals are half the size of H; binding energy is 4× larger.

5. **Quantum numbers** — table:

   | Symbol | Name        | Allowed values | Physical meaning         |
   |--------|-------------|----------------|--------------------------|
   | n      | principal   | 1, 2, 3, …     | energy shell             |
   | l      | angular     | 0 … n−1        | orbital shape (s,p,d,f)  |
   | m      | magnetic    | −l … l         | orientation (xz-plane here) |
   | Z      | nuclear     | 1 … 10         | nuclear charge           |

6. **X-ray scaling** — binding energy scales as Z², so the energy to knock out a K-shell
   electron from carbon (Z=6) is 36× larger than from hydrogen: `E = Z² × 13.6 eV`.

7. **Units** — same as 1D solver: ħ = mₑ = e = 1. Length in Bohr (a₀ ≈ 0.529 Å),
   energy in Hartree (Eₕ ≈ 27.21 eV), time in ħ/Eₕ ≈ 24.2 as.

**New file**: `frontend/src/components/HydrogenicInfoPanel.tsx`
(analogous to `SolverInfoPanel.tsx` — exports a single `HydrogenicInfoPanel` component).

### New API client function

```typescript
// frontend/src/api/client.ts
export async function solveHydrogenic(req: HydrogenicRequest): Promise<HydrogenicResponse>
```

### New TypeScript types

```typescript
// frontend/src/types/api.ts
export interface HydrogenicRequest {
  Z: number; n: number; l: number; m: number;
  n_points?: number; grid_2d_points?: number;
}

export interface HydrogenicResponse {
  r: number[];
  radial_density: number[];
  energy_hartree: number;
  energy_exact_hartree: number;
  energy_ev: number;
  x_axis: number[];
  z_axis: number[];
  orbital_density: number[][];
  ion_symbol: string;
  ion_name: string;
  orbital_label: string;
}
```

---

## Validation requirements

Every backend test must pass before the spec is considered done.

| # | Requirement | Tolerance |
|---|-------------|-----------|
| 1 | `E_n` numerical vs `−Z²/(2n²)` for n=1,2,3 and Z=1,2,3,6 | < 0.1 % |
| 2 | Radial normalisation `∫r²\|R_nl\|² dr = 1` for all (n,l,Z) tested | < 1e-4   |
| 3 | Energy ordering: `E_1 < E_2 < E_3` for each (l,Z) | exact    |
| 4 | l=0 states have no centrifugal barrier (V_eff = −Z/r only) | structural |
| 5 | 2-D density is non-negative everywhere | exact    |
| 6 | API returns 200 for valid (Z,n,l,m); 422 for l≥n, \|m\|>l, Z>10 | exact    |
| 7 | `energy_hartree` in response matches `energy_exact_hartree` within 0.1% | < 0.1 % |
| 8 | `?` button is present in hydrogenic mode; clicking it opens the modal | exact    |
| 9 | Modal contains the text "Radial reduction" and a rendered formula for `E_n` | exact    |
| 10| Clicking the backdrop or `✕` closes the modal | exact    |

---

## File checklist

### Backend (new)
- [ ] `backend/solvers/hydrogenic/__init__.py`
- [ ] `backend/solvers/hydrogenic/radial_solver.py`
- [ ] `backend/solvers/hydrogenic/orbitals.py`
- [ ] `backend/solvers/hydrogenic/router.py`
- [ ] `backend/tests/test_hydrogenic_radial.py`   (covers requirements 1–5)
- [ ] `backend/tests/test_hydrogenic_api.py`      (covers requirement 6–7)

### Backend (modified)
- [ ] `backend/app.py` — add `include_router(hydrogenic_router, prefix="/hydrogenic")`

### Frontend (new)
- [ ] `frontend/src/components/HydrogenicPanel.tsx`
- [ ] `frontend/src/components/HydrogenicInfoPanel.tsx`  ← modal content (KaTeX formulas)
- [ ] `frontend/src/test/spec19-hydrogenic.test.tsx`

### Frontend (modified)
- [ ] `frontend/src/types/api.ts` — add `HydrogenicRequest`, `HydrogenicResponse`
- [ ] `frontend/src/api/client.ts` — add `solveHydrogenic`
- [ ] `frontend/src/utils/urlState.ts` — add Z, n, l, m to DEFAULTS + round-trip
- [ ] `frontend/src/components/ControlPanel.tsx` — hydrogenic mode branch
- [ ] `frontend/src/App.tsx` — handle `"hydrogenic"` mode, route to new panel

---

## Out of scope (this spec)

- Time evolution of hydrogenic states
- Multi-electron atoms (Hartree-Fock)
- Relativistic corrections (spec for the Dirac solver)
- 3-D isosurface rendering
- Superposition of hydrogenic states
