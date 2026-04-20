"""Crank-Nicolson time stepper for the time-dependent Schrödinger equation.

Solves iħ ∂ψ/∂t = H ψ using the implicit Crank-Nicolson (CN) scheme.

Derivation
----------
Discretising in time with step dt and evaluating H at the midpoint
(average of t and t+dt) gives the CN update rule:

    (I + i·dt/2·H) ψ(t+dt) = (I − i·dt/2·H) ψ(t)

Writing L = I + i·dt/2·H and R = I − i·dt/2·H:

    ψ(t+dt) = L⁻¹ R ψ(t)

The propagator L⁻¹ R is unitary (L† = R), so norm is conserved to
machine precision.  The scheme is unconditionally stable for any dt.

Implementation
--------------
L is LU-factorised once using ``scipy.sparse.linalg.splu``.  Each
time step then costs one sparse matrix-vector product (R @ ψ) and one
triangular solve (lu.solve), both O(N) for a tridiagonal system.

All quantities in atomic units: ħ = m_e = 1.
The unit of time is ≈ 24.19 attoseconds.
"""

from dataclasses import dataclass

import numpy as np
import scipy.sparse as sp
from scipy.sparse import spmatrix
from scipy.sparse.linalg import splu

from expectation_values import compute as compute_ev
import momentum as _momentum
import probability_current as _current


@dataclass
class TimeEvolutionResult:
    """Output of a Crank-Nicolson time evolution run.

    Attributes
    ----------
    psi_frames : np.ndarray
        Shape ``(n_frames, N)``, complex128.  Wavefunction ψ(x, t) at
        each saved frame.
    times : np.ndarray
        Shape ``(n_frames,)``.  Time coordinate of each frame in a.u.
    norm_history : np.ndarray
        Shape ``(n_frames,)``.  ‖ψ(t)‖² = sum(|ψ|²)·dx at each frame.
        Should stay within ≈ 1e-10 of 1.0 (CN unitarity).
    grid_x : np.ndarray
        Shape ``(N,)``.  Grid x-coordinates in atomic units.
    dx : float
        Grid spacing in atomic units.
    expect_x : np.ndarray
        Shape ``(n_frames,)``.  ⟨x(t)⟩ in atomic units.
    expect_p : np.ndarray
        Shape ``(n_frames,)``.  ⟨p(t)⟩ in atomic units.
    expect_x2 : np.ndarray
        Shape ``(n_frames,)``.  ⟨x²(t)⟩ in atomic units.
    expect_p2 : np.ndarray
        Shape ``(n_frames,)``.  ⟨p²(t)⟩ in atomic units.
    expect_H : np.ndarray
        Shape ``(n_frames,)``.  ⟨H(t)⟩ in Hartree.  Constant for a
        time-independent Hamiltonian (energy conservation diagnostic).
    momentum_frames : np.ndarray
        Shape ``(n_frames, N)``.  Momentum-space probability density
        |φ(k, t)|², ordered from −k_max to +k_max.
    momentum_k : np.ndarray
        Shape ``(N,)``.  Wavenumber axis in rad/a.u.
    current_frames : np.ndarray
        Shape ``(n_frames, N)``.  Probability current J(x, t) in 1/a.u.²
    delta_x : np.ndarray
        Shape ``(n_frames,)``.  Position uncertainty Δx(t) = √(⟨x²⟩−⟨x⟩²).
    delta_p : np.ndarray
        Shape ``(n_frames,)``.  Momentum uncertainty Δp(t).
    delta_x_delta_p : np.ndarray
        Shape ``(n_frames,)``.  Uncertainty product Δx·Δp ≥ 1/2
        (Heisenberg bound in atomic units).
    """

    psi_frames: np.ndarray
    times: np.ndarray
    norm_history: np.ndarray
    grid_x: np.ndarray
    dx: float
    expect_x: np.ndarray
    expect_p: np.ndarray
    expect_x2: np.ndarray
    expect_p2: np.ndarray
    expect_H: np.ndarray
    momentum_frames: np.ndarray
    momentum_k: np.ndarray
    current_frames: np.ndarray
    delta_x: np.ndarray
    delta_p: np.ndarray
    delta_x_delta_p: np.ndarray


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

    Parameters
    ----------
    hamiltonian : scipy.sparse.spmatrix
        Sparse Hamiltonian H of shape ``(N, N)``.
    psi0 : np.ndarray
        Initial wavefunction, complex, shape ``(N,)``.  Must satisfy
        ``sum(|ψ₀|²) * dx ≈ 1.0`` (checked to within 1e-6).
    grid_x : np.ndarray
        Grid coordinates, shape ``(N,)``, in atomic units.
    dx : float
        Grid spacing in atomic units.
    dt : float
        Time step in atomic units (1 a.u. ≈ 24.19 as).  CN is
        unconditionally stable for any dt; accuracy degrades for large dt.
    n_steps : int
        Total number of time steps to perform.
    potential : np.ndarray
        V(x) on the grid, shape ``(N,)``, in Hartree.  Used only for
        computing ⟨V⟩ and hence ⟨p²⟩ = 2(⟨H⟩ − ⟨V⟩).
    save_every : int, optional
        Save one frame every this many steps.  Default 10.
        Total frames stored: ``n_frames = n_steps // save_every + 1``
        (frame 0 is the initial state).

    Returns
    -------
    TimeEvolutionResult
        Dataclass with wavefunction frames, times, norm history,
        expectation values, momentum density frames, probability current
        frames, and uncertainty products at each saved frame.

    Raises
    ------
    ValueError
        If ``sum(|ψ₀|²) * dx`` deviates from 1.0 by more than 1e-6.

    Notes
    -----
    The CN update per step is:

        ψ(t+dt) = L⁻¹ · R · ψ(t)

    where L = I + i·dt/2·H and R = I − i·dt/2·H.  L is LU-factorised
    once (``splu``); each step costs one matrix-vector product and one
    triangular solve, both O(N).

    Momentum density uses an FFT-based approximation:

        |φ(kⱼ)|² ≈ (dx² / 2π) · |FFT(ψ)[j]|²

    normalised so that ``sum(|φ|²) * dk == 1`` (Parseval).
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
    momentum_frames = np.empty((n_frames, n))
    momentum_k = _momentum.k_axis(n, dx)
    current_frames = np.empty((n_frames, n))
    delta_x = np.empty(n_frames)
    delta_p = np.empty(n_frames)
    delta_x_delta_p = np.empty(n_frames)

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
        delta_x[f] = ev.delta_x
        delta_p[f] = ev.delta_p
        delta_x_delta_p[f] = ev.delta_x_delta_p
        momentum_frames[f] = _momentum.density(psi_f, dx)
        current_frames[f] = _current.compute(psi_f, dx)

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
        momentum_frames=momentum_frames,
        momentum_k=momentum_k,
        current_frames=current_frames,
        delta_x=delta_x,
        delta_p=delta_p,
        delta_x_delta_p=delta_x_delta_p,
    )
