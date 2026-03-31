# Spec 12 — Probability Current: Backend

## Goal

Compute the probability current density J(x,t) at every saved frame of a
time evolution and return it in the API response.  The frontend (spec 13)
will animate J(x,t) alongside |ψ(x,t)|².

## Physics

The probability current in atomic units (ħ = m = 1) is:

    J(x,t) = Im[ ψ*(x,t) · ∂ψ(x,t)/∂x ]

It satisfies the continuity equation:

    ∂|ψ|²/∂t + ∂J/∂x = 0

Key properties used for validation:
- J = 0 everywhere for any real-valued ψ (stationary eigenstates).
- For a Gaussian wave packet with momentum k₀ far from boundaries:
    J(x,t) ≈ k₀ · |ψ(x,t)|²
- Integrating the continuity equation: d/dt ∫|ψ|² dx = −[J]_{boundary} = 0
  (norm is conserved, consistent with Dirichlet BCs where ψ=0 at walls).

The spatial derivative ∂ψ/∂x is computed by central differences via
`numpy.gradient(psi, dx)`, consistent with how ⟨p⟩ is computed in
`expectation_values.py`.

## New module: `backend/probability_current.py`

```python
def compute(psi: np.ndarray, dx: float) -> np.ndarray:
    """Probability current density J(x) = Im[ψ* · ∂ψ/∂x].

    Parameters
    ----------
    psi : complex wavefunction on the position grid, shape (N,)
    dx  : grid spacing (a.u.)

    Returns
    -------
    J : real array of shape (N,), in units of 1/a.u.²
    """
```

## Changes to `crank_nicolson.py`

- Import `probability_current` module.
- `TimeEvolutionResult` gains one new field:
  - `current_frames: np.ndarray` — shape (n_frames, N), J(x,t) at each frame
- In `_save_frame`: compute `probability_current.compute(psi_f, dx)` and store it.

## Changes to `app.py`

- `EvolveResponse` gains one new field:
  - `current_frames: list[list[float]]`
- The evolve endpoint populates it from `result.current_frames`.

## Validation requirements (must be covered by tests)

1. `compute` returns a real array of the same length as ψ.
2. `compute` returns J = 0 for a real-valued ψ (e.g. a stationary eigenstate).
3. `compute` satisfies J ≈ k₀ · |ψ|² for a Gaussian packet with momentum k₀
   (check at the packet center where the approximation is most accurate).
4. `compute` returns J with opposite sign when k₀ is negated (packet moving
   in opposite direction).
5. Continuity equation: ∂ρ/∂t + ∂J/∂x ≈ 0 between two consecutive frames
   (to within numerical tolerance).
6. `TimeEvolutionResult` contains `current_frames` with shape (n_frames, N)
   after `evolve()`.
7. `/solve/evolve` API response includes `current_frames`.
