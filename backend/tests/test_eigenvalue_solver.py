import numpy as np
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from grid import Grid
from hamiltonian import build_hamiltonian
from eigenvalue_solver import solve_eigenstates


# --- fixtures ---

@pytest.fixture
def infinite_square_well():
    """Infinite Square Well: L=1, n=500."""
    g = Grid(500, 0, 1.0)
    V = np.zeros(g.n)
    H = build_hamiltonian(g, V)
    result = solve_eigenstates(H, g.x, g.dx, k=5)
    return result


@pytest.fixture
def harmonic_oscillator():
    """Harmonic Oscillator: x in [-8,8], V=x^2/2, n=500."""
    g = Grid(500, -8.0, 8.0)
    V = 0.5 * g.x ** 2
    H = build_hamiltonian(g, V)
    result = solve_eigenstates(H, g.x, g.dx, k=5)
    return result


# --- infinite square well ---

def test_isw_energies(infinite_square_well):
    L = 1.0
    for n in range(1, 6):
        E_exact = n ** 2 * np.pi ** 2 / (2 * L ** 2)
        E_num = infinite_square_well.energies[n - 1]
        assert abs(E_num - E_exact) / E_exact < 0.005, (
            f"Infinite Square Well n={n}: got {E_num:.6f}, expected {E_exact:.6f}"
        )


# --- harmonic oscillator ---

def test_ho_energies(harmonic_oscillator):
    for n in range(5):
        E_exact = n + 0.5
        E_num = harmonic_oscillator.energies[n]
        assert abs(E_num - E_exact) / E_exact < 0.005, (
            f"Harmonic Oscillator n={n}: got {E_num:.6f}, expected {E_exact:.6f}"
        )


# --- normalization ---

def test_normalization(infinite_square_well):
    for i, psi in enumerate(infinite_square_well.wavefunctions):
        norm_sq = np.sum(psi ** 2) * infinite_square_well.dx
        assert abs(norm_sq - 1.0) < 1e-6, (
            f"ψ_{i} norm^2={norm_sq:.10f}, expected 1.0"
        )


# --- orthogonality ---

def test_orthogonality(infinite_square_well):
    k = len(infinite_square_well.wavefunctions)
    for i in range(k):
        for j in range(i + 1, k):
            overlap = abs(
                np.sum(infinite_square_well.wavefunctions[i]
                       * infinite_square_well.wavefunctions[j])
                * infinite_square_well.dx
            )
            assert overlap < 1e-6, f"<ψ_{i}|ψ_{j}>={overlap:.2e}"


# --- ordering ---

def test_energies_ascending(infinite_square_well):
    assert np.all(np.diff(infinite_square_well.energies) > 0)
