# Spec 17 — Initial State Selection: Superposition of Eigenstates

## Goal

Add a second initial-state option to time evolution: **Superposition of Eigenstates**.
The user picks real coefficients c₀, c₁, …, cₙ₋₁; the backend computes the corresponding
eigenstates of the chosen potential and builds ψ₀ = Σ cₙ ψₙ (then normalises).

Quick-select buttons let the user instantly load a single eigenstate (cₙ = 1, all others 0).

## Scope

Real coefficients only (no complex phases) for this sprint.
The existing Gaussian remains the default.

---

## Backend — `backend/app.py`

### EvolveRequest new fields

```python
initial_state: Literal["gaussian", "superposition"] = "gaussian"
n_super_states: int = Field(2, ge=1, le=20)   # how many eigenstates
coefficients: list[float] | None = None
```

### Validators

- Existing `check_potential_source` and `check_runaway` unchanged.
- New `check_superposition_args` (mode = "after"):
  - Only fires when `initial_state == "superposition"`.
  - Raises ValueError if `coefficients is None`.
  - Raises ValueError if `len(coefficients) != n_super_states`.
  - Raises ValueError if all coefficients are zero.

### `evolve_endpoint` branching

- The existing `gaussian_x0` domain check runs **only** when `initial_state == "gaussian"`.
- After building `H`:
  - `"gaussian"` → existing `gaussian_packet(...)` call.
  - `"superposition"` → call `solve_eigenstates(H, g.x, g.dx, k=req.n_super_states)`;
    if not converged raise HTTP 500;
    then call `eigenstate_superposition(np.array(eigen.wavefunctions), np.array(req.coefficients), g.dx)`.

### Import

Add `from initial_states import eigenstate_superposition` to backend imports.

---

## Frontend — `frontend/src/types/api.ts`

Extend `EvolveRequest`:

```typescript
initial_state?: 'gaussian' | 'superposition'
n_super_states?: number
coefficients?: number[] | null
```

---

## Frontend — `frontend/src/utils/urlState.ts`

### New fields in `UrlParams`

```typescript
initState: 'gaussian' | 'superposition'
nSuperStates: number
coefficients: number[]   // empty when gaussian
```

### Defaults

```typescript
initState: 'gaussian',
nSuperStates: 2,
coefficients: [],
```

### Serialisation

- `init=gaussian` / `init=superposition`
- `n_super=<n>` (only when superposition)
- `c0=`, `c1=`, … (only when superposition)

### `hasNonDefaultUrl`

Triggers when `initState !== 'gaussian'` or `coefficients.length > 0`.

---

## Frontend — `frontend/src/components/ControlPanel.tsx`

### New state (time-evolution only)

```typescript
const [initState, setInitState] = useState<'gaussian'|'superposition'>(
  initialParams?.initState ?? 'gaussian'
)
const [nSuperStates, setNSuperStates] = useState(initialParams?.nSuperStates ?? 2)
const [coefficients, setCoefficients] = useState<number[]>(
  initialParams?.coefficients?.length
    ? initialParams.coefficients
    : [1, 0]          // default: pure ground state (ψ₀)
)
```

### UI (inside time-evolution fieldset)

1. **Dropdown** labelled "Initial state": options `Gaussian` and `Superposition`.
2. When **Gaussian** selected: existing x₀, σ, k₀ inputs (unchanged).
3. When **Superposition** selected:
   - Slider `n_super_states` (1–20). Changing it resizes `coefficients` (grow: append 0; shrink: truncate).
   - Row of number inputs c₀, c₁, …, c_{n-1}.
   - Row of quick-select buttons **ψ₀**, **ψ₁**, …, **ψ_{n-1}**: clicking ψₙ sets coefficients[n]=1 and all others=0.

### `handleSubmit` extension

When `mode === 'time-evolution'` and `initState === 'superposition'`:

```typescript
onSolve({
  ...base,
  dt, n_steps: nSteps, save_every: saveEvery,
  initial_state: 'superposition',
  n_super_states: nSuperStates,
  coefficients,
})
```

When gaussian, keep existing payload but add `initial_state: 'gaussian'` explicitly.

---

## Acceptance criteria

1. `POST /solve/evolve` with `initial_state: "superposition"`, valid coefficients → 200.
2. Missing coefficients → 422 `check_superposition_args`.
3. All-zero coefficients → 422.
4. len(coefficients) ≠ n_super_states → 422.
5. Norm conservation still holds for superposition initial state.
6. URL round-trips initState and coefficients.
7. Quick-select ψₙ sets coefficients correctly.
