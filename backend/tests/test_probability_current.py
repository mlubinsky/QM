"""Tests for backend/probability_current.py — probability current density.

Covers all 7 validation requirements from specs/12-probability-current-backend.md.
"""

import numpy as np
import pytest

import probability_current
from grid import Grid
from hamiltonian import build_hamiltonian
from initial_states import gaussian_packet
from crank_nicolson import evolve


# ── fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def grid():
    return Grid(256, -10.0, 10.0)


# ── 1. compute returns a real array of the same length as ψ ──────────────────

def test_compute_returns_real_array(grid):
    psi = gaussian_packet(grid.x, grid.dx, x0=0.0, sigma=1.0, k0=2.0)
    J = probability_current.compute(psi, grid.dx)
    assert J.shape == (grid.n,)
    assert np.isrealobj(J)


# ── 2. J = 0 for a real-valued ψ ─────────────────────────────────────────────

def test_zero_current_for_real_psi(grid):
    # A real Gaussian (k0=0) has zero imaginary part → J = Im[ψ* dψ/dx] = 0
    psi = gaussian_packet(grid.x, grid.dx, x0=0.0, sigma=1.0, k0=0.0)
    # psi is complex but with zero imaginary part when k0=0
    J = probability_current.compute(psi, grid.dx)
    np.testing.assert_allclose(J, 0.0, atol=1e-10)


def test_zero_current_for_explicitly_real_psi(grid):
    # Purely real array: sin-like bump
    psi_real = np.sin(np.pi * (grid.x + 10) / 20)
    psi_real /= np.sqrt(np.sum(psi_real**2) * grid.dx)
    J = probability_current.compute(psi_real.astype(complex), grid.dx)
    np.testing.assert_allclose(J, 0.0, atol=1e-10)


# ── 3. J ≈ k₀ · |ψ|² at the packet center for a Gaussian with momentum k₀ ───

def test_current_proportional_to_density_at_center(grid):
    k0 = 3.0
    psi = gaussian_packet(grid.x, grid.dx, x0=0.0, sigma=1.0, k0=k0)
    J = probability_current.compute(psi, grid.dx)
    density = np.abs(psi)**2

    # At the packet center (x≈0) the local-momentum approximation J ≈ k₀·|ψ|²
    # holds well; compare the ratio J/|ψ|² in the central region
    center = grid.n // 2
    half_width = grid.n // 8
    sl = slice(center - half_width, center + half_width)

    ratio = J[sl] / density[sl]
    np.testing.assert_allclose(ratio, k0, rtol=0.05)


# ── 4. Sign of J reverses when k₀ is negated ─────────────────────────────────

def test_current_sign_reverses_with_k0(grid):
    psi_pos = gaussian_packet(grid.x, grid.dx, x0=0.0, sigma=1.0, k0=2.0)
    psi_neg = gaussian_packet(grid.x, grid.dx, x0=0.0, sigma=1.0, k0=-2.0)
    J_pos = probability_current.compute(psi_pos, grid.dx)
    J_neg = probability_current.compute(psi_neg, grid.dx)
    np.testing.assert_allclose(J_pos, -J_neg, rtol=1e-10)


# ── 5. Continuity equation between consecutive frames ────────────────────────

def test_continuity_equation(grid):
    V = 0.5 * grid.x**2   # harmonic oscillator
    H = build_hamiltonian(grid, V)
    psi0 = gaussian_packet(grid.x, grid.dx, x0=2.0, sigma=1.0, k0=0.0)
    result = evolve(H, psi0, grid.x, grid.dx, dt=0.005, n_steps=20,
                    potential=V, save_every=10)

    # ∂ρ/∂t + ∂J/∂x ≈ 0  between frames 0 and 1
    dt_frame = result.times[1] - result.times[0]
    rho0 = np.abs(result.psi_frames[0])**2
    rho1 = np.abs(result.psi_frames[1])**2
    drho_dt = (rho1 - rho0) / dt_frame

    J0 = result.current_frames[0]
    J1 = result.current_frames[1]
    J_mid = 0.5 * (J0 + J1)
    dJ_dx = np.gradient(J_mid, grid.dx)

    residual = drho_dt + dJ_dx
    # Interior points only (boundary has Dirichlet artefacts)
    np.testing.assert_allclose(residual[10:-10], 0.0, atol=1e-3)


# ── 6. TimeEvolutionResult has correct shape for current_frames ───────────────

def test_evolve_result_current_frames_shape():
    g = Grid(128, -8.0, 8.0)
    V = 0.5 * g.x**2
    H = build_hamiltonian(g, V)
    psi0 = gaussian_packet(g.x, g.dx, x0=1.0, sigma=1.0, k0=1.0)
    result = evolve(H, psi0, g.x, g.dx, dt=0.01, n_steps=50,
                    potential=V, save_every=10)
    n_frames = result.psi_frames.shape[0]
    assert result.current_frames.shape == (n_frames, g.n)


def test_evolve_current_frames_real():
    g = Grid(64, -6.0, 6.0)
    V = np.zeros(g.n)
    H = build_hamiltonian(g, V)
    psi0 = gaussian_packet(g.x, g.dx, x0=0.0, sigma=1.0, k0=1.0)
    result = evolve(H, psi0, g.x, g.dx, dt=0.01, n_steps=20,
                    potential=V, save_every=10)
    assert np.isrealobj(result.current_frames)


# ── 7. /solve/evolve API response includes current_frames ────────────────────

def test_api_evolve_includes_current_frames():
    from fastapi.testclient import TestClient
    from app import app

    client = TestClient(app)
    payload = {
        "grid": {"x_min": -8.0, "x_max": 8.0, "n_points": 64},
        "potential_preset": "harmonic_oscillator",
        "gaussian_x0": 1.0,
        "gaussian_sigma": 1.0,
        "gaussian_k0": 1.0,
        "dt": 0.01,
        "n_steps": 20,
        "save_every": 10,
    }
    resp = client.post("/solve/evolve", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "current_frames" in data
    n_frames = len(data["psi_frames"])
    assert len(data["current_frames"]) == n_frames
    assert len(data["current_frames"][0]) == 64
