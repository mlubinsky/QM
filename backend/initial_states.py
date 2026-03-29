"""Factory functions for initial wavefunctions ψ₀.

All quantities in atomic units: ħ = m_e = 1.
"""

import numpy as np


def gaussian_packet(
    grid_x: np.ndarray,
    dx: float,
    x0: float,
    sigma: float,
    k0: float = 0.0,
) -> np.ndarray:
    """Return a normalized Gaussian wave packet.

    ψ(x) = A * exp(-(x-x0)²/4σ²) * exp(i*k0*x)
    A chosen so that ||ψ||²*dx = 1.

    All quantities in atomic units: ħ = m_e = 1.
    """
    psi = np.exp(-((grid_x - x0) ** 2) / (4 * sigma ** 2)) * np.exp(1j * k0 * grid_x)
    norm = np.sqrt(np.sum(np.abs(psi) ** 2) * dx)
    return psi / norm


def eigenstate_superposition(
    wavefunctions: np.ndarray,
    coefficients: np.ndarray,
    dx: float,
) -> np.ndarray:
    """Return a normalized superposition of eigenstates.

    ψ = Σ c_n ψ_n,  normalized so that ||ψ||²*dx = 1.

    All quantities in atomic units: ħ = m_e = 1.
    """
    coefficients = np.asarray(coefficients, dtype=complex)
    psi = coefficients @ wavefunctions  # shape (grid.n,)
    norm = np.sqrt(np.sum(np.abs(psi) ** 2) * dx)
    return psi / norm
