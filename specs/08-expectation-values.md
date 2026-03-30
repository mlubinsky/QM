# Spec 08 — Expectation Values

## Goal

Compute quantum mechanical expectation values for every saved frame of a
time evolution, and return them in the API response.  The UI will use these
for the Ehrenfest trajectory overlay and the uncertainty-principle display
(future specs).

## Observables

All quantities in atomic units (ħ = mₑ = 1).

| Symbol | Definition |
|---|---|
| ⟨x⟩ | ∫ x \|ψ\|² dx |
| ⟨x²⟩ | ∫ x² \|ψ\|² dx |
| ⟨p⟩ | −i ∫ ψ\* ∂ψ/∂x dx   (central differences) |
| ⟨H⟩ | ⟨ψ\|H\|ψ⟩ dx   (matrix–vector product) |
| ⟨p²⟩ | 2(⟨H⟩ − ⟨V⟩)   (from ⟨T⟩ = ⟨H⟩ − ⟨V⟩) |
| Δx | √(⟨x²⟩ − ⟨x⟩²) |
| Δp | √(⟨p²⟩ − ⟨p⟩²) |
| Δx·Δp | uncertainty product (≥ ½ by Heisenberg) |

## New module: `backend/expectation_values.py`

```python
@dataclass
class ExpectationValues:
    x: float
    x2: float
    p: float
    p2: float
    H: float
    delta_x: float
    delta_p: float
    delta_x_delta_p: float

def compute(
    psi: np.ndarray,          # complex, shape (n,), assumed normalized
    grid_x: np.ndarray,       # shape (n,)
    dx: float,
    hamiltonian: spmatrix,
    potential: np.ndarray,    # shape (n,)
) -> ExpectationValues:
    ...
```

## Changes to `crank_nicolson.py`

- `evolve()` gains a required `potential: np.ndarray` parameter.
- `TimeEvolutionResult` gains five new array fields, one value per saved frame:
  `expect_x`, `expect_p`, `expect_x2`, `expect_p2`, `expect_H`
- `compute()` is called once per saved frame inside the evolution loop.

## Changes to `app.py`

- `EvolveResponse` gains five new list fields:
  `expect_x`, `expect_p`, `expect_x2`, `expect_p2`, `expect_H`
- The evolve endpoint passes `V` to `evolve()`.

## Validation requirements

All of these must be verified by the test suite:

1. HO ground state: ⟨x⟩ = 0, ⟨p⟩ = 0, ⟨H⟩ = 0.5
2. HO ground state is minimum-uncertainty: Δx·Δp = ½
3. ISW ground state: ⟨x⟩ = (x_min + x_max) / 2  (symmetry)
4. Ehrenfest theorem: for HO coherent state, ⟨x(t)⟩ = x₀ cos(t)
5. Energy eigenstate: ⟨H(t)⟩ constant during time evolution
6. Heisenberg bound: Δx·Δp ≥ ½ for all tested states
