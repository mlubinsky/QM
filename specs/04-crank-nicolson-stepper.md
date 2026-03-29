# Crank-Nicolson Time Stepper

## Goal
Solve iħ ∂ψ/∂t = H ψ using the Crank-Nicolson method.
Must be unconditionally stable and norm-conserving.

## Method
Crank-Nicolson discretization:
(I + i*dt/2 * H) ψ(t+dt) = (I - i*dt/2 * H) ψ(t)

This is an implicit scheme. At each step, solve a sparse linear system.
Use scipy.sparse.linalg.spsolve or factorize once and reuse (LU factorization).

## Units
Atomic units: ħ = 1.

## Interface
```python
from dataclasses import dataclass
import numpy as np
from scipy.sparse import spmatrix

@dataclass  
class TimeEvolutionResult:
    psi_frames: np.ndarray      # shape (n_frames, grid.n), complex128
    times: np.ndarray           # shape (n_frames,)
    norm_history: np.ndarray    # shape (n_frames,) — ||ψ(t)||² at each frame
    grid_x: np.ndarray          # shape (grid.n,)
    dx: float

def evolve(
    hamiltonian: spmatrix,
    psi0: np.ndarray,           # complex128, shape (grid.n,)
    grid_x: np.ndarray,
    dx: float,
    dt: float,
    n_steps: int,
    save_every: int = 10,       # save one frame every N steps
) -> TimeEvolutionResult:
```

## Implementation details
- psi0 must be normalized on entry — raise ValueError if ||ψ₀||²*dx deviates
  from 1.0 by more than 1e-6
- Build LH = (I + i*dt/2 * H) and RH = (I - i*dt/2 * H) once before the loop
- Factorize LH once using scipy.sparse.linalg.splu — reuse across all steps
- At each step: psi = LH_factored.solve(RH @ psi)
- Record norm at every saved frame
- n_frames = n_steps // save_every + 1

## Initial states (separate module: initial_states.py)
Provide these factory functions for ψ₀:
```python
def gaussian_packet(
    grid_x: np.ndarray,
    dx: float,
    x0: float,          # center position
    sigma: float,       # width
    k0: float = 0.0,    # initial momentum (wavenumber)
) -> np.ndarray:        # normalized complex128 array
    # ψ(x) = A * exp(-(x-x0)²/4σ²) * exp(i*k0*x)
    # A chosen so ||ψ||²*dx = 1

def eigenstate_superposition(
    wavefunctions: np.ndarray,  # from EigenstateResult
    coefficients: np.ndarray,   # complex, will be normalized
    dx: float,
) -> np.ndarray:
```

## Tests required

### Norm conservation
- Gaussian packet in infinite square well, 1000 steps, dt=0.001
- max(|norm_history - 1.0|) < 1e-6 across all frames

### Energy conservation
- Eigenstate initial condition (exact eigenstate of H)
- <E>(t) = <ψ(t)|H|ψ(t)> stays within 0.1% of E_0 across all steps

### Stationary eigenstate
- If ψ₀ = ψ_n (exact eigenstate), then |ψ(t)|² must be time-independent
- max variation in |ψ(t)|² < 1e-4 across all frames

### Wavepacket tunneling (qualitative)
- Gaussian packet incident on a rectangular barrier
- After sufficient time, norm on transmitted side > 0
- (Just checks that tunneling occurs, not the exact coefficient)

### Gaussian normalization
- gaussian_packet output satisfies ||ψ||²*dx = 1.0 within 1e-10

## Do not implement
- Absorbing boundary conditions
- Split-operator method (future milestone)
- Adaptive time-stepping
- Any visualization

