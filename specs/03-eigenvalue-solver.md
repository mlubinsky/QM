# Eigenvalue Solver (Stationary Mode)

## Goal
Solve H ψ = E ψ and return the lowest k eigenstates and energies.
This is the stationary mode core — all outputs must be physically correct
and validated against analytic solutions.

## Units
Atomic units throughout: ħ = m_e = 1.
Document this in every docstring.

## Interface
```python
from dataclasses import dataclass
import numpy as np
from scipy.sparse import spmatrix@dataclass
class EigenstateResult:
energies: np.ndarray        # shape (k,), ascending order
wavefunctions: np.ndarray   # shape (k, grid.n), each row is one ψ
grid_x: np.ndarray          # shape (grid.n,) — x coordinates
dx: float                   # grid spacing
converged: bool             # did eigensolver converge?
norm_errors: np.ndarray     # |1 - ||ψ_i||²| for each eigenstatedef solve_eigenstates(
hamiltonian: spmatrix,
grid_x: np.ndarray,
dx: float,
k: int = 5,
) -> EigenstateResult:

## Implementation details
- Use scipy.sparse.linalg.eigsh with which='SM' (smallest magnitude)
- Normalize each wavefunction: ψ_i /= sqrt(sum(|ψ_i|²) * dx)
- Sort by energy ascending
- Sign convention: make the first non-negligible element of each ψ positive
- Return converged=False and log a warning if eigsh raises ArpackNoConvergence

## Tests required

### Infinite square well
- Domain: x ∈ [0, L], L = 1.0, n = 500 points
- Analytic: E_n = n²π²/2L² in atomic units (n = 1, 2, 3, ...)
- Assert first 5 energies within 0.5% of analytic values

### Harmonic oscillator
- Domain: x ∈ [-8, 8], V(x) = x²/2, n = 500 points
- Analytic: E_n = n + 1/2 (n = 0, 1, 2, ...)
- Assert first 5 energies within 0.5% of analytic values

### Normalization
- ||ψ_i||² * dx == 1.0 within 1e-6 for all returned eigenstates

### Orthogonality
- |<ψ_i|ψ_j>| * dx < 1e-6 for all i ≠ j

### Ordering
- energies array is strictly ascending

## Do not implement
- 2D eigensolvers
- Degenerate subspace handling
- Any plotting or visualization

