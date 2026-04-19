"""Spec 16 — additional API validation tests (items 6–7).

Item 6: save_every > n_steps must return 422.
Item 7: x0 outside [x_min, x_max] must return 422.
"""

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

_BASE_EVOLVE = {
    "grid": {"x_min": -5.0, "x_max": 5.0, "n_points": 100},
    "potential_preset": "infinite_square_well",
    "gaussian_x0": 0.0,
    "gaussian_sigma": 0.5,
    "gaussian_k0": 0.0,
    "dt": 0.001,
    "n_steps": 50,
    "save_every": 5,
}


# ── Item 6: save_every > n_steps ─────────────────────────────────────────────

def test_save_every_greater_than_n_steps_returns_422():
    """save_every=100 with n_steps=50 must be rejected."""
    payload = {**_BASE_EVOLVE, "save_every": 100, "n_steps": 50}
    r = client.post("/solve/evolve", json=payload)
    assert r.status_code == 422


def test_save_every_equal_to_n_steps_is_accepted():
    """save_every == n_steps is the boundary case and must succeed."""
    payload = {**_BASE_EVOLVE, "save_every": 50, "n_steps": 50}
    r = client.post("/solve/evolve", json=payload)
    assert r.status_code == 200


def test_save_every_less_than_n_steps_is_accepted():
    """Normal case: save_every < n_steps."""
    payload = {**_BASE_EVOLVE, "save_every": 5, "n_steps": 50}
    r = client.post("/solve/evolve", json=payload)
    assert r.status_code == 200


# ── Item 7: x0 outside domain ────────────────────────────────────────────────

def test_x0_above_x_max_returns_422():
    """gaussian_x0 > x_max must be rejected."""
    payload = {**_BASE_EVOLVE, "gaussian_x0": 10.0}   # domain is [-5, 5]
    r = client.post("/solve/evolve", json=payload)
    assert r.status_code == 422


def test_x0_below_x_min_returns_422():
    """gaussian_x0 < x_min must be rejected."""
    payload = {**_BASE_EVOLVE, "gaussian_x0": -10.0}
    r = client.post("/solve/evolve", json=payload)
    assert r.status_code == 422


def test_x0_at_x_max_boundary_accepted():
    """gaussian_x0 == x_max is the edge of the domain — accept it."""
    payload = {**_BASE_EVOLVE, "gaussian_x0": 5.0}
    r = client.post("/solve/evolve", json=payload)
    assert r.status_code == 200


def test_x0_at_x_min_boundary_accepted():
    payload = {**_BASE_EVOLVE, "gaussian_x0": -5.0}
    r = client.post("/solve/evolve", json=payload)
    assert r.status_code == 200


def test_x0_inside_domain_accepted():
    payload = {**_BASE_EVOLVE, "gaussian_x0": 1.5}
    r = client.post("/solve/evolve", json=payload)
    assert r.status_code == 200
