# Hamiltonian Builder

## Goal
Build a sparse 1D Hamiltonian matrix H = T + V
where T is the kinetic energy operator and V is the potential.

## Interface
build_hamiltonian(grid: Grid, potential: np.ndarray) -> scipy.sparse matrix
- grid: a Grid instance
- potential: array of V(x) values, shape (grid.n,)
- returns: sparse matrix of shape (grid.n, grid.n) in atomic units (ħ=m=1)

## Kinetic energy discretization
Use 3-point finite difference for second derivative:
T_ij = -1/2 * (ψ_{i+1} - 2ψ_i + ψ_{i-1}) / dx²
T is a tridiagonal sparse matrix (use scipy.sparse.diags)

## Tests required
- Matrix is symmetric: H == H.T within 1e-10
- Infinite square well ground state energy within 0.1% of π²/2L²
  (L = x_max - x_min, use eigsh to get lowest eigenvalue)
- Matrix shape is (grid.n, grid.n)

## Do not implement
- Time evolution
- Any eigenvalue solving beyond the test

