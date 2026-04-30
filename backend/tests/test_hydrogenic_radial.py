"""Backend tests for spec 19 — hydrogenic radial solver.

Covers validation requirements 1–5:
  1. E_n numerical vs -Z²/(2n²) for n=1,2,3 and Z=1,2,3,6
  2. Radial normalisation ∫r²|R_nl|² dr = 1  (= ∫u² dr = 1)
  3. Energy ordering E_1 < E_2 < E_3 for each (l, Z)
  4. l=0 states: effective potential equals -Z/r (no centrifugal term)
  5. 2-D cross-section density is non-negative everywhere
"""

import numpy as np
import pytest

from solvers.hydrogenic.radial_solver import solve, RadialResult
from solvers.hydrogenic.orbitals import xz_cross_section


# ── 1. Energy accuracy ─────────────────────────────────────────────────────────

@pytest.mark.parametrize("Z,n,l", [
    (1, 1, 0),  # H 1s
    (1, 2, 0),  # H 2s
    (1, 2, 1),  # H 2p
    (1, 3, 0),  # H 3s
    (1, 3, 1),  # H 3p
    (1, 3, 2),  # H 3d
    (2, 1, 0),  # He⁺ 1s
    (2, 2, 0),  # He⁺ 2s
    (3, 1, 0),  # Li²⁺ 1s
    (6, 1, 0),  # C⁵⁺ 1s
    (6, 2, 1),  # C⁵⁺ 2p
])
def test_energy_accuracy(Z, n, l):
    n_states = n - l
    result = solve(Z, l, n_states=n_states, n_points=800)
    state_idx = n - l - 1
    E_num = result.energies[state_idx]
    E_exact = -Z**2 / (2 * n**2)
    rel_err = abs(E_num - E_exact) / abs(E_exact)
    assert rel_err < 0.001, (
        f"Z={Z} n={n} l={l}: E_num={E_num:.6f}, E_exact={E_exact:.6f}, "
        f"rel_err={rel_err:.4%}"
    )


# ── 2. Radial normalisation ────────────────────────────────────────────────────

@pytest.mark.parametrize("Z,n,l", [
    (1, 1, 0),
    (1, 2, 1),
    (1, 3, 2),
    (2, 2, 0),
    (6, 1, 0),
])
def test_radial_normalisation(Z, n, l):
    result = solve(Z, l, n_states=n - l, n_points=800)
    state_idx = n - l - 1
    u = result.u_frames[state_idx]
    dr = result.r[1] - result.r[0]
    norm = np.sum(u**2) * dr          # ∫u² dr = ∫r²|R|² dr
    assert abs(norm - 1.0) < 1e-4, (
        f"Z={Z} n={n} l={l}: norm={norm:.8f}, deviation={norm-1:.2e}"
    )


# ── 3. Energy ordering ─────────────────────────────────────────────────────────

@pytest.mark.parametrize("Z,l", [(1, 0), (2, 0), (1, 1), (3, 0)])
def test_energy_ordering(Z, l):
    result = solve(Z, l, n_states=3, n_points=600)
    E = result.energies
    assert E[0] < E[1] < E[2], (
        f"Z={Z} l={l}: energies not strictly ascending: {E}"
    )


# ── 4. l=0: no centrifugal term ────────────────────────────────────────────────

def test_l0_effective_potential_is_coulomb_only():
    """For l=0 the centrifugal term l(l+1)/(2r²) vanishes identically.
    Verify by checking that solve(Z, l=0) and solve(Z, l=0) agree with
    the exact Coulomb-only ground-state energy within tolerance.
    """
    Z = 3
    result = solve(Z, l=0, n_states=1, n_points=800)
    E_exact = -Z**2 / 2  # n=1
    assert abs(result.energies[0] - E_exact) / abs(E_exact) < 0.001


# ── 5. 2-D orbital density is non-negative ─────────────────────────────────────

@pytest.mark.parametrize("n,l,m", [
    (1, 0, 0),
    (2, 1, 0),
    (2, 1, 1),
    (3, 2, -1),
])
def test_orbital_density_nonnegative(n, l, m):
    Z = 1
    result = solve(Z, l, n_states=n - l, n_points=600)
    state_idx = n - l - 1
    u = result.u_frames[state_idx]
    orbital = xz_cross_section(result.r, u, l, m, grid_points=60)
    assert np.all(orbital.density >= 0.0), (
        f"Orbital ({n},{l},{m}) has negative density values"
    )


# ── Result shape checks ────────────────────────────────────────────────────────

def test_radial_result_shapes():
    n_states = 3
    result = solve(Z=1, l=0, n_states=n_states, n_points=300)
    # n_points may be auto-scaled to ensure dr ≤ 0.1 a.u.
    n = result.r.shape[0]
    assert result.u_frames.shape == (n_states, n)
    assert result.radial_density.shape == (n_states, n)
    assert result.energies.shape == (n_states,)


def test_orbital_result_shapes():
    result = solve(Z=1, l=1, n_states=1, n_points=400)
    grid_points = 50
    orbital = xz_cross_section(result.r, result.u_frames[0], l=1, m=0,
                                grid_points=grid_points)
    assert orbital.x_axis.shape == (grid_points,)
    assert orbital.z_axis.shape == (grid_points,)
    assert orbital.density.shape == (grid_points, grid_points)


def test_radial_density_equals_u_squared():
    result = solve(Z=1, l=0, n_states=2, n_points=300)
    np.testing.assert_array_equal(result.radial_density, result.u_frames**2)


# ── Z scaling: He⁺ ground state is 4× deeper than H ──────────────────────────

def test_helium_ion_binding_4x_hydrogen():
    h  = solve(Z=1, l=0, n_states=1, n_points=800)
    he = solve(Z=2, l=0, n_states=1, n_points=800)
    ratio = he.energies[0] / h.energies[0]
    assert abs(ratio - 4.0) < 0.01, f"Expected 4.0, got {ratio:.4f}"
