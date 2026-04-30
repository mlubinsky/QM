"""2-D orbital cross-section for hydrogen-like wavefunctions.

Computes |ψ(x, 0, z)|² on a square grid in the xz-plane (y = 0).

    |ψ(x,0,z)|² = |R_nl(r)|² · |Y_l^m(θ, φ)|²

where:
    r = sqrt(x² + z²)
    θ = arccos(z / r)   polar angle from z-axis
    φ = 0               azimuthal angle (xz-plane)

Note: |Y_l^m(θ,φ)|² is independent of φ because |e^{imφ}| = 1,
so passing φ = 0 everywhere is exact.

R_nl is recovered from the numerical u_nl via  R_nl = u_nl / r.
scipy.special.sph_harm signature: sph_harm(m, l, phi, theta).
"""

from dataclasses import dataclass

import numpy as np
try:
    from scipy.special import sph_harm_y as _sph_harm_y
    def sph_harm(m: int, l: int, phi: float, theta) -> "np.ndarray":  # type: ignore[override]
        return _sph_harm_y(l, m, theta, phi)
except ImportError:
    from scipy.special import sph_harm  # SciPy < 1.15


@dataclass
class OrbitalResult:
    x_axis: np.ndarray    # shape (grid_points,)
    z_axis: np.ndarray    # shape (grid_points,)
    density: np.ndarray   # shape (grid_points, grid_points), |ψ(x,0,z)|²


def xz_cross_section(
    r: np.ndarray,
    u: np.ndarray,
    l: int,
    m: int,
    grid_points: int = 120,
) -> OrbitalResult:
    """Compute |ψ(x,0,z)|² on a square xz grid.

    Parameters
    ----------
    r : array, shape (n_points,)
        Radial grid (atomic units).
    u : array, shape (n_points,)
        Radial function u_nl = r·R_nl, normalised so ∫u² dr = 1.
    l, m : int
        Angular momentum and magnetic quantum numbers.
    grid_points : int
        Number of pixels per axis in the output density map.

    Returns
    -------
    OrbitalResult
        Square x and z axes and the 2-D probability density.
    """
    extent = 1.5 * r[-1]
    x_axis = np.linspace(-extent, extent, grid_points)
    z_axis = np.linspace(-extent, extent, grid_points)

    XX, ZZ = np.meshgrid(x_axis, z_axis)           # both shape (gp, gp)

    r_vals = np.sqrt(XX ** 2 + ZZ ** 2)
    r_vals = np.clip(r_vals, r[0], r[-1])           # avoid r=0 and r>r_max

    # Polar angle θ ∈ [0, π]
    cos_theta = np.clip(ZZ / np.where(r_vals > 0, r_vals, 1e-30), -1.0, 1.0)
    theta = np.arccos(cos_theta)

    # R_nl(r) = u(r) / r — interpolate from the radial grid
    R_nl = u / r
    R_interp = np.interp(r_vals, r, R_nl)

    # |Y_l^m(θ, φ=0)|²
    Y = sph_harm(m, l, 0.0, theta)                 # complex, shape (gp, gp)
    Y_sq = np.abs(Y) ** 2

    density = np.maximum(R_interp ** 2 * Y_sq, 0.0)

    return OrbitalResult(x_axis=x_axis, z_axis=z_axis, density=density)
