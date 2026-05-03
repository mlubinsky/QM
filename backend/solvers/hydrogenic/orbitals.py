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
from scipy.special import eval_genlaguerre, factorial
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


def orbital_isosurface(
    n: int,
    l: int,
    m: int,
    Z: int,
    grid_size: int = 30,
) -> tuple[list[float], list[float]]:
    """Compute |ψ_nlm(x,y,z)|² on a uniform 3-D Cartesian grid.

    Uses the closed-form analytic hydrogen-like wavefunction:
        ψ_nlm = R_nl(r) · Y_l^m(θ, φ)
    where R_nl is built from the associated Laguerre polynomial via
    scipy.special.eval_genlaguerre and Y_l^m via the existing sph_harm
    wrapper (handles scipy ≥ 1.15 API change).

    Parameters
    ----------
    n, l, m : int   Principal, angular, magnetic quantum numbers.
    Z       : int   Nuclear charge (1–10).
    grid_size : int Number of points per axis (default 30; use ≥ 40 for
                    accurate normalisation checks).

    Returns
    -------
    axis   : list[float]  1-D symmetric grid, length grid_size.
    values : list[float]  Flattened N³ density in ijk (x-major) order.

    Normalisation
    -------------
    R_nl uses the standard formula (atomic units, a₀ = 1):
        norm = sqrt((2Z/n)³ · (n−l−1)! / (2n · (n+l)!))
        R_nl = norm · exp(−ρ/2) · ρ^l · L_{n−l−1}^{2l+1}(ρ),   ρ = 2Zr/n
    Verified: ∫₀^∞ R_nl² r² dr = 1 for (1,0), (2,0), (2,1).
    """
    # Grid extent: 5 × ⟨r⟩ where ⟨r⟩_nl ≈ n(n+1)/Z for the outermost orbital
    r_max = max(5.0 * n * (n + 1) / Z, 4.0)
    axis = np.linspace(-r_max, r_max, grid_size)

    X, Y, Zg = np.meshgrid(axis, axis, axis, indexing="ij")

    r = np.sqrt(X ** 2 + Y ** 2 + Zg ** 2)
    r_safe = np.where(r < 1e-12, 1e-12, r)

    theta = np.arccos(np.clip(Zg / r_safe, -1.0, 1.0))
    phi   = np.arctan2(Y, X)

    # Radial part
    rho  = 2.0 * Z * r / n
    norm = np.sqrt(
        (2.0 * Z / n) ** 3
        * factorial(n - l - 1)
        / (2.0 * n * factorial(n + l))
    )
    R = norm * np.exp(-rho / 2.0) * (rho ** l) * eval_genlaguerre(n - l - 1, 2 * l + 1, rho)

    # Angular part — reuse the compatibility wrapper already in this module
    Ylm = sph_harm(m, l, phi, theta)

    psi_sq = np.maximum(R ** 2 * np.abs(Ylm) ** 2, 0.0)

    return axis.tolist(), psi_sq.flatten().tolist()
