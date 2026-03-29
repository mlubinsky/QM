import numpy as np
import scipy.sparse as sp


def build_hamiltonian(grid, potential: np.ndarray) -> sp.spmatrix:
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
