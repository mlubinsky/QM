"""Probability current density for 1D wavefunctions.

All quantities in atomic units: ħ = m = 1.

The probability current is:
    J(x,t) = Im[ ψ*(x,t) · ∂ψ(x,t)/∂x ]

It satisfies the continuity equation:
    ∂|ψ|²/∂t + ∂J/∂x = 0
"""

import numpy as np


def compute(psi: np.ndarray, dx: float) -> np.ndarray:
    """Probability current density J(x) = Im[ψ* · ∂ψ/∂x].

    Parameters
    ----------
    psi : complex wavefunction on the position grid, shape (N,)
    dx  : grid spacing (a.u.)

    Returns
    -------
    J : real array of shape (N,), units 1/a.u.²
    """
    dpsi_dx = np.gradient(psi, dx)
    return np.imag(np.conj(psi) * dpsi_dx)
