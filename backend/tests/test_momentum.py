"""Tests for backend/momentum.py — momentum-space probability density.

Covers all 7 validation requirements from specs/10-momentum-backend.md.
"""

import numpy as np
import pytest

import momentum
from grid import Grid
from hamiltonian import build_hamiltonian
from initial_states import gaussian_packet
from crank_nicolson import evolve


# ── fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def grid():
    return Grid(256, -10.0, 10.0)


# ── 1. k_axis has length N and is symmetric around 0 ─────────────────────────

def test_k_axis_length(grid):
    k = momentum.k_axis(grid.n, grid.dx)
    assert len(k) == grid.n


def test_k_axis_symmetric(grid):
    k = momentum.k_axis(grid.n, grid.dx)
    # After fftshift, k is monotonically increasing and 0 is at index N//2
    assert np.all(np.diff(k) > 0), "k_axis must be monotonically increasing"
    assert np.isclose(k[grid.n // 2], 0.0, atol=1e-12), "k=0 must be at centre index"


# ── 2. k_axis spacing equals 2π / (N·Δx) ────────────────────────────────────

def test_k_axis_spacing(grid):
    k = momentum.k_axis(grid.n, grid.dx)
    dk_expected = 2 * np.pi / (grid.n * grid.dx)
    dk_actual = k[1] - k[0]
    assert np.isclose(dk_actual, dk_expected, rtol=1e-10)


# ── 3. density integrates to 1 for a normalized wavefunction ─────────────────

def test_density_normalization(grid):
    psi = gaussian_packet(grid.x, grid.dx, x0=0.0, sigma=1.0, k0=0.0)
    rho_k = momentum.density(psi, grid.dx)
    dk = 2 * np.pi / (grid.n * grid.dx)
    integral = np.sum(rho_k) * dk
    assert np.isclose(integral, 1.0, rtol=1e-6)


def test_density_normalization_nonzero_k0(grid):
    psi = gaussian_packet(grid.x, grid.dx, x0=0.0, sigma=1.0, k0=3.0)
    rho_k = momentum.density(psi, grid.dx)
    dk = 2 * np.pi / (grid.n * grid.dx)
    integral = np.sum(rho_k) * dk
    assert np.isclose(integral, 1.0, rtol=1e-6)


# ── 4. density peaks near k₀ for a Gaussian with momentum k₀ ────────────────

def test_density_peak_near_k0(grid):
    k0 = 2.5
    psi = gaussian_packet(grid.x, grid.dx, x0=0.0, sigma=1.0, k0=k0)
    rho_k = momentum.density(psi, grid.dx)
    k = momentum.k_axis(grid.n, grid.dx)
    k_peak = k[np.argmax(rho_k)]
    assert abs(k_peak - k0) < 0.2  # within one grid step in k-space


# ── 5. density for k₀ = 0 is symmetric and peaked at k = 0 ──────────────────

def test_density_k0_zero_symmetric(grid):
    psi = gaussian_packet(grid.x, grid.dx, x0=0.0, sigma=1.0, k0=0.0)
    rho_k = momentum.density(psi, grid.dx)
    k = momentum.k_axis(grid.n, grid.dx)
    # peak at k = 0
    k_peak = k[np.argmax(rho_k)]
    assert abs(k_peak) < 0.5
    # symmetric: rho_k[mid - j] ≈ rho_k[mid + j] where mid = N//2 (k=0 index)
    mid = grid.n // 2
    np.testing.assert_allclose(rho_k[mid - 10:mid], rho_k[mid + 1:mid + 11][::-1], rtol=1e-4)


# ── 6. TimeEvolutionResult has correct shapes for momentum_frames and momentum_k

def test_evolve_result_momentum_shapes():
    g = Grid(128, -8.0, 8.0)
    V = 0.5 * g.x ** 2  # harmonic oscillator
    H = build_hamiltonian(g, V)
    psi0 = gaussian_packet(g.x, g.dx, x0=1.0, sigma=1.0, k0=0.0)
    result = evolve(H, psi0, g.x, g.dx, dt=0.01, n_steps=50,
                    potential=V, save_every=10)
    n_frames = result.momentum_frames.shape[0]
    assert result.momentum_frames.shape == (n_frames, g.n)
    assert result.momentum_k.shape == (g.n,)
    assert n_frames == result.psi_frames.shape[0]


def test_evolve_momentum_frames_nonnegative():
    g = Grid(64, -6.0, 6.0)
    V = np.zeros(g.n)
    H = build_hamiltonian(g, V)
    psi0 = gaussian_packet(g.x, g.dx, x0=0.0, sigma=1.0, k0=1.0)
    result = evolve(H, psi0, g.x, g.dx, dt=0.01, n_steps=20,
                    potential=V, save_every=10)
    assert np.all(result.momentum_frames >= 0.0)


# ── 7. /solve/evolve API response includes momentum_frames and momentum_k ─────

def test_api_evolve_includes_momentum_fields():
    from fastapi.testclient import TestClient
    from app import app

    client = TestClient(app)
    payload = {
        "grid": {"x_min": -8.0, "x_max": 8.0, "n_points": 64},
        "potential_preset": "harmonic_oscillator",
        "gaussian_x0": 1.0,
        "gaussian_sigma": 1.0,
        "gaussian_k0": 0.0,
        "dt": 0.01,
        "n_steps": 20,
        "save_every": 10,
    }
    resp = client.post("/solve/evolve", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "momentum_frames" in data
    assert "momentum_k" in data
    n_frames = len(data["psi_frames"])
    assert len(data["momentum_frames"]) == n_frames
    assert len(data["momentum_k"]) == 64
    # all values non-negative
    for frame in data["momentum_frames"]:
        assert all(v >= 0.0 for v in frame)
