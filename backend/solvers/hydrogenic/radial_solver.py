"""Radial Schrödinger solver for hydrogen-like atoms.

Substituting u(r) = r · R(r) into the 3-D Schrödinger equation with
the Coulomb potential V(r) = -Z/r gives the 1-D problem

    -½ d²u/dr²  +  V_eff(r) · u  =  E · u

    V_eff(r) = -Z/r  +  l(l+1)/(2r²)

which has the same form as the existing 1-D solver.  Dirichlet BCs
u(r_min) = u(r_max) = 0 are physically appropriate:
  - u(0) = 0  because ψ must be finite at the origin (r·R → 0)
  - u(r_max) = 0  because bound-state wavefunctions decay to zero

Exact eigenvalues (atomic units, ħ = m_e = 1):
    E_n = -Z² / (2n²)

All quantities in atomic units.
"""

from dataclasses import dataclass

import numpy as np

from shared.grid import Grid
from solvers.schrodinger_1d.hamiltonian import build_hamiltonian
from solvers.schrodinger_1d.eigenvalue_solver import solve_eigenstates


@dataclass
class RadialResult:
    r: np.ndarray              # shape (n_points,), radial grid in Bohr
    u_frames: np.ndarray       # shape (n_states, n_points), u_nl = r·R_nl
    radial_density: np.ndarray # shape (n_states, n_points), u² = r²|R|²
    energies: np.ndarray       # shape (n_states,), Hartree, ascending


def solve(Z: int, l: int, n_states: int = 5, n_points: int = 800) -> RadialResult:
    """Solve the radial equation for a hydrogen-like atom.

    Parameters
    ----------
    Z : int
        Nuclear charge (1 = hydrogen, 2 = He⁺, …).
    l : int
        Angular momentum quantum number (0 = s, 1 = p, …).
    n_states : int
        Number of radial eigenstates to compute (n_states lowest).
    n_points : int
        Number of radial grid points.

    Returns
    -------
    RadialResult
        Radial grid, normalised u-frames, radial probability densities,
        and energy eigenvalues in ascending order.
    """
    # Grid: extent chosen so that the highest-n orbital fits comfortably.
    # n_max is a safe upper bound for the principal quantum number of the
    # states we are computing.
    n_max = l + n_states
    r_min = 1e-5
    # Scale r_max so the grid spans ~20 Bohr radii (a_Z = 1/Z) in units of
    # the highest-n orbital.  For Z=1: r_max=20 a.u.; for Z=6: r_max≈3.3 a.u.
    r_max = max(3.0, 20.0 * n_max ** 2 / Z)

    # Ensure dr ≤ 0.1 a.u. regardless of r_max, so nodes of higher-n orbitals
    # (e.g. 3s inner node at r≈1.9) are always well-resolved.
    n_points = max(n_points, int(r_max / 0.1) + 1)

    r = np.linspace(r_min, r_max, n_points)

    V_eff = -Z / r + 0.5 * l * (l + 1) / r ** 2

    # Reuse the 1-D Hamiltonian builder with r as the spatial coordinate.
    # Grid is created with the same n_points and (r_min, r_max).
    grid = Grid(n_points, r_min, r_max)
    H = build_hamiltonian(grid, V_eff)

    result = solve_eigenstates(H, r, grid.dx, k=n_states)

    # result.wavefunctions are already normalised: ∫|u|² dr = 1
    # which equals ∫r²|R|² dr = 1 since u = r·R.
    u_frames = result.wavefunctions          # shape (n_states, n_points)
    radial_density = u_frames ** 2           # r²|R|² = u²

    return RadialResult(
        r=r,
        u_frames=u_frames,
        radial_density=radial_density,
        energies=result.energies,
    )
