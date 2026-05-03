"""Tests for 3-D orbital isosurface — analytic |ψ_nlm(x,y,z)|².

Spec:
  - backend/solvers/hydrogenic/orbitals.py: orbital_isosurface(n, l, m, Z, grid_size)
      returns (axis: list[float], values: list[float])
      where axis is the 1-D symmetric grid (-r_max … r_max, length grid_size)
      and values is the N³ flattened |ψ_nlm|² in ijk (x-major) order.
  - HydrogenicResponse gains iso_axis: list[float] and iso_values: list[float].
  - POST /hydrogenic/solve returns both new fields.

Physical checks:
  1s (n=1,l=0,m=0): maximum at origin; spherically symmetric; normalisable.
  2s (n=2,l=0,m=0): has a radial node (zero ring) inside the grid.
  2p z (n=2,l=1,m=0): nodal plane at z=0 (all values on z=0 slice ≈ 0).
  Higher Z → more compact (peak closer to origin, falls off faster).
"""

import math
import numpy as np
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

SMALL = 15   # small grid for fast unit tests


# ── helper to call the API ────────────────────────────────────────────────────

def solve(n, l, m, Z=1):
    r = client.post("/hydrogenic/solve", json={"n": n, "l": l, "m": m, "Z": Z})
    assert r.status_code == 200, r.text
    return r.json()


# ── API field presence ────────────────────────────────────────────────────────

def test_iso_fields_present():
    data = solve(1, 0, 0)
    assert "iso_axis" in data, "iso_axis missing from response"
    assert "iso_values" in data, "iso_values missing from response"


def test_iso_axis_is_list_of_floats():
    data = solve(1, 0, 0)
    assert isinstance(data["iso_axis"], list)
    assert all(isinstance(v, float) for v in data["iso_axis"])


def test_iso_values_is_list_of_floats():
    data = solve(1, 0, 0)
    assert isinstance(data["iso_values"], list)
    assert all(isinstance(v, float) for v in data["iso_values"])


def test_iso_values_length_is_cube_of_axis():
    data = solve(1, 0, 0)
    N = len(data["iso_axis"])
    assert len(data["iso_values"]) == N ** 3


def test_iso_axis_is_symmetric_around_zero():
    data = solve(2, 1, 0)
    axis = data["iso_axis"]
    assert abs(axis[0] + axis[-1]) < 1e-10


# ── physical properties — unit-level (call orbitals directly) ─────────────────

from solvers.hydrogenic.orbitals import orbital_isosurface


def test_values_nonnegative():
    axis, values = orbital_isosurface(1, 0, 0, 1, SMALL)
    assert all(v >= -1e-12 for v in values), "density must be ≥ 0"


def test_1s_max_at_origin():
    """1s probability density peaks at r=0."""
    axis, values = orbital_isosurface(1, 0, 0, 1, SMALL)
    N = len(axis)
    arr = np.array(values).reshape(N, N, N)
    # Locate the centre voxel
    c = N // 2
    centre_val = arr[c, c, c]
    assert centre_val == pytest.approx(max(values), rel=0.01), \
        "1s orbital: max should be at origin"


def test_1s_spherically_symmetric():
    """For l=m=0, |ψ|² depends only on r — three off-axis points at same r
    must have equal density (within numerical tolerance)."""
    axis, values = orbital_isosurface(1, 0, 0, 1, SMALL)
    N = len(axis)
    arr = np.array(values).reshape(N, N, N)
    # Pick a point (i, mid, mid) and the same-distance permutations
    mid = N // 2
    i = mid + 2
    v_x = arr[i, mid, mid]
    v_y = arr[mid, i, mid]
    v_z = arr[mid, mid, i]
    assert v_x == pytest.approx(v_y, rel=0.01)
    assert v_x == pytest.approx(v_z, rel=0.01)


def test_2p_m0_nodal_plane():
    """2p(m=0) = 2p_z: |ψ|² = 0 in the z=0 plane (cos θ = 0)."""
    axis, values = orbital_isosurface(2, 1, 0, 1, SMALL)
    N = len(axis)
    arr = np.array(values).reshape(N, N, N)
    mid = N // 2
    # The entire z=mid slice (z=0 plane) should be ≈ 0
    slice_max = arr[:, :, mid].max()
    assert slice_max < 1e-6, f"2p_z nodal plane: expected ~0, got {slice_max}"


def test_2s_has_radial_node():
    """2s orbital has a spherical nodal surface at r = 2a₀ (Z=1).
    Along the z-axis this means arr[mid,mid,k]=0 for some k away from centre."""
    axis, values = orbital_isosurface(2, 0, 0, 1, SMALL)
    N = len(axis)
    arr = np.array(values).reshape(N, N, N)
    mid = N // 2
    line = arr[mid, mid, :]   # density along z-axis
    # There must be at least one zero-crossing (value < threshold) away from edges
    interior = line[2:N-2]
    assert interior.min() < 1e-4, "2s orbital should have a radial node"


def test_normalization_approx():
    """∑|ψ|² ΔV ≈ 1 within 5 % on a reasonably large grid."""
    axis, values = orbital_isosurface(1, 0, 0, 1, 40)
    axis_arr = np.array(axis)
    dx = axis_arr[1] - axis_arr[0]
    dV = dx ** 3
    total = sum(values) * dV
    assert abs(total - 1.0) < 0.05, f"norm = {total:.4f}, expected ≈ 1"


def test_higher_Z_more_compact():
    """Z=2 orbital should have smaller ⟨r⟩ than Z=1.
    Exact: ⟨r⟩_1s = 3/(2Z), so ⟨r⟩(Z=2)=0.75 < ⟨r⟩(Z=1)=1.5.
    """
    def mean_r(Z_val):
        axis, values = orbital_isosurface(1, 0, 0, Z_val, 40)
        N = len(axis)
        arr = np.array(values).reshape(N, N, N)
        axis_arr = np.array(axis)
        dx = axis_arr[1] - axis_arr[0]
        X, Y, Zg = np.meshgrid(axis_arr, axis_arr, axis_arr, indexing="ij")
        r = np.sqrt(X**2 + Y**2 + Zg**2)
        total = arr.sum() * dx**3
        return (arr * r).sum() * dx**3 / total

    assert mean_r(2) < mean_r(1), "Z=2 should have smaller ⟨r⟩ than Z=1"
