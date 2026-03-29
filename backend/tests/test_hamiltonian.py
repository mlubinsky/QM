import numpy as np
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from grid import Grid
from hamiltonian import build_hamiltonian


@pytest.fixture
def well_grid():
    # Infinite square well: L=1, n=1000 points
    return Grid(1000, 0, 1)


@pytest.fixture
def zero_potential(well_grid):
    return np.zeros(well_grid.n)


def test_shape(well_grid, zero_potential):
    H = build_hamiltonian(well_grid, zero_potential)
    assert H.shape == (well_grid.n, well_grid.n)


def test_symmetric(well_grid, zero_potential):
    H = build_hamiltonian(well_grid, zero_potential)
    diff = H - H.T
    assert abs(diff).max() < 1e-10


def test_infinite_square_well_ground_state(well_grid, zero_potential):
    from scipy.sparse.linalg import eigsh
    H = build_hamiltonian(well_grid, zero_potential)
    eigenvalues, _ = eigsh(H, k=1, which="SM")
    E0 = eigenvalues[0]
    L = 1.0
    E0_exact = np.pi**2 / (2 * L**2)
    assert abs(E0 - E0_exact) / E0_exact < 0.001  # within 0.1%
