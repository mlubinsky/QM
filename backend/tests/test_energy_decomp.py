"""Tests for energy decomposition fields in /schrodinger1d/solve/evolve.

Written TDD-style: all tests FAIL until decomp_energies and decomp_weights
are added to EvolveResponse and computed in the evolve endpoint.
"""

import numpy as np
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

GRID = {"x_min": -8.0, "x_max": 8.0, "n_points": 200}
FAST_EVOLVE = {"dt": 0.01, "n_steps": 10, "save_every": 10}


def evolve(payload: dict) -> dict:
    r = client.post("/schrodinger1d/solve/evolve", json=payload)
    assert r.status_code == 200, r.text
    return r.json()


# ── field presence ─────────────────────────────────────────────────────────────

def test_decomp_fields_present_gaussian():
    data = evolve({
        "grid": GRID,
        "potential_preset": "harmonic_oscillator",
        "initial_state": "gaussian",
        "gaussian_x0": 0.0, "gaussian_sigma": 1.0, "gaussian_k0": 0.0,
        **FAST_EVOLVE,
    })
    assert "decomp_energies" in data
    assert "decomp_weights" in data

def test_decomp_fields_present_superposition():
    data = evolve({
        "grid": GRID,
        "potential_preset": "harmonic_oscillator",
        "initial_state": "superposition",
        "n_super_states": 2,
        "coefficients": [1.0, 0.0],
        **FAST_EVOLVE,
    })
    assert "decomp_energies" in data
    assert "decomp_weights" in data

# ── basic constraints ──────────────────────────────────────────────────────────

def test_decomp_weights_non_negative():
    data = evolve({
        "grid": GRID,
        "potential_preset": "harmonic_oscillator",
        "initial_state": "gaussian",
        "gaussian_x0": 0.0, "gaussian_sigma": 1.0, "gaussian_k0": 0.0,
        **FAST_EVOLVE,
    })
    assert all(w >= 0 for w in data["decomp_weights"])

def test_decomp_weights_sum_le_one():
    data = evolve({
        "grid": GRID,
        "potential_preset": "harmonic_oscillator",
        "initial_state": "gaussian",
        "gaussian_x0": 0.0, "gaussian_sigma": 1.0, "gaussian_k0": 0.0,
        **FAST_EVOLVE,
    })
    assert sum(data["decomp_weights"]) <= 1.01

def test_decomp_lengths_match():
    data = evolve({
        "grid": GRID,
        "potential_preset": "harmonic_oscillator",
        "initial_state": "gaussian",
        "gaussian_x0": 0.0, "gaussian_sigma": 1.0, "gaussian_k0": 0.0,
        **FAST_EVOLVE,
    })
    assert len(data["decomp_energies"]) == len(data["decomp_weights"])
    assert len(data["decomp_energies"]) > 0

# ── physics: pure eigenstate superposition ─────────────────────────────────────

def test_decomp_pure_ground_state():
    """c₁=1, c₂=0 → weight[0] ≈ 1, all others ≈ 0."""
    data = evolve({
        "grid": GRID,
        "potential_preset": "harmonic_oscillator",
        "initial_state": "superposition",
        "n_super_states": 3,
        "coefficients": [1.0, 0.0, 0.0],
        **FAST_EVOLVE,
    })
    weights = data["decomp_weights"]
    assert abs(weights[0] - 1.0) < 0.02
    assert all(w < 0.02 for w in weights[1:])

def test_decomp_equal_superposition():
    """c₁=c₂=1 → after normalisation both weights ≈ 0.5."""
    data = evolve({
        "grid": GRID,
        "potential_preset": "harmonic_oscillator",
        "initial_state": "superposition",
        "n_super_states": 2,
        "coefficients": [1.0, 1.0],
        **FAST_EVOLVE,
    })
    weights = data["decomp_weights"]
    assert abs(weights[0] - 0.5) < 0.03
    assert abs(weights[1] - 0.5) < 0.03

# ── physics: Gaussian on HO — ground-state dominated ──────────────────────────

def test_decomp_gaussian_ho_ground_state_dominant():
    """Gaussian centred at x=0 with σ=1 (HO ground-state width) should have
    the bulk of its weight in the ground state."""
    data = evolve({
        "grid": GRID,
        "potential_preset": "harmonic_oscillator",
        "initial_state": "gaussian",
        "gaussian_x0": 0.0, "gaussian_sigma": 1.0, "gaussian_k0": 0.0,
        **FAST_EVOLVE,
    })
    weights = data["decomp_weights"]
    # Ground-state (n=0 in 0-indexed) should carry most of the weight
    assert weights[0] == max(weights)

# ── energies ordering ──────────────────────────────────────────────────────────

def test_decomp_energies_ascending():
    data = evolve({
        "grid": GRID,
        "potential_preset": "harmonic_oscillator",
        "initial_state": "gaussian",
        "gaussian_x0": 0.0, "gaussian_sigma": 1.0, "gaussian_k0": 0.0,
        **FAST_EVOLVE,
    })
    energies = data["decomp_energies"]
    assert energies == sorted(energies)
