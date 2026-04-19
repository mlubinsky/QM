"""API endpoint tests using FastAPI TestClient.

All solver quantities in atomic units: ħ = m_e = 1.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


# ── /health ──────────────────────────────────────────────────────────────────

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ── /presets ─────────────────────────────────────────────────────────────────

EXPECTED_PRESETS = {
    "infinite_square_well",
    "harmonic_oscillator",
    "double_well",
    "deep_double_well",
    "finite_square_well",
    "step_potential",
    "gaussian_barrier",
}

def test_presets_returns_all_seven():
    r = client.get("/presets")
    assert r.status_code == 200
    returned = set(r.json()["presets"])
    assert returned == EXPECTED_PRESETS


# ── POST /solve/eigenstates ──────────────────────────────────────────────────

def test_eigensolve_harmonic_oscillator_ground_state():
    payload = {
        "grid": {"x_min": -8.0, "x_max": 8.0, "n_points": 500},
        "potential_preset": "harmonic_oscillator",
        "n_states": 5,
    }
    r = client.post("/solve/eigenstates", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert len(body["energies"]) == 5
    E0 = body["energies"][0]
    assert abs(E0 - 0.5) / 0.5 < 0.01  # within 1% of 0.5


def test_eigensolve_invalid_potential_expr_returns_422():
    payload = {
        "grid": {"x_min": -5.0, "x_max": 5.0, "n_points": 100},
        "potential_expr": "import os; os.system('rm -rf /')",
        "n_states": 3,
    }
    r = client.post("/solve/eigenstates", json=payload)
    assert r.status_code == 422


def test_eigensolve_response_shape():
    """Response arrays are consistent with n_points."""
    n = 200
    payload = {
        "grid": {"x_min": 0.0, "x_max": 1.0, "n_points": n},
        "potential_preset": "infinite_square_well",
        "n_states": 3,
    }
    r = client.post("/solve/eigenstates", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert len(body["grid_x"]) == n
    assert len(body["potential"]) == n
    assert all(len(wf) == n for wf in body["wavefunctions"])


# ── POST /solve/evolve ───────────────────────────────────────────────────────

_EVOLVE_PAYLOAD = {
    "grid": {"x_min": 0.0, "x_max": 1.0, "n_points": 200},
    "potential_preset": "infinite_square_well",
    "initial_state": "gaussian",
    "gaussian_x0": 0.5,
    "gaussian_sigma": 0.05,
    "gaussian_k0": 10.0,
    "dt": 0.001,
    "n_steps": 100,
    "save_every": 10,
}


def test_evolve_norm_history():
    r = client.post("/solve/evolve", json=_EVOLVE_PAYLOAD)
    assert r.status_code == 200
    body = r.json()
    for norm in body["norm_history"]:
        assert abs(norm - 1.0) < 1e-4


def test_evolve_uncertainty_fields_present_and_valid():
    """delta_x, delta_p, delta_x_delta_p are returned and satisfy Heisenberg bound."""
    r = client.post("/solve/evolve", json=_EVOLVE_PAYLOAD)
    assert r.status_code == 200
    body = r.json()
    n_frames = len(body["times"])
    assert len(body["delta_x"]) == n_frames
    assert len(body["delta_p"]) == n_frames
    assert len(body["delta_x_delta_p"]) == n_frames
    for dx, dp, dxdp in zip(body["delta_x"], body["delta_p"], body["delta_x_delta_p"]):
        assert dx >= 0
        assert dp >= 0
        assert abs(dxdp - dx * dp) < 1e-10   # product is consistent
        assert dxdp >= 0.5 - 1e-3             # Heisenberg bound Δx·Δp ≥ ½


def test_evolve_runaway_computation_returns_422():
    """n_steps * dt > 100 must be rejected."""
    payload = {
        "grid": {"x_min": -5.0, "x_max": 5.0, "n_points": 100},
        "potential_preset": "harmonic_oscillator",
        "initial_state": "gaussian",
        "gaussian_x0": 0.0,
        "gaussian_sigma": 1.0,
        "dt": 0.1,
        "n_steps": 10000,
        "save_every": 10,
    }
    r = client.post("/solve/evolve", json=payload)
    assert r.status_code == 422


# ── validation rules ─────────────────────────────────────────────────────────

def test_x_min_ge_x_max_returns_422():
    payload = {
        "grid": {"x_min": 5.0, "x_max": -5.0, "n_points": 100},
        "potential_preset": "harmonic_oscillator",
        "n_states": 3,
    }
    r = client.post("/solve/eigenstates", json=payload)
    assert r.status_code == 422


def test_both_potential_null_returns_422():
    payload = {
        "grid": {"x_min": -5.0, "x_max": 5.0, "n_points": 100},
        "potential_preset": None,
        "potential_expr": None,
        "n_states": 3,
    }
    r = client.post("/solve/eigenstates", json=payload)
    assert r.status_code == 422
