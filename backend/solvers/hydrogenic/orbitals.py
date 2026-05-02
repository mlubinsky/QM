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


@dataclass
class SphHarmPolar:
    x_curve: np.ndarray   # shape (2*n_theta+1,), closed Cartesian x
    z_curve: np.ndarray   # shape (2*n_theta+1,), closed Cartesian z


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


def spherical_harmonic_polar(l: int, m: int, n_theta: int = 180) -> SphHarmPolar:
    """Closed (x, z) curve of the normalised |Y_l^m(θ)|² polar diagram.

    θ runs 0 → π along the right half; the left half is the mirror image.
    Normalised to max = 1 so the shape fills the plot regardless of l, m.
    """
    theta = np.linspace(0.0, np.pi, n_theta)
    Y = sph_harm(m, l, 0.0, theta)
    r = np.abs(Y) ** 2

    peak = r.max()
    if peak > 0:
        r = r / peak

    x_right = r * np.sin(theta)
    z_right = r * np.cos(theta)
    x_left  = -r[::-1] * np.sin(theta[::-1])
    z_left  =  r[::-1] * np.cos(theta[::-1])

    x_curve = np.concatenate([x_right, x_left, [x_right[0]]])
    z_curve = np.concatenate([z_right, z_left, [z_right[0]]])

    return SphHarmPolar(x_curve=x_curve, z_curve=z_curve)
