"""Tests for expectation_values.compute() and Ehrenfest theorem.

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
from initial_states import gaussian_packet
from potential_parser import parse_potential
from expectation_values import compute, ExpectationValues


# ── fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def harmonic_oscillator_setup():
    """Harmonic Oscillator grid, H, V, and first 3 eigenstates on [-8, 8]."""
    g = Grid(500, -8.0, 8.0)
    V = parse_potential("0.5 * x**2", g.x)
    H = build_hamiltonian(g, V)
    result = solve_eigenstates(H, g.x, g.dx, k=3)
    return g, H, V, result


@pytest.fixture(scope="module")
def infinite_square_well_setup():
    """Infinite Square Well grid, H, V on [0, 1]."""
    g = Grid(300, 0.0, 1.0)
    V = np.zeros(g.n)
    H = build_hamiltonian(g, V)
    result = solve_eigenstates(H, g.x, g.dx, k=1)
    return g, H, V, result


# ── Harmonic Oscillator ground state: position and momentum ──────────────────

def test_ho_ground_state_x_mean(harmonic_oscillator_setup):
    """⟨x⟩ = 0 for Harmonic Oscillator ground state (symmetric state, symmetric potential)."""
    g, H, V, eig = harmonic_oscillator_setup
    psi = eig.wavefunctions[0].astype(complex)
    ev = compute(psi, g.x, g.dx, H, V)
    assert abs(ev.x) < 1e-10, f"⟨x⟩ = {ev.x:.2e}, expected 0"


def test_ho_ground_state_p_mean(harmonic_oscillator_setup):
    """⟨p⟩ = 0 for Harmonic Oscillator ground state (real wavefunction)."""
    g, H, V, eig = harmonic_oscillator_setup
    psi = eig.wavefunctions[0].astype(complex)
    ev = compute(psi, g.x, g.dx, H, V)
    assert abs(ev.p) < 1e-6, f"⟨p⟩ = {ev.p:.2e}, expected 0"


def test_ho_ground_state_energy(harmonic_oscillator_setup):
    """⟨H⟩ = E₀ = 0.5 a.u. for Harmonic Oscillator ground state."""
    g, H, V, eig = harmonic_oscillator_setup
    psi = eig.wavefunctions[0].astype(complex)
    ev = compute(psi, g.x, g.dx, H, V)
    assert abs(ev.H - 0.5) < 1e-3, f"⟨H⟩ = {ev.H:.6f}, expected 0.5"


# ── Harmonic Oscillator ground state: minimum uncertainty ────────────────────

def test_ho_ground_state_minimum_uncertainty(harmonic_oscillator_setup):
    """Harmonic Oscillator ground state saturates Heisenberg bound: Δx·Δp = ½."""
    g, H, V, eig = harmonic_oscillator_setup
    psi = eig.wavefunctions[0].astype(complex)
    ev = compute(psi, g.x, g.dx, H, V)
    assert abs(ev.delta_x_delta_p - 0.5) < 0.01, (
        f"Δx·Δp = {ev.delta_x_delta_p:.4f}, expected 0.5"
    )


# ── Infinite Square Well ground state: center of mass ────────────────────────

def test_isw_ground_state_center(infinite_square_well_setup):
    """⟨x⟩ = (x_min + x_max)/2 = 0.5 for Infinite Square Well ground state by symmetry."""
    g, H, V, eig = infinite_square_well_setup
    psi = eig.wavefunctions[0].astype(complex)
    ev = compute(psi, g.x, g.dx, H, V)
    center = (g.x[0] + g.x[-1]) / 2.0
    assert abs(ev.x - center) < 1e-10, f"⟨x⟩ = {ev.x:.6f}, expected {center}"


# ── Heisenberg uncertainty principle ─────────────────────────────────────────

def test_uncertainty_principle_ho_excited(harmonic_oscillator_setup):
    """Δx·Δp ≥ ½ for Harmonic Oscillator excited states.

    Tolerance 1e-3 accounts for finite-difference discretization error:
    the exact Harmonic Oscillator ground state gives Δx·Δp = 0.5 analytically,
    but the numerical ground state on a finite grid undershoots by ~3e-5.
    """
    g, H, V, eig = harmonic_oscillator_setup
    for i, psi_real in enumerate(eig.wavefunctions):
        psi = psi_real.astype(complex)
        ev = compute(psi, g.x, g.dx, H, V)
        assert ev.delta_x_delta_p >= 0.5 - 1e-3, (
            f"State {i}: Δx·Δp = {ev.delta_x_delta_p:.6f} < 0.5"
        )


def test_uncertainty_principle_gaussian(harmonic_oscillator_setup):
    """Δx·Δp ≥ ½ for a displaced Gaussian in Harmonic Oscillator potential."""
    g, H, V, _ = harmonic_oscillator_setup
    psi = gaussian_packet(g.x, g.dx, x0=2.0, sigma=1.0, k0=1.0)
    ev = compute(psi, g.x, g.dx, H, V)
    assert ev.delta_x_delta_p >= 0.5 - 1e-6, (
        f"Δx·Δp = {ev.delta_x_delta_p:.6f} < 0.5"
    )


# ── Ehrenfest theorem ─────────────────────────────────────────────────────────

def test_ehrenfest_x_mean_ho_coherent_state():
    """⟨x(t)⟩ = x₀·cos(t) for a Harmonic Oscillator coherent state (Ehrenfest theorem).

    Checked at t ≈ π/2 (center should reach 0) and t ≈ π (should reach −x₀).
    """
    x0 = 2.0
    sigma = 1.0 / np.sqrt(2)   # coherent-state width for ω = 1

    g = Grid(500, -8.0, 8.0)
    V = parse_potential("0.5 * x**2", g.x)
    H = build_hamiltonian(g, V)
    psi0 = gaussian_packet(g.x, g.dx, x0=x0, sigma=sigma, k0=0.0)

    # save_every=785 gives frames at t=0, t≈π/2, t≈π
    result = evolve(H, psi0, g.x, g.dx, dt=0.002, n_steps=1571,
                    potential=V, save_every=785)

    tol = 0.1
    for frame_idx, t in enumerate(result.times):
        x_exact = x0 * np.cos(t)
        assert abs(result.expect_x[frame_idx] - x_exact) < tol, (
            f"t={t:.3f}: ⟨x⟩={result.expect_x[frame_idx]:.3f}, "
            f"exact={x_exact:.3f}"
        )


# ── energy eigenstate: ⟨H⟩ constant during evolution ────────────────────────

def test_energy_constant_for_eigenstate(harmonic_oscillator_setup):
    """⟨H(t)⟩ = E₀ for all frames when evolving an energy eigenstate."""
    g, H, V, eig = harmonic_oscillator_setup
    psi0 = eig.wavefunctions[0].astype(complex)
    E0 = eig.energies[0]

    result = evolve(H, psi0, g.x, g.dx, dt=0.005, n_steps=500,
                    potential=V, save_every=25)

    for i, H_t in enumerate(result.expect_H):
        assert abs(H_t - E0) < 1e-4, (
            f"Frame {i}: ⟨H⟩={H_t:.6f}, expected {E0:.6f}"
        )


# ── return type ──────────────────────────────────────────────────────────────

def test_compute_returns_expectation_values_type(harmonic_oscillator_setup):
    """compute() returns an ExpectationValues instance."""
    g, H, V, eig = harmonic_oscillator_setup
    psi = eig.wavefunctions[0].astype(complex)
    ev = compute(psi, g.x, g.dx, H, V)
    assert isinstance(ev, ExpectationValues)
