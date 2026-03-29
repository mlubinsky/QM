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
def isw():
    """Infinite square well: L=1, n=500."""
    g = Grid(500, 0, 1.0)
    V = np.zeros(g.n)
    H = build_hamiltonian(g, V)
    result = solve_eigenstates(H, g.x, g.dx, k=5)
    return result


@pytest.fixture
def ho():
    """Harmonic oscillator: x in [-8,8], V=x^2/2, n=500."""
    g = Grid(500, -8.0, 8.0)
    V = 0.5 * g.x ** 2
    H = build_hamiltonian(g, V)
    result = solve_eigenstates(H, g.x, g.dx, k=5)
    return result


# --- infinite square well ---

def test_isw_energies(isw):
    L = 1.0
    for n in range(1, 6):
        E_exact = n ** 2 * np.pi ** 2 / (2 * L ** 2)
        E_num = isw.energies[n - 1]
        assert abs(E_num - E_exact) / E_exact < 0.005, (
            f"ISW n={n}: got {E_num:.6f}, expected {E_exact:.6f}"
        )


# --- harmonic oscillator ---

def test_ho_energies(ho):
    for n in range(5):
        E_exact = n + 0.5
        E_num = ho.energies[n]
        assert abs(E_num - E_exact) / E_exact < 0.005, (
            f"HO n={n}: got {E_num:.6f}, expected {E_exact:.6f}"
        )


# --- normalization ---

def test_normalization(isw):
    for i, psi in enumerate(isw.wavefunctions):
        norm_sq = np.sum(psi ** 2) * isw.dx
        assert abs(norm_sq - 1.0) < 1e-6, (
            f"ψ_{i} norm^2={norm_sq:.10f}, expected 1.0"
        )


# --- orthogonality ---

def test_orthogonality(isw):
    k = len(isw.wavefunctions)
    for i in range(k):
        for j in range(i + 1, k):
            overlap = abs(np.sum(isw.wavefunctions[i] * isw.wavefunctions[j]) * isw.dx)
            assert overlap < 1e-6, f"<ψ_{i}|ψ_{j}>={overlap:.2e}"


# --- ordering ---

def test_energies_ascending(isw):
    assert np.all(np.diff(isw.energies) > 0)
