"""Uniform 1-D spatial grid in atomic units.

The unit of length is the Bohr radius (a₀ ≈ 0.529 Å).
The grid is dimension-agnostic by design: the same interface is intended
to support 2-D and 3-D grids in future without changing solver code.

All quantities in atomic units: ħ = m_e = 1.
"""

import numpy as np


class Grid:
    """Uniform 1-D spatial grid with Bohr-radius spacing.

    Parameters
    ----------
    n_points : int
        Number of grid points (including both endpoints).
    x_min : float
        Left boundary in atomic units (Bohr radii).
    x_max : float
        Right boundary in atomic units (Bohr radii).

    Notes
    -----
    Grid spacing is dx = (x_max - x_min) / (n_points - 1).
    The grid includes both endpoints, consistent with Dirichlet
    boundary conditions (ψ = 0 at x_min and x_max).
    """

    def __init__(self, n_points: int, x_min: float, x_max: float):
        self._x = np.linspace(x_min, x_max, n_points)

    @property
    def x(self) -> np.ndarray:
        """Grid coordinates, shape (n_points,), in atomic units (Bohr radii)."""
        return self._x

    @property
    def dx(self) -> float:
        """Uniform grid spacing in atomic units (Bohr radii)."""
        return float(self._x[1] - self._x[0])

    @property
    def n(self) -> int:
        """Number of grid points."""
        return len(self._x)

    @property
    def shape(self) -> tuple:
        """Grid shape as a tuple, e.g. ``(500,)`` for a 1-D grid."""
        return (self.n,)
