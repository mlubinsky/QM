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

from expectation_values import compute as compute_ev


@dataclass
class TimeEvolutionResult:
    psi_frames: np.ndarray    # shape (n_frames, grid.n), complex128
    times: np.ndarray         # shape (n_frames,)
    norm_history: np.ndarray  # shape (n_frames,) — ||ψ(t)||² at each frame
    grid_x: np.ndarray        # shape (grid.n,)
    dx: float
    expect_x: np.ndarray      # shape (n_frames,) — ⟨x⟩ at each frame
    expect_p: np.ndarray      # shape (n_frames,) — ⟨p⟩ at each frame
    expect_x2: np.ndarray     # shape (n_frames,) — ⟨x²⟩ at each frame
    expect_p2: np.ndarray     # shape (n_frames,) — ⟨p²⟩ at each frame
    expect_H: np.ndarray      # shape (n_frames,) — ⟨H⟩ at each frame


def evolve(
    hamiltonian: spmatrix,
    psi0: np.ndarray,
    grid_x: np.ndarray,
    dx: float,
    dt: float,
    n_steps: int,
    potential: np.ndarray,
    save_every: int = 10,
) -> TimeEvolutionResult:
    """Evolve ψ₀ under H for n_steps time steps of size dt.

    Uses LU-factorized Crank-Nicolson — O(n) per step after factorization.
    Saves one frame every save_every steps; n_frames = n_steps // save_every + 1.
    Expectation values ⟨x⟩, ⟨p⟩, ⟨x²⟩, ⟨p²⟩, ⟨H⟩ are computed at each frame.

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
    expect_x = np.empty(n_frames)
    expect_p = np.empty(n_frames)
    expect_x2 = np.empty(n_frames)
    expect_p2 = np.empty(n_frames)
    expect_H = np.empty(n_frames)

    psi = psi0.astype(complex)
    frame = 0

    def _save_frame(f, psi_f, t):
        psi_frames[f] = psi_f
        times[f] = t
        norm_history[f] = np.sum(np.abs(psi_f) ** 2) * dx
        ev = compute_ev(psi_f, grid_x, dx, hamiltonian, potential)
        expect_x[f] = ev.x
        expect_p[f] = ev.p
        expect_x2[f] = ev.x2
        expect_p2[f] = ev.p2
        expect_H[f] = ev.H

    _save_frame(0, psi, 0.0)

    for step in range(1, n_steps + 1):
        psi = lu.solve(RH @ psi)
        if step % save_every == 0 and frame + 1 < n_frames:
            frame += 1
            _save_frame(frame, psi, step * dt)

    return TimeEvolutionResult(
        psi_frames=psi_frames,
        times=times,
        norm_history=norm_history,
        grid_x=grid_x,
        dx=dx,
        expect_x=expect_x,
        expect_p=expect_p,
        expect_x2=expect_x2,
        expect_p2=expect_p2,
        expect_H=expect_H,
    )
