"""Momentum-space probability density for 1D wavefunctions.

All quantities in atomic units: ħ = m_e = 1.

The momentum-space wavefunction is the Fourier transform of ψ(x):
    φ(k) = (1/√2π) ∫ ψ(x) e^{−ikx} dx

Discrete approximation on a uniform grid:
    |φ(k_j)|² = (Δx² / 2π) · |FFT(ψ)[j]|²

The k-axis after fftshift:
    k_j = 2π · fftfreq(N, d=Δx)

Normalisation (Parseval):
    Σ_j |φ(k_j)|² · Δk = 1    where Δk = 2π / (N · Δx)
"""

import numpy as np


def k_axis(n: int, dx: float) -> np.ndarray:
    """Wavenumber axis in rad/a.u., shifted so zero is in the centre.

    Parameters
    ----------
    n:  number of grid points
    dx: grid spacing (a.u.)

    Returns
    -------
    k : shape (n,), monotonically increasing, centred on 0
    """
    return np.fft.fftshift(np.fft.fftfreq(n, d=dx)) * 2.0 * np.pi


def density(psi: np.ndarray, dx: float) -> np.ndarray:
    """Momentum-space probability density |φ(k)|², fftshifted.

    Normalised so that sum(density) * dk = 1  (where dk = 2π/(N·dx)).

    Parameters
    ----------
    psi : complex wavefunction on the position grid, shape (N,)
    dx  : grid spacing (a.u.)

    Returns
    -------
    rho_k : real, non-negative array of shape (N,), ordered from -k_max to +k_max
    """
    phi = np.fft.fftshift(np.fft.fft(psi))
    return (dx ** 2 / (2.0 * np.pi)) * np.abs(phi) ** 2
