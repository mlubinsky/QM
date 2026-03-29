"""Tests for Crank-Nicolson stepper and initial_states module.

All quantities in atomic units: ħ = m_e = 1.
"""

import numpy as np
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from grid import Grid
from hamiltonian import build_hamiltonian
from eigenvalue_solver import solve_eigenstates
from crank_nicolson import evolve
from initial_states import gaussian_packet, eigenstate_superposition


# ── shared fixtures ──────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def isw_setup():
    """Infinite square well grid, H, and first 3 eigenstates."""
    g = Grid(200, 0.0, 1.0)
    V = np.zeros(g.n)
    H = build_hamiltonian(g, V)
    result = solve_eigenstates(H, g.x, g.dx, k=3)
    return g, H, result


# ── gaussian_packet normalization ────────────────────────────────────────────

def test_gaussian_normalization():
    g = Grid(500, -10.0, 10.0)
    psi = gaussian_packet(g.x, g.dx, x0=0.0, sigma=1.0, k0=2.0)
    norm = np.sum(np.abs(psi) ** 2) * g.dx
    assert abs(norm - 1.0) < 1e-10


# ── norm conservation ────────────────────────────────────────────────────────

def test_norm_conservation(isw_setup):
    g, H, _ = isw_setup
    psi0 = gaussian_packet(g.x, g.dx, x0=0.5, sigma=0.05, k0=10.0)
    result = evolve(H, psi0, g.x, g.dx, dt=0.001, n_steps=1000, save_every=10)
    assert np.max(np.abs(result.norm_history - 1.0)) < 1e-6


# ── energy conservation ──────────────────────────────────────────────────────

def test_energy_conservation(isw_setup):
    g, H, eig = isw_setup
    psi0 = eig.wavefunctions[0].astype(complex)
    E0 = eig.energies[0]
    result = evolve(H, psi0, g.x, g.dx, dt=0.001, n_steps=1000, save_every=10)
    for psi in result.psi_frames:
        E = np.real(np.conj(psi) @ (H @ psi)) * g.dx
        assert abs(E - E0) / E0 < 0.001


# ── stationary eigenstate — |ψ(t)|² time-independent ────────────────────────

def test_stationary_eigenstate(isw_setup):
    g, H, eig = isw_setup
    psi0 = eig.wavefunctions[0].astype(complex)
    result = evolve(H, psi0, g.x, g.dx, dt=0.001, n_steps=500, save_every=5)
    prob_frames = np.abs(result.psi_frames) ** 2
    # max variation across frames at any spatial point
    variation = np.max(prob_frames.max(axis=0) - prob_frames.min(axis=0))
    assert variation < 1e-4


# ── wavepacket tunneling (qualitative) ───────────────────────────────────────

def test_tunneling():
    g = Grid(400, -10.0, 10.0)
    # Rectangular barrier at x in [0, 1], height V0=5
    V = np.where((g.x >= 0) & (g.x <= 1), 5.0, 0.0)
    H = build_hamiltonian(g, V)
    # Packet incident from left with enough momentum to partially tunnel
    psi0 = gaussian_packet(g.x, g.dx, x0=-4.0, sigma=0.8, k0=4.0)
    result = evolve(H, psi0, g.x, g.dx, dt=0.005, n_steps=600, save_every=20)
    # Check final frame has norm on transmitted side (x > 1)
    psi_final = result.psi_frames[-1]
    transmitted = np.sum(np.abs(psi_final[g.x > 1.0]) ** 2) * g.dx
    assert transmitted > 0.0


# ── invalid psi0 raises ValueError ──────────────────────────────────────────

def test_unnormalized_psi0_raises(isw_setup):
    g, H, _ = isw_setup
    psi_bad = np.ones(g.n, dtype=complex)  # definitely not normalized
    with pytest.raises(ValueError):
        evolve(H, psi_bad, g.x, g.dx, dt=0.001, n_steps=10)
