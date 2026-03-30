"""Expectation values of quantum mechanical observables.

All quantities in atomic units: ħ = m_e = 1.
"""

from dataclasses import dataclass

import numpy as np
from scipy.sparse import spmatrix


@dataclass
class ExpectationValues:
    x: float              # ⟨x⟩
    x2: float             # ⟨x²⟩
    p: float              # ⟨p⟩
    p2: float             # ⟨p²⟩
    H: float              # ⟨H⟩
    delta_x: float        # √(⟨x²⟩ − ⟨x⟩²)
    delta_p: float        # √(⟨p²⟩ − ⟨p⟩²)
    delta_x_delta_p: float  # uncertainty product


def compute(
    psi: np.ndarray,
    grid_x: np.ndarray,
    dx: float,
    hamiltonian: spmatrix,
    potential: np.ndarray,
) -> ExpectationValues:
    """Compute expectation values for normalized state psi.

    Uses:
      ⟨x⟩   = ∫ x |ψ|² dx
      ⟨x²⟩  = ∫ x² |ψ|² dx
      ⟨p⟩   = −i ∫ ψ* ∂ψ/∂x dx  (numpy central differences)
      ⟨H⟩   = ⟨ψ|H|ψ⟩ · dx
      ⟨V⟩   = ∫ V |ψ|² dx
      ⟨p²⟩  = 2(⟨H⟩ − ⟨V⟩)      (from ⟨T⟩ = ⟨H⟩ − ⟨V⟩, T = p²/2)

    All quantities in atomic units: ħ = m_e = 1.
    """
    prob = np.abs(psi) ** 2

    x_mean = float(np.sum(grid_x * prob) * dx)
    x2_mean = float(np.sum(grid_x ** 2 * prob) * dx)

    # ⟨p⟩ = −i ∫ ψ* (∂ψ/∂x) dx
    dpsi_dx = np.gradient(psi, dx)
    p_mean = float(np.real(-1j * np.sum(np.conj(psi) * dpsi_dx) * dx))

    # ⟨H⟩ via sparse matrix-vector product
    H_mean = float(np.real(np.conj(psi) @ (hamiltonian @ psi)) * dx)

    # ⟨V⟩ and ⟨p²⟩ = 2⟨T⟩ = 2(⟨H⟩ − ⟨V⟩)
    V_mean = float(np.sum(prob * potential) * dx)
    p2_mean = 2.0 * (H_mean - V_mean)

    # Uncertainties — clamp to zero before sqrt to guard against tiny negatives
    delta_x = float(np.sqrt(max(x2_mean - x_mean ** 2, 0.0)))
    delta_p = float(np.sqrt(max(p2_mean - p_mean ** 2, 0.0)))

    return ExpectationValues(
        x=x_mean,
        x2=x2_mean,
        p=p_mean,
        p2=p2_mean,
        H=H_mean,
        delta_x=delta_x,
        delta_p=delta_p,
        delta_x_delta_p=delta_x * delta_p,
    )
