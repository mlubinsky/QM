"""Factory functions for initial wavefunctions ψ₀.

All quantities in atomic units: ħ = m_e = 1.
The unit of length is the Bohr radius (a₀ ≈ 0.529 Å);
the unit of time is ≈ 24.19 attoseconds.
"""

import numpy as np


def gaussian_packet(
    grid_x: np.ndarray,
    dx: float,
    x0: float,
    sigma: float,
    k0: float = 0.0,
) -> np.ndarray:
    """Return a normalised Gaussian wave packet.

    Parameters
    ----------
    grid_x : np.ndarray
        Grid coordinates, shape ``(N,)``, in atomic units (Bohr radii).
    dx : float
        Grid spacing in atomic units.
    x0 : float
        Initial centre of the packet in atomic units.
    sigma : float
        Gaussian width parameter in atomic units.  The probability density
        |ψ|² has standard deviation σ (position uncertainty Δx = σ).
        Momentum uncertainty Δp = 1/(2σ), so Δx·Δp = 1/2 (minimum
        uncertainty state).
    k0 : float, optional
        Initial wavenumber (mean momentum) in atomic units.  The group
        velocity equals k₀ (since m = 1).  Default 0.

    Returns
    -------
    psi : np.ndarray
        Complex wavefunction of shape ``(N,)``, normalised so that
        ``sum(|ψ|²) * dx == 1``.

    Notes
    -----
    The functional form is:

        ψ(x) = A · exp(−(x−x₀)² / 4σ²) · exp(i·k₀·x)

    where A is determined by the normalisation condition ‖ψ‖²·dx = 1.
    The factor 4σ² (not 2σ²) means the probability density |ψ|² is a
    Gaussian with variance σ² (standard deviation σ).
    """
    psi = np.exp(-((grid_x - x0) ** 2) / (4 * sigma ** 2)) * np.exp(1j * k0 * grid_x)
    norm = np.sqrt(np.sum(np.abs(psi) ** 2) * dx)
    return psi / norm


def eigenstate_superposition(
    wavefunctions: np.ndarray,
    coefficients: np.ndarray,
    dx: float,
) -> np.ndarray:
    """Return a normalised superposition of eigenstates.

    Parameters
    ----------
    wavefunctions : np.ndarray
        Array of eigenstates, shape ``(n_states, N)``.  Each row is one
        eigenstate ψₙ, pre-normalised so that ``sum(|ψₙ|²) * dx == 1``.
    coefficients : np.ndarray
        Expansion coefficients cₙ, shape ``(n_states,)``.  May be real or
        complex.  Need not be normalised — the result is always
        re-normalised.
    dx : float
        Grid spacing in atomic units.

    Returns
    -------
    psi : np.ndarray
        Complex wavefunction of shape ``(N,)``, normalised so that
        ``sum(|ψ|²) * dx == 1``.

    Notes
    -----
    Constructs the superposition:

        ψ = Σₙ cₙ ψₙ

    and normalises.  The expectation values of this state will in general
    oscillate at the Bohr transition frequencies (Eₘ − Eₙ) / ħ between
    the constituent eigenstates.

    For real coefficients the initial state is real-valued (up to an
    overall phase), so the probability current J(x, 0) = 0 everywhere.
    """
    coefficients = np.asarray(coefficients, dtype=complex)
    psi = coefficients @ wavefunctions  # shape (N,)
    norm = np.sqrt(np.sum(np.abs(psi) ** 2) * dx)
    return psi / norm
