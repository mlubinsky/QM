"""Tests for Spec 17: initial state selection — superposition of eigenstates."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

GRID = {"x_min": -10.0, "x_max": 10.0, "n_points": 200}
BASE = {
    "grid": GRID,
    "potential_preset": "harmonic_oscillator",
    "dt": 0.01,
    "n_steps": 10,
    "save_every": 5,
}


# ── Gaussian still works ──────────────────────────────────────────────────────

def test_gaussian_explicit_still_works():
    """Passing initial_state='gaussian' explicitly should return 200."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "gaussian",
        "gaussian_x0": 0.0,
        "gaussian_sigma": 1.0,
        "gaussian_k0": 0.0,
    })
    assert resp.status_code == 200


# ── Superposition — valid requests ───────────────────────────────────────────

def test_superposition_two_states():
    """Superposition of two equal-weight eigenstates should return 200."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 2,
        "coefficients": [1.0, 1.0],
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "psi_frames" in data
    assert len(data["psi_frames"]) > 0


def test_superposition_single_eigenstate():
    """Pure eigenstate (n_super_states=1, coefficients=[1]) should work."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 1,
        "coefficients": [1.0],
    })
    assert resp.status_code == 200, resp.text


def test_superposition_ground_state_only():
    """[1.0, 0.0] selects only the ground state."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 2,
        "coefficients": [1.0, 0.0],
    })
    assert resp.status_code == 200, resp.text


def test_superposition_norm_conserved():
    """Norm should remain close to 1.0 throughout evolution."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 2,
        "coefficients": [1.0, 1.0],
        "n_steps": 20,
        "save_every": 2,
    })
    assert resp.status_code == 200, resp.text
    norms = resp.json()["norm_history"]
    for norm in norms:
        assert abs(norm - 1.0) < 1e-4, f"Norm deviation too large: {norm}"


def test_superposition_first_excited_state():
    """Selecting first excited state only: [0.0, 1.0, 0.0]."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 3,
        "coefficients": [0.0, 1.0, 0.0],
    })
    assert resp.status_code == 200, resp.text


# ── Superposition — validation errors ────────────────────────────────────────

def test_superposition_missing_coefficients_gives_422():
    """Superposition without coefficients should return 422."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 2,
        # coefficients omitted
    })
    assert resp.status_code == 422


def test_superposition_all_zero_coefficients_gives_422():
    """All-zero coefficients should return 422."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 2,
        "coefficients": [0.0, 0.0],
    })
    assert resp.status_code == 422


def test_superposition_wrong_length_gives_422():
    """len(coefficients) != n_super_states should return 422."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 3,
        "coefficients": [1.0, 0.0],   # only 2, but n_super_states=3
    })
    assert resp.status_code == 422


def test_superposition_wrong_length_too_many_gives_422():
    """Too many coefficients should also return 422."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 2,
        "coefficients": [1.0, 0.0, 0.5],  # 3 coefficients but n_super_states=2
    })
    assert resp.status_code == 422


def test_superposition_n_super_states_exceeds_limit_gives_422():
    """n_super_states > 20 should be rejected by field constraint."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 25,
        "coefficients": [1.0] * 25,
    })
    assert resp.status_code == 422


# ── gaussian_x0 domain check skipped for superposition ───────────────────────

def test_superposition_ignores_gaussian_x0_domain():
    """Superposition should not fail due to gaussian_x0 being outside domain."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "superposition",
        "n_super_states": 2,
        "coefficients": [1.0, 0.0],
        "gaussian_x0": 999.0,   # way outside domain — should be ignored
    })
    assert resp.status_code == 200, resp.text


# ── invalid initial_state value ───────────────────────────────────────────────

def test_invalid_initial_state_gives_422():
    """An unknown initial_state value should be rejected."""
    resp = client.post("/solve/evolve", json={
        **BASE,
        "initial_state": "plane_wave",
    })
    assert resp.status_code == 422
