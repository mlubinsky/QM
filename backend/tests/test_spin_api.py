"""Backend tests for spec 20 — spin-½ endpoints.

Tests are written first (TDD). They should FAIL until the implementation is
added in solvers/spin/.

Covers:
  GET  /spin/pauli   — static Pauli matrix data
  POST /spin/measure — measurement probabilities + shot histogram
"""

import math
import pytest
from fastapi.testclient import TestClient

from app import app

client = TestClient(app)

MEASURE = "/spin/measure"
PAULI   = "/spin/pauli"


# ── Helpers ───────────────────────────────────────────────────────────────────

def measure(payload: dict):
    return client.post(MEASURE, json=payload)


# ── GET /spin/pauli ───────────────────────────────────────────────────────────

def test_pauli_returns_200():
    r = client.get(PAULI)
    assert r.status_code == 200


def test_pauli_has_required_keys():
    data = client.get(PAULI).json()
    for key in ("sigma_x", "sigma_y", "sigma_z", "eigenvalues", "eigenvectors"):
        assert key in data, f"Missing key: {key}"


def test_pauli_sigma_x_values():
    data = client.get(PAULI).json()
    # sigma_x real part = [[0,1],[1,0]], imaginary part = [[0,0],[0,0]]
    sx = data["sigma_x"]
    assert sx["re"] == [[0, 1], [1, 0]]
    assert sx["im"] == [[0, 0], [0, 0]]


def test_pauli_sigma_z_values():
    data = client.get(PAULI).json()
    sz = data["sigma_z"]
    assert sz["re"] == [[1, 0], [0, -1]]
    assert sz["im"] == [[0, 0], [0, 0]]


def test_pauli_sigma_y_values():
    data = client.get(PAULI).json()
    # sigma_y = [[0, -i], [i, 0]]
    sy = data["sigma_y"]
    assert sy["re"] == [[0, 0], [0, 0]]
    assert sy["im"] == [[0, -1], [1, 0]]


def test_pauli_eigenvalues():
    data = client.get(PAULI).json()
    assert data["eigenvalues"] == [-1, 1]


def test_pauli_eigenvectors_present():
    data = client.get(PAULI).json()
    ev = data["eigenvectors"]
    for axis in ("sigma_x", "sigma_y", "sigma_z"):
        assert axis in ev, f"Missing eigenvectors for {axis}"
        assert "plus" in ev[axis]
        assert "minus" in ev[axis]


# ── POST /spin/measure — basic structure ──────────────────────────────────────

def test_measure_returns_200():
    r = measure({"theta": 0.0, "phi": 0.0, "axis": [0, 0, 1], "n_shots": 100})
    assert r.status_code == 200


def test_measure_has_required_fields():
    data = measure({"theta": 0.0, "phi": 0.0, "axis": [0, 0, 1], "n_shots": 100}).json()
    for field in ("p_plus", "p_minus", "shots_plus", "shots_minus", "axis_label"):
        assert field in data, f"Missing field: {field}"


def test_measure_probabilities_sum_to_one():
    data = measure({"theta": 1.0, "phi": 0.5, "axis": [0, 0, 1], "n_shots": 500}).json()
    assert abs(data["p_plus"] + data["p_minus"] - 1.0) < 1e-12


def test_measure_shots_sum_to_n_shots():
    n = 1000
    data = measure({"theta": 1.0, "phi": 0.5, "axis": [0, 0, 1], "n_shots": n}).json()
    assert data["shots_plus"] + data["shots_minus"] == n


# ── POST /spin/measure — physics correctness ──────────────────────────────────

def test_spin_up_along_z_certainty():
    """⟨↑| measured along z always gives +½."""
    data = measure({"theta": 0.0, "phi": 0.0, "axis": [0, 0, 1], "n_shots": 200}).json()
    assert abs(data["p_plus"] - 1.0) < 1e-12
    assert abs(data["p_minus"] - 0.0) < 1e-12


def test_spin_down_along_z_certainty():
    """⟨↓| measured along z always gives −½."""
    data = measure({"theta": math.pi, "phi": 0.0, "axis": [0, 0, 1], "n_shots": 200}).json()
    assert abs(data["p_plus"] - 0.0) < 1e-12
    assert abs(data["p_minus"] - 1.0) < 1e-12


def test_plus_x_along_x_certainty():
    """|+x⟩ = (θ=π/2, φ=0) measured along x gives +½ with certainty."""
    data = measure({"theta": math.pi / 2, "phi": 0.0, "axis": [1, 0, 0], "n_shots": 200}).json()
    assert abs(data["p_plus"] - 1.0) < 1e-12


def test_minus_x_along_x_certainty():
    """|−x⟩ = (θ=π/2, φ=π) measured along x gives −½ with certainty."""
    data = measure({"theta": math.pi / 2, "phi": math.pi, "axis": [1, 0, 0], "n_shots": 200}).json()
    assert abs(data["p_minus"] - 1.0) < 1e-12


def test_plus_x_along_z_fifty_fifty():
    """|+x⟩ measured along z: exact probabilities are 0.5 each."""
    data = measure({"theta": math.pi / 2, "phi": 0.0, "axis": [0, 0, 1], "n_shots": 10000}).json()
    assert abs(data["p_plus"] - 0.5) < 1e-12
    assert abs(data["p_minus"] - 0.5) < 1e-12


def test_plus_y_along_y_certainty():
    """|+y⟩ = (θ=π/2, φ=π/2) measured along y gives +½ with certainty."""
    data = measure({"theta": math.pi / 2, "phi": math.pi / 2, "axis": [0, 1, 0], "n_shots": 200}).json()
    assert abs(data["p_plus"] - 1.0) < 1e-12


# ── POST /spin/measure — axis normalization ───────────────────────────────────

def test_axis_normalization_z():
    """[0, 0, 2] treated identically to [0, 0, 1]."""
    r1 = measure({"theta": 0.5, "phi": 1.0, "axis": [0, 0, 1], "n_shots": 1}).json()
    r2 = measure({"theta": 0.5, "phi": 1.0, "axis": [0, 0, 2], "n_shots": 1}).json()
    assert abs(r1["p_plus"] - r2["p_plus"]) < 1e-12


# ── POST /spin/measure — axis_label ──────────────────────────────────────────

def test_axis_label_z():
    data = measure({"theta": 0.0, "phi": 0.0, "axis": [0, 0, 1], "n_shots": 1}).json()
    assert data["axis_label"] == "z"


def test_axis_label_x():
    data = measure({"theta": 0.0, "phi": 0.0, "axis": [1, 0, 0], "n_shots": 1}).json()
    assert data["axis_label"] == "x"


def test_axis_label_y():
    data = measure({"theta": 0.0, "phi": 0.0, "axis": [0, 1, 0], "n_shots": 1}).json()
    assert data["axis_label"] == "y"


def test_axis_label_custom():
    data = measure({"theta": 0.0, "phi": 0.0, "axis": [1, 1, 0], "n_shots": 1}).json()
    assert data["axis_label"] == "custom"


# ── POST /spin/measure — validation errors ────────────────────────────────────

def test_zero_axis_rejected():
    r = measure({"theta": 0.0, "phi": 0.0, "axis": [0, 0, 0], "n_shots": 10})
    assert r.status_code == 422


def test_n_shots_zero_rejected():
    r = measure({"theta": 0.0, "phi": 0.0, "axis": [0, 0, 1], "n_shots": 0})
    assert r.status_code == 422


def test_n_shots_too_large_rejected():
    r = measure({"theta": 0.0, "phi": 0.0, "axis": [0, 0, 1], "n_shots": 100_001})
    assert r.status_code == 422
