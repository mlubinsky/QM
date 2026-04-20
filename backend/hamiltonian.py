"""Hamiltonian matrix builder for the 1-D Schrödinger equation.

The Hamiltonian is H = T + V where:

  T = −(ħ²/2m) d²/dx²    kinetic energy operator (ħ = m = 1 in atomic units)
  V = diag(V(xᵢ))          potential energy on the grid

Spatial discretisation
----------------------
The second derivative is approximated with the 3-point central-difference
stencil on a uniform grid of spacing dx:

    (d²ψ/dx²)ᵢ ≈ (ψᵢ₋₁ − 2ψᵢ + ψᵢ₊₁) / dx²      O(dx²) accuracy

This gives a tridiagonal kinetic-energy matrix T with entries:

    T_ii      = +1/dx²
    T_{i,i±1} = −1/(2dx²)

Boundary conditions
-------------------
Dirichlet BCs (ψ = 0 at both walls) are enforced by zeroing the boundary
rows and columns of T and placing a large sentinel value on the diagonal.
The sentinel is chosen large enough that boundary modes lie far above the
physical spectrum, so they are not returned by the ARPACK eigensolver.

All quantities in atomic units: ħ = m_e = 1.
"""

import numpy as np
import scipy.sparse as sp


def build_hamiltonian(grid, potential: np.ndarray) -> sp.spmatrix:
    """Build the sparse Hamiltonian matrix H = T + V.

    Parameters
    ----------
    grid : Grid
        Uniform 1-D spatial grid (see ``grid.py``).
    potential : np.ndarray
        Potential energy V(x) evaluated on the grid, shape ``(grid.n,)``,
        in atomic units (Hartree).

    Returns
    -------
    H : scipy.sparse.csr_matrix
        Sparse Hamiltonian of shape ``(grid.n, grid.n)`` in atomic units.
        Boundary rows/columns are zeroed and a large sentinel is placed on
        the diagonal to enforce Dirichlet BCs without distorting the
        interior spectrum.

    Notes
    -----
    The 3-point finite-difference stencil approximates −(1/2)d²/dx²
    to O(dx²) accuracy:

        T_ii      = +1/dx²
        T_{i,i±1} = −1/(2dx²)

    The sentinel value on the boundary diagonal is chosen as
    ``(1/dx²) × n²``, placing boundary modes at energies far above
    any physical eigenstate of interest.
    """
    n = grid.n
    dx2 = grid.dx ** 2

    diag = np.ones(n) / dx2
    off = -0.5 * np.ones(n - 1) / dx2

    T = sp.diags([off, diag, off], [-1, 0, 1], shape=(n, n), format="lil")

    # Enforce Dirichlet BCs (ψ=0 at walls): zero boundary rows and columns,
    # place a large sentinel on the diagonal so boundary modes don't pollute
    # the physical spectrum found by eigsh.
    large = diag[0] * n ** 2
    for b in (0, -1):
        T[b, :] = 0
        T[:, b] = 0
        T[b, b] = large

    T = T.tocsr()
    V = sp.diags(potential, 0, shape=(n, n), format="csr")
    return T + V
