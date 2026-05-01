"""Spin-½ physics — pure functions, no I/O.

All quantities in atomic units (ħ = m_e = 1).
"""

import math
import numpy as np


def bloch_vector(theta: float, phi: float) -> np.ndarray:
    """Bloch vector r from spherical angles (θ, φ). |r| = 1."""
    return np.array([
        math.sin(theta) * math.cos(phi),
        math.sin(theta) * math.sin(phi),
        math.cos(theta),
    ])


def measure_probabilities(
    theta: float,
    phi: float,
    axis: np.ndarray,
) -> tuple[float, float]:
    """Return (p_plus, p_minus) for measuring state (θ,φ) along unit axis n̂.

    P(+n̂) = (1 + n̂·r) / 2
    """
    r = bloch_vector(theta, phi)
    p_plus = float(np.clip((1.0 + np.dot(axis, r)) / 2.0, 0.0, 1.0))
    return p_plus, 1.0 - p_plus


def axis_label(axis: np.ndarray) -> str:
    """Return 'x', 'y', 'z', or 'custom' for a unit axis vector."""
    tol = 1e-9
    if abs(axis[0] - 1) < tol: return "x"
    if abs(axis[1] - 1) < tol: return "y"
    if abs(axis[2] - 1) < tol: return "z"
    return "custom"


PAULI_DATA = {
    "sigma_x": {
        "re": [[0, 1], [1, 0]],
        "im": [[0, 0], [0, 0]],
    },
    "sigma_y": {
        "re": [[0, 0], [0, 0]],
        "im": [[0, -1], [1, 0]],
    },
    "sigma_z": {
        "re": [[1, 0], [0, -1]],
        "im": [[0, 0], [0, 0]],
    },
    "eigenvalues": [-1, 1],
    "eigenvectors": {
        # eigenvectors as [re, im] for each component
        "sigma_x": {
            "plus":  [round(1/math.sqrt(2), 10),  round(1/math.sqrt(2), 10)],
            "minus": [round(1/math.sqrt(2), 10), -round(1/math.sqrt(2), 10)],
        },
        "sigma_y": {
            "plus":  [round(1/math.sqrt(2), 10),  round(1/math.sqrt(2), 10)],
            "minus": [round(1/math.sqrt(2), 10), -round(1/math.sqrt(2), 10)],
        },
        "sigma_z": {
            "plus":  [1.0, 0.0],
            "minus": [0.0, 1.0],
        },
    },
}
