"""Backend API tests for spec 19 — hydrogenic solver endpoint.

Covers validation requirements 6–7:
  6. API returns 200 for valid (Z,n,l,m); 422 for l≥n, |m|>l, Z>10
  7. energy_hartree in response matches energy_exact_hartree within 0.1%
"""

import pytest
from fastapi.testclient import TestClient

from app import app

_client = TestClient(app)

BASE = "/hydrogenic/solve"


def post(payload: dict) -> dict:
    r = _client.post(BASE, json=payload)
    return r


# ── Baseline valid request ─────────────────────────────────────────────────────

def test_hydrogen_1s_returns_200():
    r = post({"Z": 1, "n": 1, "l": 0, "m": 0})
    assert r.status_code == 200


def test_response_has_required_fields():
    r = post({"Z": 1, "n": 1, "l": 0, "m": 0, "n_points": 200, "grid_2d_points": 40})
    assert r.status_code == 200
    data = r.json()
    for field in ("r", "radial_density", "energy_hartree", "energy_exact_hartree",
                  "energy_ev", "x_axis", "z_axis", "orbital_density",
                  "ion_symbol", "ion_name", "orbital_label",
                  "sph_harm_x", "sph_harm_z"):
        assert field in data, f"Missing field: {field}"


def test_sph_harm_polar_shape_and_closure():
    r = post({"Z": 1, "n": 2, "l": 1, "m": 0, "n_points": 200, "grid_2d_points": 40})
    assert r.status_code == 200
    data = r.json()
    x, z = data["sph_harm_x"], data["sph_harm_z"]
    assert len(x) == len(z)
    assert len(x) > 0
    # curve must be closed
    assert abs(x[0] - x[-1]) < 1e-12
    assert abs(z[0] - z[-1]) < 1e-12


def test_sph_harm_polar_s_orbital_is_circle():
    # l=0, m=0: |Y_00|^2 is constant → polar curve is a circle, max r = 1
    r = post({"Z": 1, "n": 1, "l": 0, "m": 0, "n_points": 200, "grid_2d_points": 40})
    data = r.json()
    x, z = data["sph_harm_x"], data["sph_harm_z"]
    radii = [xi**2 + zi**2 for xi, zi in zip(x, z)]
    # All points should be at roughly the same radius (unit circle after normalisation)
    assert max(radii) - min(radii) < 1e-6


def test_sph_harm_polar_normalised_to_one():
    # Max radius of the closed curve should be 1.0 after normalisation
    for payload in [
        {"Z": 1, "n": 1, "l": 0, "m": 0},
        {"Z": 1, "n": 2, "l": 1, "m": 0},
        {"Z": 1, "n": 2, "l": 1, "m": 1},
        {"Z": 1, "n": 3, "l": 2, "m": 2},
    ]:
        r = post({**payload, "n_points": 200, "grid_2d_points": 40})
        data = r.json()
        x, z = data["sph_harm_x"], data["sph_harm_z"]
        max_r = max(xi**2 + zi**2 for xi, zi in zip(x, z)) ** 0.5
        assert abs(max_r - 1.0) < 1e-6, f"max_r={max_r} for {payload}"


# ── Shape checks ───────────────────────────────────────────────────────────────

def test_response_shape_1s():
    grid_2d = 30
    r = post({"Z": 1, "n": 1, "l": 0, "m": 0,
               "n_points": 400, "grid_2d_points": grid_2d})
    data = r.json()
    # n_points may be auto-scaled up to ensure dr ≤ 0.1 a.u.
    n_radial = len(data["r"])
    assert n_radial >= 400
    assert len(data["radial_density"]) == n_radial
    assert len(data["x_axis"]) == grid_2d
    assert len(data["z_axis"]) == grid_2d
    assert len(data["orbital_density"]) == grid_2d
    assert len(data["orbital_density"][0]) == grid_2d


# ── Ion metadata ───────────────────────────────────────────────────────────────

@pytest.mark.parametrize("Z,symbol,name", [
    (1, "H",    "hydrogen"),
    (2, "He⁺",  "helium"),
    (3, "Li²⁺", "lithium"),
    (6, "C⁵⁺",  "carbon"),
])
def test_ion_labels(Z, symbol, name):
    r = post({"Z": Z, "n": 1, "l": 0, "m": 0, "n_points": 200, "grid_2d_points": 20})
    assert r.status_code == 200
    data = r.json()
    assert data["ion_symbol"] == symbol
    assert data["ion_name"] == name


