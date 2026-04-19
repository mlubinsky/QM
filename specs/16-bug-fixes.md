# Spec 16 — Bug fixes from code review

Source: code review session, 2026-04-19.

## Items

### 1. `saveEvery` unclamped on URL parse (frontend)

**File:** `frontend/src/utils/urlState.ts`

`parseUrlParams` clamps `n`, `nStates`, `dt`, `nSteps`, and `sigma` but reads
`save_every` raw.  The backend requires `1 ≤ save_every ≤ 100` (Pydantic Field
constraint).  A malformed URL like `?save_every=999` bypasses frontend
validation and the backend returns a 422.

**Fix:** wrap the `save_every` parse in `clamp(..., 1, 100)`.

---

### 2. `hasNonDefaultUrl` ignores `saveEvery` (frontend)

**File:** `frontend/src/utils/urlState.ts`

`hasNonDefaultUrl` checks every `UrlParams` field except `saveEvery`, so a URL
with only `?save_every=5` returns `false` and auto-solve does not fire on mount.

**Fix:** add `params.saveEvery !== DEFAULTS.saveEvery` to the disjunction.

---

### 3. `save_every` never sent from ControlPanel (frontend)

**File:** `frontend/src/components/ControlPanel.tsx`

`handleSubmit` builds the evolve request without `save_every`, so the backend
always uses its default (10) regardless of the URL-provided value.

**Fix:** add `save_every: saveEvery` to the evolve request object, where
`saveEvery` is read from `initialParams?.saveEvery ?? DEFAULTS.saveEvery`.
No UI control is needed (keep it URL-only for now).

---

### 4. Custom expression lost from URL after solve (frontend)

**File:** `frontend/src/App.tsx`

After a successful solve with a custom expression,
`handleSolve` calls `pushUrlParams` with:
```
potential: req.potential_preset ?? ''
```
When `potential_preset` is `null` (custom expr path), `potential` becomes `''`
and `expr` is never set in the serialized URL.  Opening the shared link
sends `potential=''` to the backend, which returns a 422.

**Fix:** in both the stationary and evolve branches, derive `expr` from
`req.potential_expr` and `potential` from `req.potential_preset ?? DEFAULTS.potential`.

---

### 5. `finite_square_well` / `step_potential` have wrong `expr` in `potentials.ts` (frontend)

**File:** `frontend/src/data/potentials.ts`

```typescript
// current — Python ternary, not valid in asteval
expr: '-10 if abs(x) < 3 else 0',
expr: '5 if x > 0 else 0',
```

These two potentials have no `parameters` array, so `ControlPanel` correctly
sends them as `potential_preset` (not `potential_expr`); the wrong `expr` field
is never evaluated.  However if the `expr` field is ever used (e.g. future
copy-to-custom-expression feature), it will fail silently.

asteval-compatible equivalents:
```typescript
expr: '(abs(x) < 3) * -10',
expr: '(x > 0) * 5',
```

---

### 6. Backend: `save_every > n_steps` produces silent single-frame output

**File:** `backend/app.py` / `backend/crank_nicolson.py`

When `save_every > n_steps`, `n_frames = n_steps // save_every + 1 = 1`, so
only the initial frame is returned and no time evolution is visible.  Neither
the backend nor frontend prevents this.

**Fix:** add a `@model_validator` to `EvolveRequest` that raises `ValueError`
when `save_every > n_steps`.

---

### 7. Backend: `x0` outside `[x_min, x_max]` is silently accepted

**File:** `backend/app.py`

When the Gaussian packet centre `x0` lies outside the simulation domain, the
packet is essentially zero on the grid after normalization and the result is
unphysical noise.  No error or warning is produced.

**Fix:** add a check in `evolve_endpoint` (or a `@model_validator` on
`EvolveRequest` — but it doesn't have grid access there, so do it in the
endpoint after constructing `Grid`) that raises HTTP 422 when
`x0 < x_min` or `x0 > x_max`.

---

### 8. `onSpeedChange` prop is wired to a no-op (frontend)

**Files:** `AnimationControls.tsx`, `PlotArea.tsx`, `App.tsx`

`AnimationControls` renders a Speed select and calls `onSpeedChange`, but the
handler in `App.tsx` is `_speed => {}`.  The animation interval is hardcoded
at 100 ms.  The UI implies speed control works when it does not.

**Fix:** implement variable playback speed.  Store `speed` state in `App`,
pass it to `AnimationControls`, use it to compute the `setInterval` delay
(`100 / speed` ms).

---

### 9. No tests for `potential_parser` (backend)

**New file:** `backend/tests/test_potential_parser.py`

Required cases:
- valid numpy expressions evaluate correctly
- scalar result is broadcast to full grid
- Python ternary (`if/else`) is rejected
- `import` statement is rejected
- attribute access (e.g. `os.system`) is rejected
- expression returning wrong shape raises ValueError
- empty expression raises ValueError

---

### 10. No tests for `initial_states` (backend)

**New file:** `backend/tests/test_initial_states.py`

Required cases:
- `gaussian_packet` is normalized: `||ψ||² * dx ≈ 1`
- `gaussian_packet` centre: `⟨x⟩ ≈ x0`
- `gaussian_packet` is complex (non-zero `k0`)
- `eigenstate_superposition` is normalized

---

## Validation requirements

All ten fixes must be covered by failing tests before implementation begins.

After implementation every existing test must still pass.
