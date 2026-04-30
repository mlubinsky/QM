"""Tests for potentials with negative-energy bound states.

These tests expose the which='SM' vs which='SA' bug in eigenvalue_solver.py.
which='SM' (smallest magnitude) finds eigenvalues closest to zero, so it
returns near-zero free-particle states instead of the deeply-negative bound
states of a finite square well.  which='SA' (smallest algebraic) returns the
most negative eigenvalues first, which is what quantum mechanics requires.
"""

import numpy as np
import pytest

from grid import Grid
from hamiltonian import build_hamiltonian
from eigenvalue_solver import solve_eigenstates


# ---------------------------------------------------------------------------
# Finite square well: V = -10 for |x| < 3, 0 outside
#
# Analytical bound-state energies for a symmetric finite square well:
#   Inside:  k² = 2(E + V₀)
#   Outside: κ² = -2E
#   Even states:  k tan(ka) = κ
#   Odd states:  -k cot(ka) = κ
#
# With V₀ = 10, a = 3:  z₀ = a√(2V₀) ≈ 13.4  →  ~9 bound states
# Ground state energy E₀ ≈ -9.86 a.u. (tight-binding limit: π²/(2·(2a)²) - V₀)
# ---------------------------------------------------------------------------

@pytest.fixture
def fsw():
    """Finite square well on a wide enough box to approximate infinite space."""
    g = Grid(600, -15.0, 15.0)
    V = -10.0 * (np.abs(g.x) < 3.0).astype(float)
    H = build_hamiltonian(g, V)
    return solve_eigenstates(H, g.x, g.dx, k=5)


def test_fsw_ground_state_is_negative(fsw):
    """Ground state of a finite square well must have E < 0 (it is bound)."""
    assert fsw.energies[0] < 0, (
        f"Ground state energy should be negative; got {fsw.energies[0]:.6f}. "
        "This fails with which='SM' because ARPACK returns near-zero free-particle "
        "states instead of the deeply-negative bound states."
    )


def test_fsw_all_returned_states_are_bound(fsw):
    """All 5 returned states should be bound (E < 0) — the well is deep enough."""
    assert len(fsw.energies) == 5, (
        f"Expected 5 eigenstates; got {len(fsw.energies)}. "
        "which='SM' causes ARPACK non-convergence for negative-eigenvalue problems."
    )
    for n, E in enumerate(fsw.energies):
        assert E < 0, (
            f"State n={n} should be a bound state (E < 0); got E={E:.6f}. "
            "which='SM' returns states near E≈0 instead of the bound states."
        )


def test_fsw_ground_state_energy_approximately_correct(fsw):
    """Ground state energy should be near the deep-well limit: π²/(8a²) - V₀."""
    a = 3.0
    V0 = 10.0
    # Deep-well limit: ground state kinetic energy ≈ π²/(2·(2a)²) = π²/(8a²)
    E0_approx = np.pi**2 / (8 * a**2) - V0
    E0_num = fsw.energies[0]
    # Allow 5% relative error — the deep-well approximation is not exact
    assert abs(E0_num - E0_approx) / abs(E0_approx) < 0.05, (
        f"Ground state energy: got {E0_num:.4f}, deep-well estimate {E0_approx:.4f}"
    )


def test_fsw_energies_ascending(fsw):
    """Returned energies must be sorted ascending regardless of which= choice."""
    assert np.all(np.diff(fsw.energies) > 0), (
        f"Energies not ascending: {fsw.energies}"
    )


def test_fsw_normalization(fsw):
    """Wavefunctions from a negative-eigenvalue solve must still be normalized."""
    for n, psi in enumerate(fsw.wavefunctions):
        norm_sq = np.sum(np.abs(psi) ** 2) * fsw.dx
        assert abs(norm_sq - 1.0) < 1e-6, (
            f"ψ_{n} norm²={norm_sq:.10f}, expected 1.0"
        )


# ---------------------------------------------------------------------------
# Step potential: V = 5 for x > 0, 0 for x < 0
#
# In a box with Dirichlet BCs, ALL eigenvalues are positive (no bound states).
# However, the lowest-energy states (E < 5) are quasi-bound on the left side.
# Critically, the lowest eigenstates should have E < 5 (below the step height),
# confirming the solver returns the physically correct low-energy states.
# ---------------------------------------------------------------------------

@pytest.fixture
def step():
    """Step potential V = 5·Θ(x) in a symmetric box."""
    g = Grid(500, -10.0, 10.0)
    V = 5.0 * (g.x > 0).astype(float)
    H = build_hamiltonian(g, V)
    return solve_eigenstates(H, g.x, g.dx, k=5)


def test_step_lowest_states_below_barrier(step):
    """Lowest states of the step potential must have E < V_step = 5 a.u.

    With which='SM' and a shifted spectrum (all positive eigenvalues) ARPACK
    still returns the correct small eigenvalues, so this test passes either way.
    It documents expected physical behaviour.
    """
    V_step = 5.0
    for n, E in enumerate(step.energies):
        assert E < V_step, (
            f"State n={n}: energy {E:.4f} should be below the step height {V_step}"
        )


def test_step_energies_ascending(step):
    assert np.all(np.diff(step.energies) > 0), (
        f"Step-potential energies not ascending: {step.energies}"
    )


def test_step_normalization(step):
    for n, psi in enumerate(step.wavefunctions):
        norm_sq = np.sum(np.abs(psi) ** 2) * step.dx
        assert abs(norm_sq - 1.0) < 1e-6, (
            f"ψ_{n} norm²={norm_sq:.10f}, expected 1.0"
        )