@pytest.mark.parametrize("n,l,expected_label", [
    (1, 0, "1s"),
    (2, 0, "2s"),
    (2, 1, "2p"),
    (3, 2, "3d"),
    (4, 3, "4f"),
])
def test_orbital_label(n, l, expected_label):
    r = post({"Z": 1, "n": n, "l": l, "m": 0, "n_points": 200, "grid_2d_points": 20})
    assert r.status_code == 200
    assert r.json()["orbital_label"] == expected_label


# ── Energy accuracy (requirement 7) ────────────────────────────────────────────

@pytest.mark.parametrize("Z,n,l", [
    (1, 1, 0),
    (1, 2, 1),
    (2, 1, 0),
    (6, 1, 0),
])
def test_energy_matches_exact(Z, n, l):
    r = post({"Z": Z, "n": n, "l": l, "m": 0, "n_points": 800, "grid_2d_points": 20})
    assert r.status_code == 200
    data = r.json()
    E_num   = data["energy_hartree"]
    E_exact = data["energy_exact_hartree"]
    assert abs(E_num - E_exact) / abs(E_exact) < 0.001, (
        f"Z={Z} n={n} l={l}: E_num={E_num:.6f}, E_exact={E_exact:.6f}"
    )


def test_energy_exact_formula():
    """energy_exact_hartree must equal -Z²/(2n²)."""
    r = post({"Z": 3, "n": 2, "l": 0, "m": 0, "n_points": 200, "grid_2d_points": 20})
    data = r.json()
    expected = -(3**2) / (2 * 2**2)   # -9/8 = -1.125
    assert abs(data["energy_exact_hartree"] - expected) < 1e-10


def test_energy_ev_conversion():
    """energy_ev ≈ energy_hartree * 27.211."""
    r = post({"Z": 1, "n": 1, "l": 0, "m": 0, "n_points": 200, "grid_2d_points": 20})
    data = r.json()
    ratio = data["energy_ev"] / data["energy_hartree"]
    assert abs(ratio - 27.211386245988) < 0.001


# ── Validation: 422 on bad quantum numbers (requirement 6) ─────────────────────

def test_422_l_equals_n():
    r = post({"Z": 1, "n": 2, "l": 2, "m": 0})
    assert r.status_code == 422


def test_422_l_greater_than_n():
    r = post({"Z": 1, "n": 1, "l": 2, "m": 0})
    assert r.status_code == 422


def test_422_m_exceeds_l():
    r = post({"Z": 1, "n": 2, "l": 1, "m": 2})
    assert r.status_code == 422


def test_422_m_negative_exceeds_l():
    r = post({"Z": 1, "n": 2, "l": 1, "m": -2})
    assert r.status_code == 422


def test_422_Z_too_large():
    r = post({"Z": 11, "n": 1, "l": 0, "m": 0})
    assert r.status_code == 422


def test_422_Z_zero():
    r = post({"Z": 0, "n": 1, "l": 0, "m": 0})
    assert r.status_code == 422


def test_422_n_too_large():
    r = post({"Z": 1, "n": 6, "l": 0, "m": 0})
    assert r.status_code == 422


def test_422_n_zero():
    r = post({"Z": 1, "n": 0, "l": 0, "m": 0})
    assert r.status_code == 422


# ── Orbital density non-negative ───────────────────────────────────────────────

def test_orbital_density_all_nonnegative():
    r = post({"Z": 1, "n": 2, "l": 1, "m": 1, "n_points": 200, "grid_2d_points": 30})
    data = r.json()
    for row in data["orbital_density"]:
        assert all(v >= 0.0 for v in row), "Orbital density has negative values"


# ── Multiple valid states ──────────────────────────────────────────────────────

@pytest.mark.parametrize("Z,n,l,m", [
    (1, 1, 0,  0),
    (1, 2, 0,  0),
    (1, 2, 1,  0),
    (1, 2, 1,  1),
    (1, 2, 1, -1),
    (1, 3, 2,  0),
    (2, 3, 1,  1),
    (6, 2, 1, -1),
])
def test_valid_states_return_200(Z, n, l, m):
    r = post({"Z": Z, "n": n, "l": l, "m": m, "n_points": 200, "grid_2d_points": 20})
    assert r.status_code == 200
