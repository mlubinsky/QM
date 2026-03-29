"""Crank-Nicolson time stepper for the time-dependent Schrödinger equation.

Solves iħ ∂ψ/∂t = H ψ using the implicit Crank-Nicolson scheme:
  (I + i·dt/2·H) ψ(t+dt) = (I - i·dt/2·H) ψ(t)

All quantities in atomic units: ħ = m_e = 1.
"""

from dataclasses import dataclass

import numpy as np
import scipy.sparse as sp
from scipy.sparse import spmatrix
from scipy.sparse.linalg import splu


@dataclass
class TimeEvolutionResult:
    psi_frames: np.ndarray   # shape (n_frames, grid.n), complex128
    times: np.ndarray        # shape (n_frames,)
    norm_history: np.ndarray # shape (n_frames,) — ||ψ(t)||² at each frame
    grid_x: np.ndarray       # shape (grid.n,)
    dx: float


def evolve(
    hamiltonian: spmatrix,
    psi0: np.ndarray,
    grid_x: np.ndarray,
    dx: float,
    dt: float,
    n_steps: int,
    save_every: int = 10,
) -> TimeEvolutionResult:
    """Evolve ψ₀ under H for n_steps time steps of size dt.

    Uses LU-factorized Crank-Nicolson — O(n) per step after factorization.
    Saves one frame every save_every steps; n_frames = n_steps // save_every + 1.

    All quantities in atomic units: ħ = m_e = 1.

    Raises
    ------
    ValueError
        If ||ψ₀||²·dx deviates from 1.0 by more than 1e-6.
    """
    norm0 = np.sum(np.abs(psi0) ** 2) * dx
    if abs(norm0 - 1.0) > 1e-6:
        raise ValueError(
            f"psi0 is not normalized: ||ψ₀||²·dx = {norm0:.10f}, expected 1.0"
        )

    n = len(psi0)
    I = sp.eye(n, format="csc")
    H = hamiltonian.tocsc()

    LH = (I + 0.5j * dt * H).tocsc()   # left-hand side  (I + i·dt/2·H)
    RH = (I - 0.5j * dt * H).tocsc()   # right-hand side (I - i·dt/2·H)

    lu = splu(LH)

    n_frames = n_steps // save_every + 1
    psi_frames = np.empty((n_frames, n), dtype=complex)
    times = np.empty(n_frames)
    norm_history = np.empty(n_frames)

    psi = psi0.astype(complex)
    frame = 0

    # Save initial frame
    psi_frames[0] = psi
    times[0] = 0.0
    norm_history[0] = np.sum(np.abs(psi) ** 2) * dx

    for step in range(1, n_steps + 1):
        psi = lu.solve(RH @ psi)
        if step % save_every == 0 and frame + 1 < n_frames:
            frame += 1
            psi_frames[frame] = psi
            times[frame] = step * dt
            norm_history[frame] = np.sum(np.abs(psi) ** 2) * dx

    return TimeEvolutionResult(
        psi_frames=psi_frames,
        times=times,
        norm_history=norm_history,
        grid_x=grid_x,
        dx=dx,
    )
