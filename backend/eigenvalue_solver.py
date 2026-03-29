"""Eigenvalue solver for stationary quantum states.

All quantities in atomic units: ħ = m_e = 1.
"""

import logging
import warnings
from dataclasses import dataclass

import numpy as np
from scipy.sparse import spmatrix
from scipy.sparse.linalg import eigsh, ArpackNoConvergence

logger = logging.getLogger(__name__)


@dataclass
class EigenstateResult:
    energies: np.ndarray       # shape (k,), ascending order
    wavefunctions: np.ndarray  # shape (k, grid.n), each row is one ψ
    grid_x: np.ndarray         # shape (grid.n,) — x coordinates
    dx: float                  # grid spacing
    converged: bool            # did eigensolver converge?
    norm_errors: np.ndarray    # |1 - ||ψ_i||²| for each eigenstate


def solve_eigenstates(
    hamiltonian: spmatrix,
    grid_x: np.ndarray,
    dx: float,
    k: int = 5,
) -> EigenstateResult:
    """Solve H ψ = E ψ and return the lowest k eigenstates.

    Uses scipy.sparse.linalg.eigsh with which='SM'.
    Wavefunctions are normalized so that sum(|ψ|²)*dx == 1.
    Energies are returned in ascending order.
    Sign convention: the first non-negligible element of each ψ is positive.

    All quantities in atomic units: ħ = m_e = 1.
    """
    converged = True
    try:
        eigenvalues, eigenvectors = eigsh(hamiltonian, k=k, which="SM")
    except ArpackNoConvergence as exc:
        logger.warning("eigsh did not converge: %s", exc)
        eigenvalues = exc.eigenvalues
        eigenvectors = exc.eigenvectors
        converged = False

    # Sort by energy ascending
    order = np.argsort(eigenvalues)
    eigenvalues = eigenvalues[order]
    eigenvectors = eigenvectors[:, order]  # columns are eigenvectors

    # Normalize and apply sign convention
    wavefunctions = []
    for i in range(eigenvectors.shape[1]):
        psi = eigenvectors[:, i]
        psi /= np.sqrt(np.sum(psi ** 2) * dx)
        # Sign: first element with |ψ| > 1e-10 should be positive
        first_sig = psi[np.abs(psi) > 1e-10]
        if len(first_sig) > 0 and first_sig[0] < 0:
            psi = -psi
        wavefunctions.append(psi)

    wavefunctions = np.array(wavefunctions)  # shape (k, n)
    norm_errors = np.array([abs(1.0 - np.sum(psi ** 2) * dx) for psi in wavefunctions])

    return EigenstateResult(
        energies=eigenvalues,
        wavefunctions=wavefunctions,
        grid_x=grid_x,
        dx=dx,
        converged=converged,
        norm_errors=norm_errors,
    )
