"""Regression suite for spec 18 — solver-namespace refactoring.

Verifies three things after the refactor:
  1. All modules import from their new package locations.
  2. All API endpoints respond at their new /schrodinger1d/ prefix; old
     URLs at /presets and /solve/* return 404.
  3. The three CLAUDE.md physics validation requirements still hold:
       - Infinite square well: E_n = n²π²/2L²  (< 0.5 % error)
       - Harmonic oscillator:  E_n = n + 1/2    (< 0.5 % error)
       - Norm conservation:    |‖ψ(t)‖² − 1| < 1e-4
"""

import math

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app import app

_client = TestClient(app)


# ── 1. Import smoke tests ─────────────────────────────────────────────────────

def test_shared_grid_importable():
    from shared.grid import Grid
    g = Grid(100, 0.0, 1.0)
    assert g.n == 100
    assert g.dx == pytest.approx(1.0 / 99, rel=1e-6)


def test_shared_potential_parser_importable():
    from shared.potential_parser import parse_potential
    x = np.linspace(-5, 5, 100)
    V = parse_potential("0.5 * x**2", x)
    assert V.shape == (100,)
    assert V[50] == pytest.approx(0.0, abs=0.1)


def test_shared_units_importable():
    from shared import units
    assert hasattr(units, "HBAR")
    assert units.HBAR == pytest.approx(1.0)


def test_hamiltonian_importable():
    from solvers.schrodinger_1d.hamiltonian import build_hamiltonian


def test_eigenvalue_solver_importable():
    from solvers.schrodinger_1d.eigenvalue_solver import solve_eigenstates


def test_crank_nicolson_importable():
    from solvers.schrodinger_1d.crank_nicolson import evolve


def test_expectation_values_importable():
    from solvers.schrodinger_1d.expectation_values import compute, ExpectationValues


def test_momentum_importable():
    from solvers.schrodinger_1d import momentum
    assert hasattr(momentum, "density")
    assert hasattr(momentum, "k_axis")


def test_probability_current_importable():
    from solvers.schrodinger_1d import probability_current
    assert hasattr(probability_current, "compute")


def test_initial_states_importable():
    from solvers.schrodinger_1d.initial_states import gaussian_packet, eigenstate_superposition


def test_presets_importable():
    from solvers.schrodinger_1d.presets import PRESETS
    assert "infinite_square_well" in PRESETS
    assert "harmonic_oscillator" in PRESETS


# ── 2. API at new URL prefixes ────────────────────────────────────────────────

def test_health_still_at_root():
    r = _client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_old_presets_url_gone():
    r = _client.get("/presets")
    assert r.status_code == 404


def test_old_eigenstates_url_gone():
    r = _client.post("/solve/eigenstates", json={
        "grid": {"x_min": -5.0, "x_max": 5.0, "n_points": 100},
        "potential_preset": "harmonic_oscillator",
        "n_states": 3,
    })
    assert r.status_code == 404


def test_old_evolve_url_gone():
    r = _client.post("/solve/evolve", json={
        "grid": {"x_min": 0.0, "x_max": 1.0, "n_points": 100},
        "potential_preset": "infinite_square_well",
        "initial_state": "gaussian",
        "gaussian_x0": 0.5,
        "gaussian_sigma": 0.05,
        "gaussian_k0": 10.0,
        "dt": 0.001,
        "n_steps": 50,
        "save_every": 5,
    })
    assert r.status_code == 404


def test_presets_at_new_url():
    r = _client.get("/schrodinger1d/presets")
    assert r.status_code == 200
    presets = set(r.json()["presets"])
    assert "infinite_square_well" in presets
    assert "harmonic_oscillator" in presets
    assert len(presets) == 7


def test_eigenstates_at_new_url():
    r = _client.post("/schrodinger1d/solve/eigenstates", json={
        "grid": {"x_min": -8.0, "x_max": 8.0, "n_points": 200},
        "potential_preset": "harmonic_oscillator",
        "n_states": 3,
    })
    assert r.status_code == 200
    body = r.json()
    assert len(body["energies"]) == 3
    assert body["converged"] is True


def test_evolve_at_new_url():
    r = _client.post("/schrodinger1d/solve/evolve", json={
        "grid": {"x_min": 0.0, "x_max": 1.0, "n_points": 200},
        "potential_preset": "infinite_square_well",
        "initial_state": "gaussian",
        "gaussian_x0": 0.5,
        "gaussian_sigma": 0.05,
        "gaussian_k0": 10.0,
        "dt": 0.001,
        "n_steps": 100,
        "save_every": 10,
    })
    assert r.status_code == 200
    body = r.json()
    assert "psi_frames" in body
    assert len(body["psi_frames"]) > 0


def test_validation_422_still_works_at_new_url():
    """Request-level validation still returns 422 at the new URL."""
    r = _client.post("/schrodinger1d/solve/eigenstates", json={
        "grid": {"x_min": 5.0, "x_max": -5.0, "n_points": 100},
        "potential_preset": "harmonic_oscillator",
        "n_states": 3,
    })
    assert r.status_code == 422


# ── 3. Physics validation (CLAUDE.md requirements) ───────────────────────────

def test_isw_energies():
    """Infinite square well: E_n = n²π²/2L²  (< 0.5 % error)."""
    from shared.grid import Grid
    from solvers.schrodinger_1d.hamiltonian import build_hamiltonian
    from solvers.schrodinger_1d.eigenvalue_solver import solve_eigenstates

    L = 1.0
    g = Grid(500, 0.0, L)
    V = np.zeros(g.n)
    H = build_hamiltonian(g, V)
    result = solve_eigenstates(H, g.x, g.dx, k=5)

    for n in range(1, 6):
        E_exact = n ** 2 * math.pi ** 2 / (2 * L ** 2)
        E_num = result.energies[n - 1]
        assert abs(E_num - E_exact) / E_exact < 0.005, (
            f"ISW n={n}: got {E_num:.6f}, expected {E_exact:.6f}"
        )


def test_ho_energies():
    """Harmonic oscillator: E_n = n + 1/2  (< 0.5 % error)."""
    from shared.grid import Grid
    from solvers.schrodinger_1d.hamiltonian import build_hamiltonian
    from solvers.schrodinger_1d.eigenvalue_solver import solve_eigenstates

    g = Grid(500, -8.0, 8.0)
    V = 0.5 * g.x ** 2
    H = build_hamiltonian(g, V)
    result = solve_eigenstates(H, g.x, g.dx, k=5)

    for n in range(5):
        E_exact = n + 0.5
        E_num = result.energies[n]
        assert abs(E_num - E_exact) / E_exact < 0.005, (
            f"HO n={n}: got {E_num:.6f}, expected {E_exact:.6f}"
        )


def test_norm_conservation():
    """||ψ(t)||² stays within 1e-4 of 1.0 throughout CN evolution."""
    r = _client.post("/schrodinger1d/solve/evolve", json={
        "grid": {"x_min": 0.0, "x_max": 1.0, "n_points": 200},
        "potential_preset": "infinite_square_well",
        "initial_state": "gaussian",
        "gaussian_x0": 0.5,
        "gaussian_sigma": 0.05,
        "gaussian_k0": 10.0,
        "dt": 0.001,
        "n_steps": 200,
        "save_every": 10,
    })
    assert r.status_code == 200
    for norm in r.json()["norm_history"]:
        assert abs(norm - 1.0) < 1e-4, f"Norm deviation: {norm - 1.0:.2e}"
